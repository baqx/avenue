import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class WebhookLog(Base):
    """Tracks every outbound webhook delivery attempt Avenue makes to a developer's app."""
    __tablename__ = "webhook_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    developer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("developers.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Unique event identifier (same event_id across retry attempts)
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4, index=True
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # Full enriched payload that was (or will be) sent
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)

    status: Mapped[str] = mapped_column(
        Enum("PENDING", "DELIVERED", "FAILED", "DEAD", name="webhook_log_status"),
        nullable=False,
        default="PENDING",
        index=True,
    )

    # Response from developer's server
    http_status_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    response_body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # First 500 chars

    # Retry tracking
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    next_retry_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<WebhookLog id={self.id} event={self.event_type} status={self.status}>"
