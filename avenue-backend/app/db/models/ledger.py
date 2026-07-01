import uuid
from typing import Optional

from sqlalchemy import BigInteger, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class LedgerEntry(Base):
    """
    Immutable double-entry ledger record.
    Every credit or debit is a permanent, append-only record.
    Amounts stored in kobo (smallest currency unit) — NEVER floats.
    """
    __tablename__ = "ledger_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign keys (developer_id denormalized for fast global analytics queries)
    wallet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wallets.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    developer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("developers.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    # Transaction data
    type: Mapped[str] = mapped_column(
        Enum("CREDIT", "DEBIT", name="ledger_entry_type"), nullable=False
    )
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)          # In kobo
    balance_before: Mapped[int] = mapped_column(BigInteger, nullable=False)  # Snapshot
    balance_after: Mapped[int] = mapped_column(BigInteger, nullable=False)   # Snapshot
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="NGN")

    status: Mapped[str] = mapped_column(
        Enum("SETTLED", "PENDING", "REVERSED", name="ledger_entry_status"),
        nullable=False,
        default="SETTLED",
    )

    # Idempotency: DB-level UNIQUE constraint prevents double-crediting
    nomba_reference: Mapped[Optional[str]] = mapped_column(
        String(255), unique=True, nullable=True, index=True
    )

    # Sender details (from Nomba webhook)
    sender_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sender_account: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    raw_narration: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # AI intelligence output stored as JSONB
    ai_metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Relationships
    wallet: Mapped["Wallet"] = relationship("Wallet", back_populates="ledger_entries")  # type: ignore

    # Indexes for performance
    __table_args__ = (
        Index("ix_ledger_wallet_created", "wallet_id", "created_at"),
        Index("ix_ledger_developer_created", "developer_id", "created_at"),
    )
    # NOTE: No updated_at — ledger entries are IMMUTABLE

    def __repr__(self) -> str:
        return f"<LedgerEntry id={self.id} type={self.type} amount={self.amount}>"
