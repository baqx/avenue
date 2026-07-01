import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SuspenseItem(Base):
    """
    Holds anomalous or unroutable inbound payments for manual review.
    Created when: wallet is CLOSED/FROZEN, account not found, AI confidence too low,
    or AI suspects narration misdirection.
    """
    __tablename__ = "suspense_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    developer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("developers.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Payment details (queryable columns — not just buried in raw_payload)
    account_number: Mapped[str] = mapped_column(String(20), nullable=False)  # Destination NUBAN
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)           # In kobo
    sender_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    raw_narration: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    nomba_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)

    reason: Mapped[str] = mapped_column(
        Enum(
            "WALLET_CLOSED",
            "WALLET_FROZEN",
            "NO_WALLET_FOUND",
            "AI_LOW_CONFIDENCE",
            "AI_MISDIRECTION_SUSPECTED",
            "DUPLICATE_REFERENCE",
            name="suspense_reason",
        ),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        Enum("PENDING", "RESOLVED", "FLAGGED", name="suspense_status"),
        nullable=False,
        default="PENDING",
    )

    # Full Nomba webhook payload for reference during manual resolution
    raw_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Resolution tracking
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # "auto" or developer action
    resolution_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<SuspenseItem id={self.id} reason={self.reason} status={self.status}>"
