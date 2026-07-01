"""Ledger & Transaction routes — read-only."""
import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentDeveloper
from app.core.errors import ForbiddenError, NotFoundError
from app.db.models.developer import Developer
from app.db.models.ledger import LedgerEntry
from app.db.models.wallet import Wallet
from app.db.session import get_db
from app.schemas.ledger import TransactionListResponse, TransactionResponse

router = APIRouter()


@router.get("/wallets/{wallet_id}/transactions", response_model=TransactionListResponse)
async def list_wallet_transactions(
    wallet_id: uuid.UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    type_filter: str | None = Query(None, alias="type"),
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    await _assert_wallet_ownership(wallet_id, developer, db)
    query = select(LedgerEntry).where(LedgerEntry.wallet_id == wallet_id)
    if type_filter:
        query = query.where(LedgerEntry.type == type_filter.upper())

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    query = query.order_by(LedgerEntry.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    entries = result.scalars().all()
    items = [TransactionResponse.from_orm_with_ai(e) for e in entries]
    return TransactionListResponse(items=items, total=total, page=page, limit=limit)


@router.get("/wallets/{wallet_id}/transactions/{tx_id}", response_model=TransactionResponse)
async def get_wallet_transaction(
    wallet_id: uuid.UUID,
    tx_id: uuid.UUID,
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    await _assert_wallet_ownership(wallet_id, developer, db)
    result = await db.execute(
        select(LedgerEntry).where(LedgerEntry.id == tx_id, LedgerEntry.wallet_id == wallet_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise NotFoundError("Transaction")
    return TransactionResponse.from_orm_with_ai(entry)


@router.get("/transactions", response_model=TransactionListResponse)
async def list_all_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    query = select(LedgerEntry).where(LedgerEntry.developer_id == developer.id)
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    query = query.order_by(LedgerEntry.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    entries = result.scalars().all()
    items = [TransactionResponse.from_orm_with_ai(e) for e in entries]
    return TransactionListResponse(items=items, total=total, page=page, limit=limit)


@router.get("/transactions/{tx_id}", response_model=TransactionResponse)
async def get_transaction(
    tx_id: uuid.UUID,
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LedgerEntry).where(LedgerEntry.id == tx_id, LedgerEntry.developer_id == developer.id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise NotFoundError("Transaction")
    return TransactionResponse.from_orm_with_ai(entry)


async def _assert_wallet_ownership(wallet_id: uuid.UUID, developer: Developer, db: AsyncSession):
    result = await db.execute(select(Wallet).where(Wallet.id == wallet_id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise NotFoundError("Wallet")
    if wallet.developer_id != developer.id:
        raise ForbiddenError()
