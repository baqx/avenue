import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Agent(Base):
    """An automated trigger-action rule attached to a wallet."""
    __tablename__ = "agents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    developer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("developers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Trigger
    trigger: Mapped[str] = mapped_column(
        Enum(
            "BALANCE_ABOVE", "BALANCE_BELOW", "ON_CREDIT", "ON_CREDIT_AMOUNT_ABOVE",
            name="agent_trigger_type"
        ),
        nullable=False,
    )
    threshold: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)  # In kobo

    # Action
    action: Mapped[str] = mapped_column(
        Enum("SWEEP", "PARTIAL_SWEEP", "WEBHOOK_NOTIFY", "LOCK_WALLET", name="agent_action_type"),
        nullable=False,
    )
    destination_wallet_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wallets.id", ondelete="SET NULL"), nullable=True
    )
    destination_account_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    destination_bank_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    destination_account_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sweep_amount: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)  # For PARTIAL_SWEEP

    # State
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    trigger_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_triggered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    wallet: Mapped["Wallet"] = relationship("Wallet", back_populates="agents", foreign_keys=[wallet_id])  # type: ignore
    logs: Mapped[list["AgentLog"]] = relationship("AgentLog", back_populates="agent")

    def __repr__(self) -> str:
        return f"<Agent id={self.id} trigger={self.trigger} action={self.action}>"


class AgentLog(Base):
    """Execution history for an agent — every time it fires."""
    __tablename__ = "agent_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    wallet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False
    )
    developer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("developers.id", ondelete="CASCADE"), nullable=False
    )
    trigger_event: Mapped[str] = mapped_column(Text, nullable=False)   # e.g. "balance reached 50000"
    action_taken: Mapped[str] = mapped_column(Text, nullable=False)    # e.g. "swept 50000 to wal_master"
    result: Mapped[str] = mapped_column(
        Enum("SUCCESS", "FAILED", name="agent_log_result"), nullable=False
    )
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    agent: Mapped["Agent"] = relationship("Agent", back_populates="logs")

    def __repr__(self) -> str:
        return f"<AgentLog id={self.id} result={self.result}>"
