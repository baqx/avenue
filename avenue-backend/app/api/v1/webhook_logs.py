"""Webhook log routes — view delivery history and trigger retries."""
import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentDeveloper
from app.core.errors import BadRequestError, NotFoundError
from app.db.models.developer import Developer
from app.db.models.nomba_config import OutboundWebhook
from app.db.models.webhook_log import WebhookLog
from app.db.session import get_db
from app.schemas.webhook import WebhookLogListResponse, WebhookLogResponse
from app.services.webhook_dispatcher import retry_webhook
from app.schemas.base import StandardResponse

router = APIRouter()


@router.get("", response_model=StandardResponse[WebhookLogListResponse])
async def list_webhook_logs(
    page: int = Query(1, ge=1), limit: int = Query(20),
    status_filter: str | None = Query(None, alias="status"),
    event_type: str | None = Query(None),
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    query = select(WebhookLog).where(WebhookLog.developer_id == developer.id)
    if status_filter:
        query = query.where(WebhookLog.status == status_filter.upper())
    if event_type:
        query = query.where(WebhookLog.event_type == event_type)
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    result = await db.execute(query.order_by(WebhookLog.created_at.desc()).offset((page - 1) * limit).limit(limit))
    logs = result.scalars().all()
    return StandardResponse(data=WebhookLogListResponse(items=[WebhookLogResponse.model_validate(l) for l in logs], total=total, page=page, limit=limit))


@router.get("/{log_id}", response_model=StandardResponse[WebhookLogResponse])
async def get_webhook_log(log_id: uuid.UUID, developer: Developer = CurrentDeveloper, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WebhookLog).where(WebhookLog.id == log_id, WebhookLog.developer_id == developer.id))
    log = result.scalar_one_or_none()
    if not log:
        raise NotFoundError("Webhook log")
    return StandardResponse(data=WebhookLogResponse.model_validate(log))


@router.post("/{log_id}/retry", response_model=StandardResponse[WebhookLogResponse])
async def retry_webhook_delivery(log_id: uuid.UUID, developer: Developer = CurrentDeveloper, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WebhookLog).where(WebhookLog.id == log_id, WebhookLog.developer_id == developer.id))
    log = result.scalar_one_or_none()
    if not log:
        raise NotFoundError("Webhook log")
    if log.status == "DELIVERED":
        raise BadRequestError("This webhook was already delivered successfully.")

    outbound_result = await db.execute(select(OutboundWebhook).where(OutboundWebhook.developer_id == developer.id))
    outbound = outbound_result.scalar_one_or_none()
    if not outbound:
        raise BadRequestError("No outbound webhook URL configured.")

    log = await retry_webhook(log=log, webhook_url=outbound.url, signing_secret=outbound.signing_secret, db=db)
    await db.commit()
    return StandardResponse(data=WebhookLogResponse.model_validate(log))
