"""
Ledger service — atomic double-entry ledger writes with idempotency.
All amounts in kobo. Balances are COMPUTED from ledger entries, never stored as a mutable field.
"""
import uuid
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.db.models.ledger import LedgerEntry
from app.db.models.wallet import Wallet
from app.core.errors import BadRequestError


async def get_wallet_balance(wallet_id: uuid.UUID, db: AsyncSession) -> int:
    """
    Compute the current balance by summing all CREDIT entries and subtracting DEBIT entries.
    Balance is NEVER stored as a mutable field — always derived from immutable ledger entries.
    """
    result = await db.execute(
        select(
            func.coalesce(
                func.sum(
                    LedgerEntry.amount
                ).filter(LedgerEntry.type == "CREDIT")
            , 0) -
            func.coalesce(
                func.sum(
                    LedgerEntry.amount
                ).filter(LedgerEntry.type == "DEBIT")
            , 0)
        ).where(
            LedgerEntry.wallet_id == wallet_id,
            LedgerEntry.status.in_(["SETTLED", "PENDING"]),
        )
    )
    balance = result.scalar() or 0
    return int(balance)


async def record_credit(
    wallet: Wallet,
    amount_kobo: int,
    nomba_reference: str,
    developer_id: uuid.UUID,
    sender_name: str | None,
    sender_account: str | None,
    raw_narration: str | None,
    ai_metadata: dict | None,
    db: AsyncSession,
) -> LedgerEntry:
    """
    Atomically write a CREDIT entry to the double-entry ledger.
    The UNIQUE constraint on nomba_reference ensures idempotency at the DB level.
    Raises IntegrityError if the reference already exists (duplicate webhook).
    """
    balance_before = await get_wallet_balance(wallet.id, db)
    balance_after = balance_before + amount_kobo

    entry = LedgerEntry(
        wallet_id=wallet.id,
        developer_id=developer_id,
        type="CREDIT",
        amount=amount_kobo,
        balance_before=balance_before,
        balance_after=balance_after,
        currency=wallet.currency,
        status="SETTLED",
        nomba_reference=nomba_reference,
        sender_name=sender_name,
        sender_account=sender_account,
        raw_narration=raw_narration,
        ai_metadata=ai_metadata,
    )
    db.add(entry)
    try:
        await db.flush()  # Flush to catch IntegrityError before commit
    except IntegrityError:
        await db.rollback()
        raise BadRequestError(f"Transaction with reference {nomba_reference} already processed (idempotency).")
    return entry


async def record_debit(
    wallet: Wallet,
    amount_kobo: int,
    developer_id: uuid.UUID,
    description: str,
    db: AsyncSession,
) -> LedgerEntry:
    """
    Atomically write a DEBIT entry (e.g. agent sweep).
    Raises if insufficient balance.
    """
    balance_before = await get_wallet_balance(wallet.id, db)
    if balance_before < amount_kobo:
        raise BadRequestError(f"Insufficient balance. Available: {balance_before} kobo, Required: {amount_kobo} kobo")

    balance_after = balance_before - amount_kobo
    entry = LedgerEntry(
        wallet_id=wallet.id,
        developer_id=developer_id,
        type="DEBIT",
        amount=amount_kobo,
        balance_before=balance_before,
        balance_after=balance_after,
        currency=wallet.currency,
        status="SETTLED",
        nomba_reference=None,  # Internal debits have no Nomba reference
        raw_narration=description,
        ai_metadata=None,
    )
    db.add(entry)
    await db.flush()
    return entry
