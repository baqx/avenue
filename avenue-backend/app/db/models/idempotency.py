import uuid
from typing import Optional

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class IdempotencyKey(Base):
    """
    Stores the outcome of a client-initiated write so that a retried request
    (same developer + same Idempotency-Key) never executes twice.

    Lifecycle:
      1. A row is claimed with status IN_PROGRESS before the work runs. The
         UNIQUE(developer_id, idempotency_key) constraint makes the claim atomic.
      2. On success the row is completed with the response status + body, which
         is replayed verbatim on any later retry.
      3. On failure the claim is released (row deleted) so the client may retry.
    """
    __tablename__ = "idempotency_keys"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    developer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("developers.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # The client-supplied key, scoped per developer.
    idempotency_key: Mapped[str] = mapped_column(String(255), nullable=False)

    # SHA-256 of the request (method + path + body) — used to reject key reuse
    # with a different payload.
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)

    status: Mapped[str] = mapped_column(String(20), nullable=False, default="IN_PROGRESS")

    # Captured once the work completes; replayed on retry.
    response_status: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    response_body: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    __table_args__ = (
        UniqueConstraint("developer_id", "idempotency_key", name="uq_idempotency_developer_key"),
    )

    def __repr__(self) -> str:
        return f"<IdempotencyKey developer_id={self.developer_id} key={self.idempotency_key} status={self.status}>"
