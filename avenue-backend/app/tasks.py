import uuid
import logging
from typing import Dict, Any

from app.core.config import settings
from app.core.errors import BadRequestError
from app.db.session import AsyncSessionLocal
from app.db.models.wallet import Wallet
from app.db.models.nomba_config import OutboundWebhook
from sqlalchemy import select
from app.services.ai_engine import reconcile_narration
from app.services.ledger import record_credit
from app.services.suspense import create_suspense_item
from app.services.webhook_dispatcher import dispatch_event
from app.services.agent_runner import evaluate_agents

logger = logging.getLogger(__name__)

async def process_inbound_webhook_task(
    ctx: Dict[Any, Any],
    developer_id: uuid.UUID,
    payload: dict
) -> str:
    """
    Background task to process inbound webhooks asynchronously.
    Executes AI reconciliation, ledger update, agent evaluation, and outbound dispatch.
    """
    event_type = payload.get("event_type", "")
    data = payload.get("data", {})
    transaction = data.get("transaction", {})
    customer = data.get("customer", {})

    nomba_reference = transaction.get("transactionId")
    account_number = transaction.get("aliasAccountNumber")
    amount_ngn = float(transaction.get("transactionAmount", 0))
    amount_kobo = int(amount_ngn * 100)
    sender_name = customer.get("senderName")
    sender_account = customer.get("accountNumber")
    raw_narration = transaction.get("narration", "")

    async with AsyncSessionLocal() as db:
        try:
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
                return "routed_to_suspense_no_wallet"

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
                return f"routed_to_suspense_{reason.lower()}"

            # ── Step 5: AI Reconciliation ──────────────────────────────────────────
            ai_result = await reconcile_narration(
                raw_narration=raw_narration,
                system_prompt=wallet.system_prompt,
                amount_kobo=amount_kobo,
            )

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
                return f"routed_to_suspense_{reason.lower()}"

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
                return "duplicate_ignored"

            # ── Step 7: Evaluate agents ────────────────────────────────────────────
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

            return f"success_transaction_{entry.id}"
        except Exception as e:
            await db.rollback()
            logger.error(f"Error processing webhook task: {str(e)}")
            raise e
