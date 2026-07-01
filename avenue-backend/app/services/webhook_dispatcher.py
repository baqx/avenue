"""
Webhook dispatcher — sends enriched outbound events to developer app URLs.
Implements exponential backoff retry logic.
"""
import asyncio
import json
import uuid
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import sign_outbound_webhook
from app.db.models.webhook_log import WebhookLog

# Retry intervals in seconds: 30s, 5m, 30m, 2h, 24h
RETRY_DELAYS = [30, 300, 1800, 7200, 86400]


async def dispatch_event(
    developer_id: uuid.UUID,
    event_type: str,
    data: dict,
    webhook_url: str,
    signing_secret: str,
    db: AsyncSession,
) -> WebhookLog:
    """
    Send an enriched event to the developer's registered webhook URL.
    Creates a WebhookLog record and attempts delivery immediately.
    """
    event_id = uuid.uuid4()
    payload = {
        "event_id": str(event_id),
        "event_type": event_type,
        "api_version": "2026-07-01",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "data": data,
    }
    payload_bytes = json.dumps(payload, default=str).encode()
    signature = sign_outbound_webhook(payload_bytes, signing_secret)

    # Create log record
    log = WebhookLog(
        developer_id=developer_id,
        event_id=event_id,
        event_type=event_type,
        payload=payload,
        status="PENDING",
        attempt_count=0,
    )
    db.add(log)
    await db.flush()

    # Attempt delivery
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                webhook_url,
                content=payload_bytes,
                headers={
                    "Content-Type": "application/json",
                    "X-Avenue-Signature": signature,
                    "X-Avenue-Event": event_type,
                    "X-Avenue-Event-ID": str(event_id),
                },
            )
        log.http_status_code = response.status_code
        log.response_body = response.text[:500]
        log.attempt_count = 1

        if 200 <= response.status_code < 300:
            log.status = "DELIVERED"
            log.delivered_at = datetime.now(timezone.utc)
        else:
            log.status = "FAILED"
            log.next_retry_at = datetime.now(timezone.utc) + timedelta(seconds=RETRY_DELAYS[0])

    except Exception as e:
        log.status = "FAILED"
        log.response_body = str(e)[:500]
        log.attempt_count = 1
        log.next_retry_at = datetime.now(timezone.utc) + timedelta(seconds=RETRY_DELAYS[0])

    await db.flush()
    return log


async def retry_webhook(log: WebhookLog, webhook_url: str, signing_secret: str, db: AsyncSession) -> WebhookLog:
    """Retry a failed webhook delivery."""
    if log.status == "DEAD":
        return log

    payload_bytes = json.dumps(log.payload, default=str).encode()
    signature = sign_outbound_webhook(payload_bytes, signing_secret)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                webhook_url,
                content=payload_bytes,
                headers={
                    "Content-Type": "application/json",
                    "X-Avenue-Signature": signature,
                    "X-Avenue-Event": log.event_type,
                    "X-Avenue-Event-ID": str(log.event_id),
                },
            )
        log.http_status_code = response.status_code
        log.response_body = response.text[:500]
        log.attempt_count += 1

        if 200 <= response.status_code < 300:
            log.status = "DELIVERED"
            log.delivered_at = datetime.now(timezone.utc)
            log.next_retry_at = None
        else:
            attempt = log.attempt_count
            if attempt >= settings.WEBHOOK_MAX_RETRIES:
                log.status = "DEAD"
                log.next_retry_at = None
            else:
                delay = RETRY_DELAYS[min(attempt, len(RETRY_DELAYS) - 1)]
                log.next_retry_at = datetime.now(timezone.utc) + timedelta(seconds=delay)

    except Exception as e:
        log.response_body = str(e)[:500]
        log.attempt_count += 1
        attempt = log.attempt_count
        if attempt >= settings.WEBHOOK_MAX_RETRIES:
            log.status = "DEAD"
        else:
            delay = RETRY_DELAYS[min(attempt, len(RETRY_DELAYS) - 1)]
            log.next_retry_at = datetime.now(timezone.utc) + timedelta(seconds=delay)

    await db.flush()
    return log
