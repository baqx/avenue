"""Suspense routes."""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentDeveloper
from app.db.models.developer import Developer
from app.db.models.nomba_config import NombaConfig, OutboundWebhook
from app.db.models.suspense import SuspenseItem
from app.db.models.wallet import Wallet
from app.db.session import get_db
from app.schemas.suspense import FlagSuspenseRequest, ResolveSuspenseRequest, SuspenseItemResponse, SuspenseListResponse
from app.schemas.base import StandardResponse
from typing import Any
from app.core.errors import BadRequestError, NotFoundError
from app.services.ledger import record_credit
from app.services.nomba import initiate_transfer
from app.services.webhook_dispatcher import dispatch_event

router = APIRouter()


@router.get("", response_model=StandardResponse[SuspenseListResponse])
async def list_suspense(
    page: int = Query(1, ge=1), limit: int = Query(20),
    status_filter: str | None = Query(None, alias="status"),
    reason: str | None = Query(None),
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    query = select(SuspenseItem).where(SuspenseItem.developer_id == developer.id)
    if status_filter:
        query = query.where(SuspenseItem.status == status_filter.upper())
    if reason:
        query = query.where(SuspenseItem.reason == reason.upper())
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    result = await db.execute(query.order_by(SuspenseItem.created_at.desc()).offset((page - 1) * limit).limit(limit))
    items = result.scalars().all()
    return StandardResponse(data=SuspenseListResponse(items=[SuspenseItemResponse.model_validate(i) for i in items], total=total, page=page, limit=limit))


@router.get("/{suspense_id}", response_model=StandardResponse[SuspenseItemResponse])
async def get_suspense_item(suspense_id: uuid.UUID, developer: Developer = CurrentDeveloper, db: AsyncSession = Depends(get_db)):
    item = await _get_item_or_404(suspense_id, developer, db)
    return StandardResponse(data=SuspenseItemResponse.model_validate(item))


@router.post("/{suspense_id}/resolve", response_model=StandardResponse[Any])
async def resolve_suspense(
    suspense_id: uuid.UUID, body: ResolveSuspenseRequest,
    developer: Developer = CurrentDeveloper, db: AsyncSession = Depends(get_db),
):
    item = await _get_item_or_404(suspense_id, developer, db)
    if item.status != "PENDING":
        raise BadRequestError("Only PENDING suspense items can be resolved.")

    if body.action == "CREDIT_WALLET":
        if not body.target_wallet_id:
            raise BadRequestError("target_wallet_id is required for CREDIT_WALLET action.")
        result = await db.execute(select(Wallet).where(Wallet.id == body.target_wallet_id, Wallet.developer_id == developer.id))
        wallet = result.scalar_one_or_none()
        if not wallet:
            raise NotFoundError("Target wallet")
        await record_credit(
            wallet=wallet, amount_kobo=item.amount, nomba_reference=item.nomba_reference,
            developer_id=developer.id, sender_name=item.sender_name, sender_account=None,
            raw_narration=item.raw_narration, ai_metadata=None, db=db,
        )

    elif body.action == "REFUND":
        # Check Nomba config
        config_result = await db.execute(select(NombaConfig).where(NombaConfig.developer_id == developer.id))
        nomba_config = config_result.scalar_one_or_none()
        if not nomba_config:
            raise BadRequestError("Nomba config missing. Cannot initiate refund.")

        # Extract customer info from the original webhook payload
        customer = item.raw_payload.get("data", {}).get("customer", {})
        dest_account = customer.get("accountNumber")
        dest_bank_code = customer.get("bankCode")
        dest_name = customer.get("senderName") or "Refund Recipient"

        if not dest_account or not dest_bank_code:
            raise BadRequestError("Cannot automatically refund: Sender's account number or bank code is missing from the original webhook.")

        # Attempt to find the wallet to determine sub-account, fallback to global
        wallet_result = await db.execute(select(Wallet).where(Wallet.account_number == item.account_number, Wallet.developer_id == developer.id))
        wallet = wallet_result.scalar_one_or_none()
        sub_account_id = wallet.nomba_sub_account_id if wallet else nomba_config.sub_account_id

        try:
            await initiate_transfer(
                account_id=nomba_config.account_id,
                client_id=nomba_config.client_id,
                encrypted_secret=nomba_config.encrypted_client_secret,
                destination_account_number=dest_account,
                destination_bank_code=dest_bank_code,
                destination_account_name=dest_name,
                amount_kobo=item.amount,
                narration="Refund: " + (item.raw_narration or "Suspense Reversal"),
                sender_name="Avenue Reversal",
                merchant_tx_ref=f"REFUND-{item.id.hex[:16]}",
                sub_account_id=sub_account_id,
            )
        except Exception as e:
            raise BadRequestError(f"Nomba refund transfer failed: {str(e)}")

    item.status = "RESOLVED"
    item.resolved_at = datetime.now(timezone.utc)
    item.resolved_by = "manual"
    item.resolution_note = body.note
    await db.commit()

    # Dispatch outbound webhook
    try:
        outbound_result = await db.execute(
            select(OutboundWebhook).where(OutboundWebhook.developer_id == developer.id)
        )
        outbound_webhook = outbound_result.scalar_one_or_none()

        if outbound_webhook and outbound_webhook.is_active:
            await dispatch_event(
                developer_id=developer.id,
                event_type="suspense.resolved",
                data={
                    "suspense_id": str(item.id),
                    "action_taken": body.action,
                    "resolved_by": "manual",
                    "target_wallet_id": str(body.target_wallet_id) if body.target_wallet_id else None,
                },
                webhook_url=outbound_webhook.url,
                signing_secret=outbound_webhook.signing_secret,
                db=db,
            )
            await db.commit()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to dispatch suspense.resolved webhook: {str(e)}")

    return StandardResponse(data={"message": "Suspense item resolved.", "action": body.action})


@router.post("/{suspense_id}/flag", response_model=StandardResponse[Any])
async def flag_suspense(
    suspense_id: uuid.UUID, body: FlagSuspenseRequest,
    developer: Developer = CurrentDeveloper, db: AsyncSession = Depends(get_db),
):
    item = await _get_item_or_404(suspense_id, developer, db)
    item.status = "FLAGGED"
    item.resolution_note = body.note
    await db.commit()
    return StandardResponse(data={"message": "Suspense item flagged."})


async def _get_item_or_404(suspense_id: uuid.UUID, developer: Developer, db: AsyncSession) -> SuspenseItem:
    result = await db.execute(select(SuspenseItem).where(SuspenseItem.id == suspense_id, SuspenseItem.developer_id == developer.id))
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundError("Suspense item")
    return item
