"""
Wallet API routes — full CRUD + freeze/close/unfreeze.
"""
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentDeveloper
from app.core.errors import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.db.models.developer import Developer
from app.db.models.nomba_config import NombaConfig
from app.db.models.wallet import Wallet
from app.db.session import get_db
from app.schemas.wallet import (
    CreateWalletRequest,
    UpdateWalletRequest,
    WalletBalanceResponse,
    WalletListResponse,
    WalletResponse,
    TransferRequest,
    TransferResponse,
    WalletReportResponse,
)
from app.services import ledger as ledger_service
from app.services.nomba import create_virtual_account, initiate_transfer
from app.schemas.base import StandardResponse
from typing import Any

router = APIRouter()


def _check_wallet_owner(wallet: Wallet, developer: Developer):
    if wallet.developer_id != developer.id:
        raise ForbiddenError("You do not have access to this wallet.")


@router.post("", response_model=StandardResponse[WalletResponse], status_code=status.HTTP_201_CREATED)
async def create_wallet(
    body: CreateWalletRequest,
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    # Get Nomba config
    result = await db.execute(select(NombaConfig).where(NombaConfig.developer_id == developer.id))
    nomba_config = result.scalar_one_or_none()
    if not nomba_config:
        raise BadRequestError("Please configure your Nomba credentials in Settings before creating wallets.")

    account_name = f"{developer.company_name} / {body.first_name} {body.last_name}"

    # Generate a unique account reference for Nomba (16-64 chars required)
    import uuid as uuid_mod
    account_ref = f"ave_{uuid_mod.uuid4().hex}"  # e.g. "ave_a1b2c3d4..." — 36 chars

    # Call Nomba to provision the NUBAN
    nomba_data = await create_virtual_account(
        account_id=nomba_config.account_id,
        client_id=nomba_config.client_id,
        encrypted_secret=nomba_config.encrypted_client_secret,
        account_ref=account_ref,
        account_name=account_name[:64],
    )

    wallet = Wallet(
        developer_id=developer.id,
        customer_reference=body.customer_reference,
        first_name=body.first_name,
        last_name=body.last_name,
        email=body.email,
        label=body.label,
        currency=body.currency,
        system_prompt=body.system_prompt,
        nomba_account_id=nomba_data["nomba_account_id"],
        account_number=nomba_data["account_number"],
        bank_name=nomba_data["bank_name"],
        account_name=nomba_data["account_name"],
        allow_transfers_out=body.allow_transfers_out,
    )
    db.add(wallet)
    await db.commit()
    await db.refresh(wallet)

    balance = await ledger_service.get_wallet_balance(wallet.id, db)
    return StandardResponse(data=_wallet_to_response(wallet, balance))


@router.get("", response_model=StandardResponse[WalletListResponse])
async def list_wallets(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    customer_reference: str | None = Query(None),
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    query = select(Wallet).where(Wallet.developer_id == developer.id)
    if status_filter:
        query = query.where(Wallet.status == status_filter.upper())
    if customer_reference:
        query = query.where(Wallet.customer_reference == customer_reference)

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar() or 0

    query = query.offset((page - 1) * limit).limit(limit).order_by(Wallet.created_at.desc())
    result = await db.execute(query)
    wallets = result.scalars().all()

    items = []
    for w in wallets:
        balance = await ledger_service.get_wallet_balance(w.id, db)
        items.append(_wallet_to_response(w, balance))

    return StandardResponse(data=WalletListResponse(items=items, total=total, page=page, limit=limit))


@router.get("/{wallet_id}", response_model=StandardResponse[WalletResponse])
async def get_wallet(
    wallet_id: uuid.UUID,
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    wallet = await _get_wallet_or_404(wallet_id, developer, db)
    balance = await ledger_service.get_wallet_balance(wallet.id, db)
    return StandardResponse(data=_wallet_to_response(wallet, balance))


@router.patch("/{wallet_id}", response_model=StandardResponse[WalletResponse])
async def update_wallet(
    wallet_id: uuid.UUID,
    body: UpdateWalletRequest,
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    wallet = await _get_wallet_or_404(wallet_id, developer, db)
    if body.label is not None:
        wallet.label = body.label
    if body.system_prompt is not None:
        wallet.system_prompt = body.system_prompt
    if body.customer_reference is not None:
        wallet.customer_reference = body.customer_reference
    if body.allow_transfers_out is not None:
        wallet.allow_transfers_out = body.allow_transfers_out
    await db.commit()
    await db.refresh(wallet)
    balance = await ledger_service.get_wallet_balance(wallet.id, db)
    return StandardResponse(data=_wallet_to_response(wallet, balance))


@router.post("/{wallet_id}/close", response_model=StandardResponse[WalletResponse])
async def close_wallet(
    wallet_id: uuid.UUID,
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    wallet = await _get_wallet_or_404(wallet_id, developer, db)
    if wallet.status == "CLOSED":
        raise BadRequestError("Wallet is already closed.")
    wallet.status = "CLOSED"
    await db.commit()
    await db.refresh(wallet)
    balance = await ledger_service.get_wallet_balance(wallet.id, db)
    return StandardResponse(data=_wallet_to_response(wallet, balance))


@router.post("/{wallet_id}/freeze", response_model=StandardResponse[WalletResponse])
async def freeze_wallet(
    wallet_id: uuid.UUID,
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    wallet = await _get_wallet_or_404(wallet_id, developer, db)
    if wallet.status != "ACTIVE":
        raise BadRequestError(f"Cannot freeze wallet with status {wallet.status}.")
    wallet.status = "FROZEN"
    await db.commit()
    await db.refresh(wallet)
    balance = await ledger_service.get_wallet_balance(wallet.id, db)
    return StandardResponse(data=_wallet_to_response(wallet, balance))


@router.post("/{wallet_id}/unfreeze", response_model=StandardResponse[WalletResponse])
async def unfreeze_wallet(
    wallet_id: uuid.UUID,
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    wallet = await _get_wallet_or_404(wallet_id, developer, db)
    if wallet.status != "FROZEN":
        raise BadRequestError("Wallet is not frozen.")
    wallet.status = "ACTIVE"
    await db.commit()
    await db.refresh(wallet)
    balance = await ledger_service.get_wallet_balance(wallet.id, db)
    return StandardResponse(data=_wallet_to_response(wallet, balance))


@router.get("/{wallet_id}/balance", response_model=StandardResponse[WalletBalanceResponse])
async def get_wallet_balance(
    wallet_id: uuid.UUID,
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    wallet = await _get_wallet_or_404(wallet_id, developer, db)
    balance = await ledger_service.get_wallet_balance(wallet.id, db)
    return StandardResponse(data=WalletBalanceResponse(wallet_id=wallet.id, balance=balance, currency=wallet.currency))


@router.get("/{wallet_id}/account", response_model=StandardResponse[Any])
async def get_wallet_account(
    wallet_id: uuid.UUID,
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    wallet = await _get_wallet_or_404(wallet_id, developer, db)
    return StandardResponse(data={
        "wallet_id": str(wallet.id),
        "account_number": wallet.account_number,
        "bank_name": wallet.bank_name,
        "account_name": wallet.account_name,
    })


@router.post("/{wallet_id}/transfer", response_model=StandardResponse[TransferResponse])
async def transfer_funds(
    wallet_id: uuid.UUID,
    body: TransferRequest,
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    wallet = await _get_wallet_or_404(wallet_id, developer, db)
    
    if wallet.status != "ACTIVE":
        raise BadRequestError(f"Cannot transfer from wallet with status {wallet.status}.")
    
    if not wallet.allow_transfers_out:
        raise BadRequestError("This wallet is configured as deposit-only (allow_transfers_out=False).")

    # Check internal transfer (destination is another Avenue wallet on this platform)
    result = await db.execute(
        select(Wallet).where(
            Wallet.account_number == body.destination_account_number,
            Wallet.developer_id == developer.id
        )
    )
    dest_wallet = result.scalar_one_or_none()

    if dest_wallet:
        # Internal transfer
        debit_entry = await ledger_service.record_debit(
            wallet=wallet,
            amount_kobo=body.amount,
            developer_id=developer.id,
            description=f"Internal transfer to {dest_wallet.account_number}",
            db=db,
        )
        await ledger_service.record_credit(
            wallet=dest_wallet,
            amount_kobo=body.amount,
            nomba_reference=f"INT-{uuid.uuid4().hex[:12].upper()}",
            developer_id=developer.id,
            sender_name=wallet.account_name,
            sender_account=wallet.account_number,
            raw_narration=body.narration,
            ai_metadata=None,
            db=db,
        )
        await db.commit()
        return StandardResponse(data=TransferResponse(
            status="SUCCESS",
            transaction_id=str(debit_entry.id),
            nomba_reference=debit_entry.nomba_reference,
            new_balance=debit_entry.balance_after,
            currency=wallet.currency,
        ))
    
    # External transfer via Nomba
    if not body.destination_bank_code or not body.destination_account_name:
        raise BadRequestError("destination_bank_code and destination_account_name are required for external transfers.")

    # Get Nomba config
    result = await db.execute(select(NombaConfig).where(NombaConfig.developer_id == developer.id))
    nomba_config = result.scalar_one_or_none()
    if not nomba_config:
        raise BadRequestError("Nomba config not found. Required for external transfers.")

    # Record debit first to ensure balance is sufficient
    debit_entry = await ledger_service.record_debit(
        wallet=wallet,
        amount_kobo=body.amount,
        developer_id=developer.id,
        description=f"External transfer to {body.destination_account_number}",
        db=db,
    )
    debit_entry.status = "PENDING"
    await db.commit()

    # Call Nomba
    try:
        transfer_data = await initiate_transfer(
            account_id=nomba_config.account_id,
            client_id=nomba_config.client_id,
            encrypted_secret=nomba_config.encrypted_client_secret,
            destination_account_number=body.destination_account_number,
            destination_bank_code=body.destination_bank_code,
            destination_account_name=body.destination_account_name,
            amount_kobo=body.amount,
            narration=body.narration or "Wallet Transfer",
            sender_name=f"{wallet.first_name} {wallet.last_name}",
        )
        
        # Nomba accepted the transfer (it is now processing)
        debit_entry.nomba_reference = transfer_data.get("merchantTxRef")
        await db.commit()

        return StandardResponse(data=TransferResponse(
            status="PROCESSING",
            transaction_id=str(debit_entry.id),
            nomba_reference=debit_entry.nomba_reference,
            new_balance=debit_entry.balance_after,
            currency=wallet.currency,
        ))
    except Exception as e:
        # Transfer failed immediately, refund the wallet
        await db.rollback()
        # Create a compensatory credit to reverse the debit
        await ledger_service.record_credit(
            wallet=wallet,
            amount_kobo=body.amount,
            nomba_reference=f"REFUND-{debit_entry.id}",
            developer_id=developer.id,
            sender_name="System",
            sender_account="System",
            raw_narration=f"Refund for failed transfer: {str(e)}",
            ai_metadata=None,
            db=db,
        )
        await db.commit()
        raise BadRequestError(f"External transfer failed: {str(e)}")


@router.get("/{wallet_id}/reports", response_model=StandardResponse[WalletReportResponse])
async def get_wallet_reports(
    wallet_id: uuid.UUID,
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    wallet = await _get_wallet_or_404(wallet_id, developer, db)
    
    if not end_date:
        end_date = datetime.now(timezone.utc)
    if not start_date:
        start_date = end_date - timedelta(days=30)
        
    report = await ledger_service.generate_wallet_report(
        wallet_id=wallet.id,
        start_date=start_date,
        end_date=end_date,
        db=db,
    )
    return StandardResponse(data=report)


# ── Helpers ───────────────────────────────────────────────────────────────────
async def _get_wallet_or_404(wallet_id: uuid.UUID, developer: Developer, db: AsyncSession) -> Wallet:
    result = await db.execute(select(Wallet).where(Wallet.id == wallet_id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise NotFoundError("Wallet")
    _check_wallet_owner(wallet, developer)
    return wallet


def _wallet_to_response(wallet: Wallet, balance: int) -> WalletResponse:
    return WalletResponse(
        id=wallet.id,
        customer_reference=wallet.customer_reference,
        first_name=wallet.first_name,
        last_name=wallet.last_name,
        email=wallet.email,
        label=wallet.label,
        account_number=wallet.account_number,
        bank_name=wallet.bank_name,
        account_name=wallet.account_name,
        balance=balance,
        currency=wallet.currency,
        status=wallet.status,
        system_prompt=wallet.system_prompt,
        allow_transfers_out=wallet.allow_transfers_out,
        created_at=wallet.created_at,
    )
