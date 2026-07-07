"""
Suspense service — routes anomalous payments to the suspense table.
"""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.suspense import SuspenseItem
from app.db.models.nomba_config import OutboundWebhook
from app.services.webhook_dispatcher import dispatch_event


async def create_suspense_item(
    developer_id: uuid.UUID,
    account_number: str,
    amount_kobo: int,
    sender_name: str | None,
    raw_narration: str | None,
    nomba_reference: str | None,
    reason: str,
    raw_payload: dict,
    db: AsyncSession,
) -> SuspenseItem:
    item = SuspenseItem(
        developer_id=developer_id,
        account_number=account_number,
        amount=amount_kobo,
        sender_name=sender_name,
        raw_narration=raw_narration,
        nomba_reference=nomba_reference,
        reason=reason,
        raw_payload=raw_payload,
    )
    db.add(item)
    await db.flush()

    # Dispatch outbound webhook
    try:
        outbound_result = await db.execute(
            select(OutboundWebhook).where(OutboundWebhook.developer_id == developer_id)
        )
        outbound_webhook = outbound_result.scalar_one_or_none()

        if outbound_webhook and outbound_webhook.is_active:
            await dispatch_event(
                developer_id=developer_id,
                event_type="suspense.created",
                data={
                    "suspense_id": str(item.id),
                    "reason": item.reason,
                    "amount": item.amount,
                    "currency": "NGN",
                    "sender_name": item.sender_name,
                    "account_number": item.account_number,
                },
                webhook_url=outbound_webhook.url,
                signing_secret=outbound_webhook.signing_secret,
                db=db,
            )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to dispatch suspense.created webhook: {str(e)}")

    return item
