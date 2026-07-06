"""
Ledger service — atomic double-entry ledger writes with idempotency.
All amounts in kobo. Balances are COMPUTED from ledger entries, never stored as a mutable field.
"""
import uuid
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from datetime import datetime
from sqlalchemy import text
from app.schemas.wallet import WalletReportResponse, CategoryInsight, DailyFlow

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


async def generate_wallet_report(
    wallet_id: uuid.UUID,
    start_date: datetime,
    end_date: datetime,
    db: AsyncSession,
) -> WalletReportResponse:
    """
    Generate rich reports and AI-driven insights for a wallet over a specific time range.
    """
    # 1. Summary Metrics
    summary_query = select(
        func.sum(LedgerEntry.amount).filter(LedgerEntry.type == "CREDIT").label("total_inflow"),
        func.sum(LedgerEntry.amount).filter(LedgerEntry.type == "DEBIT").label("total_outflow"),
        func.count(LedgerEntry.id).label("tx_count"),
    ).where(
        LedgerEntry.wallet_id == wallet_id,
        LedgerEntry.created_at >= start_date,
        LedgerEntry.created_at <= end_date,
        LedgerEntry.status.in_(["SETTLED", "PENDING"])
    )
    result = await db.execute(summary_query)
    row = result.fetchone()
    total_inflow = int(getattr(row, "total_inflow", 0) or 0)
    total_outflow = int(getattr(row, "total_outflow", 0) or 0)
    tx_count = int(getattr(row, "tx_count", 0) or 0)

    # 2. Flagged Transactions
    flags_query = text("""
        SELECT COUNT(id) FROM ledger_entries 
        WHERE wallet_id = :wallet_id 
        AND created_at >= :start_date 
        AND created_at <= :end_date 
        AND ai_metadata IS NOT NULL 
        AND jsonb_typeof(ai_metadata->'flags') = 'array'
        AND jsonb_array_length(ai_metadata->'flags') > 0
    """)
    flags_result = await db.execute(flags_query, {"wallet_id": str(wallet_id), "start_date": start_date, "end_date": end_date})
    flagged_count = flags_result.scalar() or 0

    # 3. Category Insights (AI suggested labels)
    cat_query = text("""
        SELECT 
            COALESCE(ai_metadata->>'suggested_label', 'Uncategorized') as category,
            SUM(amount) as total_amount,
            COUNT(id) as tx_count
        FROM ledger_entries
        WHERE wallet_id = :wallet_id
        AND type = 'CREDIT'
        AND created_at >= :start_date 
        AND created_at <= :end_date
        AND status IN ('SETTLED', 'PENDING')
        GROUP BY COALESCE(ai_metadata->>'suggested_label', 'Uncategorized')
        ORDER BY total_amount DESC
    """)
    cat_result = await db.execute(cat_query, {"wallet_id": str(wallet_id), "start_date": start_date, "end_date": end_date})
    categories = [
        CategoryInsight(
            category=r[0],
            total_amount=int(r[1]),
            transaction_count=int(r[2])
        ) for r in cat_result.fetchall()
    ]

    # 4. Daily Flows
    daily_query = text("""
        SELECT 
            TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as dt,
            SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END) as inflow,
            SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END) as outflow
        FROM ledger_entries
        WHERE wallet_id = :wallet_id
        AND created_at >= :start_date 
        AND created_at <= :end_date
        AND status IN ('SETTLED', 'PENDING')
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY dt ASC
    """)
    daily_result = await db.execute(daily_query, {"wallet_id": str(wallet_id), "start_date": start_date, "end_date": end_date})
    daily_flows = [
        DailyFlow(
            date=r[0],
            total_inflow=int(r[1]),
            total_outflow=int(r[2])
        ) for r in daily_result.fetchall()
    ]

    return WalletReportResponse(
        wallet_id=wallet_id,
        start_date=start_date,
        end_date=end_date,
        total_inflow=total_inflow,
        total_outflow=total_outflow,
        net_flow=total_inflow - total_outflow,
        transaction_count=tx_count,
        flagged_transactions_count=int(flagged_count),
        categories=categories,
        daily_flows=daily_flows
    )
