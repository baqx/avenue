"""
Agent runner — evaluates all active agents on a wallet after a credit event.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.agent import Agent, AgentLog
from app.db.models.nomba_config import NombaConfig, OutboundWebhook
from app.db.models.wallet import Wallet
from app.services import ledger as ledger_service
from app.services.nomba import initiate_transfer
from app.services.webhook_dispatcher import dispatch_event


async def evaluate_agents(
    wallet: Wallet,
    new_credit_amount: int,
    db: AsyncSession,
) -> None:
    """
    After a credit is recorded, evaluate all active agents on this wallet.
    Executes any triggered actions.
    """
    result = await db.execute(
        select(Agent).where(Agent.wallet_id == wallet.id, Agent.is_active == True)
    )
    agents = result.scalars().all()

    current_balance = await ledger_service.get_wallet_balance(wallet.id, db)

    for agent in agents:
        triggered = _check_trigger(agent, current_balance, new_credit_amount)
        if not triggered:
            continue

        trigger_description = f"Balance reached {current_balance} kobo (threshold: {agent.threshold})"
        result_status = "SUCCESS"
        error_message = None

        try:
            await _execute_action(agent, wallet, current_balance, db)
            agent.trigger_count += 1
            agent.last_triggered_at = datetime.now(timezone.utc)
        except Exception as e:
            result_status = "FAILED"
            error_message = str(e)

        log = AgentLog(
            agent_id=agent.id,
            wallet_id=wallet.id,
            developer_id=wallet.developer_id,
            trigger_event=trigger_description,
            action_taken=agent.action,
            result=result_status,
            error_message=error_message,
        )
        db.add(log)

    await db.flush()


def _check_trigger(agent: Agent, current_balance: int, new_credit_amount: int) -> bool:
    if agent.trigger == "BALANCE_ABOVE":
        return agent.threshold is not None and current_balance > agent.threshold
    elif agent.trigger == "BALANCE_BELOW":
        return agent.threshold is not None and current_balance < agent.threshold
    elif agent.trigger == "ON_CREDIT":
        return True
    elif agent.trigger == "ON_CREDIT_AMOUNT_ABOVE":
        return agent.threshold is not None and new_credit_amount > agent.threshold
    return False


async def _execute_action(
    agent: Agent,
    wallet: Wallet,
    current_balance: int,
    db: AsyncSession,
) -> None:
    if agent.action in ("SWEEP", "PARTIAL_SWEEP"):
        sweep_amount = current_balance if agent.action == "SWEEP" else (agent.sweep_amount or 0)
        if agent.destination_wallet_id:
            # Debit source wallet
            await ledger_service.record_debit(
                wallet=wallet,
                amount_kobo=sweep_amount,
                developer_id=wallet.developer_id,
                description=f"Agent sweep: {agent.name}",
                db=db,
            )
            # Credit destination wallet
            dest_result = await db.execute(
                select(Wallet).where(Wallet.id == agent.destination_wallet_id)
            )
            dest_wallet = dest_result.scalar_one_or_none()
            if dest_wallet:
                await ledger_service.record_credit(
                    wallet=dest_wallet,
                    amount_kobo=sweep_amount,
                    nomba_reference=None,
                    developer_id=wallet.developer_id,
                    sender_name="Agent Sweep",
                    sender_account=wallet.account_number,
                    raw_narration=f"Auto-sweep from agent: {agent.name}",
                    ai_metadata=None,
                    db=db,
                )
        elif agent.destination_account_number and agent.destination_bank_code and agent.destination_account_name:
            # External Bank Sweep via Nomba
            # 1. Fetch Nomba Config
            config_result = await db.execute(
                select(NombaConfig).where(NombaConfig.developer_id == wallet.developer_id)
            )
            nomba_config = config_result.scalar_one_or_none()
            if not nomba_config:
                raise Exception("Nomba config missing for external agent sweep.")

            # 2. Debit source wallet
            debit_entry = await ledger_service.record_debit(
                wallet=wallet,
                amount_kobo=sweep_amount,
                developer_id=wallet.developer_id,
                description=f"Agent external sweep: {agent.name}",
                db=db,
            )
            debit_entry.status = "PENDING"
            await db.flush()

            # 3. Initiate Transfer
            transfer_data = await initiate_transfer(
                account_id=nomba_config.account_id,
                client_id=nomba_config.client_id,
                encrypted_secret=nomba_config.encrypted_client_secret,
                destination_account_number=agent.destination_account_number,
                destination_bank_code=agent.destination_bank_code,
                destination_account_name=agent.destination_account_name,
                amount_kobo=sweep_amount,
                narration=f"Avenue Sweep: {agent.name}",
                sender_name=f"{wallet.first_name} {wallet.last_name}",
            )
            
            debit_entry.nomba_reference = transfer_data.get("merchantTxRef")
            await db.flush()
        else:
            raise ValueError("No destination wallet or external account specified for sweep action.")
    elif agent.action == "LOCK_WALLET":
        wallet.status = "FROZEN"
        await db.flush()
    elif agent.action == "WEBHOOK_NOTIFY":
        outbound_result = await db.execute(
            select(OutboundWebhook).where(OutboundWebhook.developer_id == wallet.developer_id)
        )
        outbound_webhook = outbound_result.scalar_one_or_none()
        if not outbound_webhook or not outbound_webhook.is_active:
            raise ValueError("No active outbound webhook configured for developer.")
            
        await dispatch_event(
            developer_id=wallet.developer_id,
            event_type="agent.triggered",
            data={
                "wallet_id": str(wallet.id),
                "agent_id": str(agent.id),
                "agent_name": agent.name,
                "action": agent.action,
                "current_balance": current_balance,
            },
            webhook_url=outbound_webhook.url,
            signing_secret=outbound_webhook.signing_secret,
            db=db,
        )
