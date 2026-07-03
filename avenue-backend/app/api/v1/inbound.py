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
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import BadRequestError
from app.core.security import verify_nomba_signature
from app.db.models.nomba_config import NombaConfig, OutboundWebhook
from app.db.models.wallet import Wallet
from app.db.session import get_db
from app.services.ai_engine import reconcile_narration
from app.services.ledger import record_credit
from app.services.suspense import create_suspense_item
from app.services.webhook_dispatcher import dispatch_event

router = APIRouter()


@router.post("/inbound/{developer_id}", status_code=status.HTTP_200_OK)
async def receive_nomba_webhook(
    developer_id: uuid.UUID,
    request: Request,
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
    payload = await request.json()

    # ── Step 1: Validate HMAC signature ────────────────────────────────────
    result = await db.execute(select(NombaConfig).where(NombaConfig.developer_id == developer_id))
    nomba_config = result.scalar_one_or_none()
    if not nomba_config:
        return {"status": "rejected", "reason": "Unknown developer"}

    nomba_signature = request.headers.get("nomba-signature", "")
    nomba_timestamp = request.headers.get("nomba-timestamp", "")

    if nomba_signature and nomba_config.webhook_signature_key:
        if not verify_nomba_signature(payload, nomba_signature, nomba_config.webhook_signature_key, nomba_timestamp):
            return {"status": "rejected", "reason": "Invalid signature"}

    # ── Step 2: Parse Nomba payload (actual structure) ─────────────────────
    event_type = payload.get("event_type", "")
    data = payload.get("data", {})
    transaction = data.get("transaction", {})
    customer = data.get("customer", {})

    # Extract fields from Nomba's actual webhook structure
    nomba_reference = transaction.get("transactionId")
    account_number = transaction.get("aliasAccountNumber")
    amount_ngn = float(transaction.get("transactionAmount", 0))
    amount_kobo = int(amount_ngn * 100)  # Nomba sends NGN, we store kobo
    sender_name = customer.get("senderName")
    sender_account = customer.get("accountNumber")
    raw_narration = transaction.get("narration", "")

    if not nomba_reference or not account_number:
        return {"status": "rejected", "reason": "Missing required fields"}

    # Only process payment_success events for crediting
    if event_type != "payment_success":
        return {"status": "ok", "note": f"Event type '{event_type}' acknowledged but not processed for credit"}

    # ── Step 3: Find wallet ────────────────────────────────────────────────
    result = await db.execute(
        select(Wallet).where(
            Wallet.account_number == account_number,
            Wallet.developer_id == developer_id,
        )
    )
    wallet = result.scalar_one_or_none()

    if not wallet:
        await create_suspense_item(
            developer_id=developer_id,
            account_number=account_number,
            amount_kobo=amount_kobo,
            sender_name=sender_name,
            raw_narration=raw_narration,
            nomba_reference=nomba_reference,
            reason="NO_WALLET_FOUND",
            raw_payload=payload,
            db=db,
        )
        await db.commit()
        return {"status": "ok", "routed_to": "suspense", "reason": "NO_WALLET_FOUND"}

    # ── Step 4: Check wallet status ────────────────────────────────────────
    if wallet.status in ("CLOSED", "FROZEN"):
        reason = "WALLET_CLOSED" if wallet.status == "CLOSED" else "WALLET_FROZEN"
        await create_suspense_item(
            developer_id=developer_id,
            account_number=account_number,
            amount_kobo=amount_kobo,
            sender_name=sender_name,
            raw_narration=raw_narration,
            nomba_reference=nomba_reference,
            reason=reason,
            raw_payload=payload,
            db=db,
        )
        await db.commit()
        return {"status": "ok", "routed_to": "suspense", "reason": reason}

    # ── Step 5: AI Reconciliation ──────────────────────────────────────────
    ai_result = await reconcile_narration(
        raw_narration=raw_narration,
        system_prompt=wallet.system_prompt,
        amount_kobo=amount_kobo,
    )

    # Route to suspense if AI confidence is too low
    if ai_result.get("confidence_score", 1.0) < settings.AI_CONFIDENCE_THRESHOLD:
        if "MISDIRECTION_SUSPECTED" in ai_result.get("flags", []):
            reason = "AI_MISDIRECTION_SUSPECTED"
        else:
            reason = "AI_LOW_CONFIDENCE"
        await create_suspense_item(
            developer_id=developer_id,
            account_number=account_number,
            amount_kobo=amount_kobo,
            sender_name=sender_name,
            raw_narration=raw_narration,
            nomba_reference=nomba_reference,
            reason=reason,
            raw_payload=payload,
            db=db,
        )
        await db.commit()
        return {"status": "ok", "routed_to": "suspense", "reason": reason}

    # ── Step 6: Write to ledger (atomic, idempotent) ───────────────────────
    try:
        entry = await record_credit(
            wallet=wallet,
            amount_kobo=amount_kobo,
            nomba_reference=nomba_reference,
            developer_id=developer_id,
            sender_name=sender_name,
            sender_account=sender_account,
            raw_narration=raw_narration,
            ai_metadata=ai_result,
            db=db,
        )
    except BadRequestError:
        # Duplicate reference — idempotent success
        return {"status": "ok", "note": "duplicate_ignored"}

    # ── Step 7: Evaluate agents ────────────────────────────────────────────
    from app.services.agent_runner import evaluate_agents
    await evaluate_agents(wallet=wallet, new_credit_amount=amount_kobo, db=db)

    await db.commit()

    # ── Step 8: Dispatch enriched outbound webhook ─────────────────────────
    outbound_result = await db.execute(
        select(OutboundWebhook).where(OutboundWebhook.developer_id == developer_id)
    )
    outbound_webhook = outbound_result.scalar_one_or_none()

    if outbound_webhook and outbound_webhook.is_active:
        new_balance = entry.balance_after
        await dispatch_event(
            developer_id=developer_id,
            event_type="ledger.credit",
            data={
                "wallet_id": str(wallet.id),
                "customer_reference": wallet.customer_reference,
                "transaction_id": str(entry.id),
                "amount": amount_kobo,
                "new_balance": new_balance,
                "currency": wallet.currency,
                "sender_name": sender_name,
                "avenue_intelligence": ai_result,
            },
            webhook_url=outbound_webhook.url,
            signing_secret=outbound_webhook.signing_secret,
            db=db,
        )
        await db.commit()

    return {"status": "ok", "transaction_id": str(entry.id)}
