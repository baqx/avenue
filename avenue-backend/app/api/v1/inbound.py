"""
Inbound webhook receiver — Nomba → Avenue.
This is the most critical endpoint in the entire system.

Nomba webhook payload structure (payment_success):
{
  "event_type": "payment_success",
  "requestId": "...",
  "data": {
    "merchant": { "walletId": "...", "walletBalance": ..., "userId": "..." },
    "terminal": {},
    "transaction": {
      "aliasAccountNumber": "...",       # the virtual account number
      "transactionId": "...",            # unique reference (idempotency key)
      "transactionAmount": 120,          # amount in NGN (not kobo!)
      "narration": "...",
      "time": "...",
      "type": "vact_transfer"
    },
    "customer": {
      "senderName": "...",
      "accountNumber": "...",            # sender's account number
      "bankName": "...",
      "bankCode": "..."
    }
  }
}

Nomba signature headers:
  - nomba-signature: Base64-encoded HMAC-SHA256
  - nomba-timestamp: RFC-3339 timestamp
"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request, status
from typing import Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import BadRequestError
from app.core.security import verify_nomba_signature
from app.db.models.nomba_config import NombaConfig
from app.db.session import get_db
from app.core.currency import ngn_to_kobo
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/inbound/{developer_id}", status_code=status.HTTP_200_OK)
async def receive_nomba_webhook(
    developer_id: uuid.UUID,
    request: Request,
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
):
    """
    Nomba sends raw payment webhooks here.
    Processing pipeline (in order):
    1. Validate HMAC-SHA256 signature
    2. Parse payload (using Nomba's actual field structure)
    3. Idempotency check (DB UNIQUE constraint on nomba_reference)
    4. Find target wallet by aliasAccountNumber
    5. Check wallet status
    6. Run AI reconciliation
    7. Write double-entry ledger
    8. Evaluate agents
    9. Dispatch enriched webhook to developer
    """

    logger.info(f"Received Nomba webhook for developer {developer_id}: {payload}")

    # ── Step 1: Validate HMAC signature ────────────────────────────────────
    result = await db.execute(select(NombaConfig).where(NombaConfig.developer_id == developer_id))
    nomba_config = result.scalar_one_or_none()
    if not nomba_config:
        logger.warning(f"Webhook rejected: Unknown developer {developer_id}")
        return {"status": "rejected", "reason": "Unknown developer"}

    nomba_signature = request.headers.get("nomba-signature", "")
    nomba_timestamp = request.headers.get("nomba-timestamp", "")

    if nomba_signature and nomba_config.webhook_signature_key:
        if not verify_nomba_signature(payload, nomba_signature, nomba_config.webhook_signature_key, nomba_timestamp):
            logger.warning(f"Webhook rejected: Invalid signature for developer {developer_id}")
            return {"status": "rejected", "reason": "Invalid signature"}
    else:
        logger.info(f"No signature key configured for developer {developer_id}, bypassing signature check.")

    # ── Step 2: Parse Nomba payload (actual structure) ─────────────────────
    event_type = payload.get("event_type", "")
    data = payload.get("data", {})
    transaction = data.get("transaction", {})
    customer = data.get("customer", {})

    # Extract fields from Nomba's actual webhook structure
    nomba_reference = transaction.get("transactionId")
    account_number = transaction.get("aliasAccountNumber")
    amount_kobo = ngn_to_kobo(transaction.get("transactionAmount", 0))  # Nomba sends NGN, we store kobo
    sender_name = customer.get("senderName")
    sender_account = customer.get("accountNumber")
    raw_narration = transaction.get("narration", "")

    if event_type == "payment_success":
        if not nomba_reference or not account_number:
            logger.warning(f"Webhook rejected: Missing required fields in payment_success payload")
            return {"status": "rejected", "reason": "Missing required fields"}
    elif event_type in ("payout_success", "payout_failed", "payout_refund"):
        # Allow transfer webhooks through. The background task will parse them.
        pass
    else:
        logger.info(f"Webhook acknowledged but not processed: Event type '{event_type}'")
        return {"status": "ok", "note": f"Event type '{event_type}' acknowledged but not processed"}

    # ── Step 3: Enqueue background task ────────────────────────────────────
    await request.app.state.arq_pool.enqueue_job(
        "process_inbound_webhook_task",
        developer_id,
        payload
    )

    return {"status": "ok", "note": "queued"}
    # return {"status": "ok", "transaction_id": str(entry.id)}
