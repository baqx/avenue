import uuid
from typing import Optional

from sqlalchemy import Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Wallet(Base):
    __tablename__ = "wallets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    developer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("developers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    customer_reference: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    label: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Nomba virtual account details
    nomba_account_id: Mapped[str] = mapped_column(String(255), nullable=False)
    account_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    bank_name: Mapped[str] = mapped_column(String(100), nullable=False)
    account_name: Mapped[str] = mapped_column(String(255), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="NGN")

    status: Mapped[str] = mapped_column(
        Enum("ACTIVE", "FROZEN", "CLOSED", name="wallet_status"),
        nullable=False,
        default="ACTIVE",
    )
    system_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    allow_transfers_out: Mapped[bool] = mapped_column(default=True, nullable=False, server_default="true")

    # Relationships
    developer: Mapped["Developer"] = relationship("Developer", back_populates="wallets")  # type: ignore
    ledger_entries: Mapped[list["LedgerEntry"]] = relationship("LedgerEntry", back_populates="wallet")
    agents: Mapped[list["Agent"]] = relationship("Agent", back_populates="wallet", foreign_keys="[Agent.wallet_id]")

    # Composite index: fast lookups by developer + customer reference
    __table_args__ = (
        Index("ix_wallets_developer_customer", "developer_id", "customer_reference"),
    )

    def __repr__(self) -> str:
        return f"<Wallet id={self.id} account={self.account_number} status={self.status}>"


from app.db.models.ledger import LedgerEntry  # noqa: E402
from app.db.models.agent import Agent  # noqa: E402
from app.db.models.developer import Developer  # noqa: E402
