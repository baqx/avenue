"""Analytics routes — aggregated metrics for the developer dashboard."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentDeveloper
from app.db.models.developer import Developer
from app.db.models.ledger import LedgerEntry
from app.db.models.suspense import SuspenseItem
from app.db.models.wallet import Wallet
from app.db.models.webhook_log import WebhookLog
from app.db.session import get_db
from app.schemas.analytics import OverviewStats, SuspenseStats, WebhookStats

router = APIRouter()


@router.get("/overview", response_model=OverviewStats)
async def get_overview(developer: Developer = CurrentDeveloper, db: AsyncSession = Depends(get_db)):
    dev_id = developer.id
    now = datetime.now(timezone.utc)

    # Wallet counts
    wallet_counts = await db.execute(
        select(Wallet.status, func.count(Wallet.id)).where(Wallet.developer_id == dev_id).group_by(Wallet.status)
    )
    wallet_by_status = {row[0]: row[1] for row in wallet_counts.all()}

    # Transaction volumes
    total_vol = (await db.execute(select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(LedgerEntry.developer_id == dev_id, LedgerEntry.type == "CREDIT"))).scalar() or 0
    vol_today = (await db.execute(select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(LedgerEntry.developer_id == dev_id, LedgerEntry.type == "CREDIT", LedgerEntry.created_at >= now - timedelta(days=1)))).scalar() or 0
    vol_7d = (await db.execute(select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(LedgerEntry.developer_id == dev_id, LedgerEntry.type == "CREDIT", LedgerEntry.created_at >= now - timedelta(days=7)))).scalar() or 0
    vol_30d = (await db.execute(select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(LedgerEntry.developer_id == dev_id, LedgerEntry.type == "CREDIT", LedgerEntry.created_at >= now - timedelta(days=30)))).scalar() or 0

    total_tx = (await db.execute(select(func.count(LedgerEntry.id)).where(LedgerEntry.developer_id == dev_id))).scalar() or 0
    pending_suspense = (await db.execute(select(func.count(SuspenseItem.id)).where(SuspenseItem.developer_id == dev_id, SuspenseItem.status == "PENDING"))).scalar() or 0

    # Webhook delivery rate
    total_wh = (await db.execute(select(func.count(WebhookLog.id)).where(WebhookLog.developer_id == dev_id))).scalar() or 0
    delivered_wh = (await db.execute(select(func.count(WebhookLog.id)).where(WebhookLog.developer_id == dev_id, WebhookLog.status == "DELIVERED"))).scalar() or 0
    delivery_rate = (delivered_wh / total_wh) if total_wh > 0 else 1.0

    return OverviewStats(
        total_wallets=sum(wallet_by_status.values()),
        active_wallets=wallet_by_status.get("ACTIVE", 0),
        frozen_wallets=wallet_by_status.get("FROZEN", 0),
        closed_wallets=wallet_by_status.get("CLOSED", 0),
        total_volume_kobo=int(total_vol),
        volume_today_kobo=int(vol_today),
        volume_7d_kobo=int(vol_7d),
        volume_30d_kobo=int(vol_30d),
        total_transactions=total_tx,
        pending_suspense_count=pending_suspense,
        webhook_delivery_rate=delivery_rate,
    )


@router.get("/suspense", response_model=SuspenseStats)
async def get_suspense_stats(developer: Developer = CurrentDeveloper, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SuspenseItem.status, func.count(SuspenseItem.id))
        .where(SuspenseItem.developer_id == developer.id)
        .group_by(SuspenseItem.status)
    )
    by_status = {row[0]: row[1] for row in result.all()}
    total = sum(by_status.values())
    resolved = by_status.get("RESOLVED", 0)

    reason_result = await db.execute(
        select(SuspenseItem.reason, func.count(SuspenseItem.id))
        .where(SuspenseItem.developer_id == developer.id)
        .group_by(SuspenseItem.reason)
    )
    by_reason = {row[0]: row[1] for row in reason_result.all()}

    return SuspenseStats(
        pending=by_status.get("PENDING", 0),
        resolved=resolved,
        flagged=by_status.get("FLAGGED", 0),
        resolution_rate=resolved / total if total > 0 else 0.0,
        breakdown_by_reason=by_reason,
    )


@router.get("/webhooks", response_model=WebhookStats)
async def get_webhook_stats(developer: Developer = CurrentDeveloper, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(WebhookLog.status, func.count(WebhookLog.id))
        .where(WebhookLog.developer_id == developer.id)
        .group_by(WebhookLog.status)
    )
    by_status = {row[0]: row[1] for row in result.all()}
    total = sum(by_status.values())
    delivered = by_status.get("DELIVERED", 0)
    return WebhookStats(
        delivered=delivered,
        failed=by_status.get("FAILED", 0),
        dead=by_status.get("DEAD", 0),
        delivery_rate=delivered / total if total > 0 else 1.0,
    )
