import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class NombaConfig(Base):
    """Stores a developer's Nomba API credentials (client_id + encrypted secret)."""
    __tablename__ = "nomba_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    developer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("developers.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    account_id: Mapped[str] = mapped_column(String(64), nullable=False)  # Nomba parent accountId
    client_id: Mapped[str] = mapped_column(Text, nullable=False)
    encrypted_client_secret: Mapped[str] = mapped_column(Text, nullable=False)
    sub_account_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # Signature key set by the developer on their Nomba dashboard — used to verify inbound HMAC
    webhook_signature_key: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships
    developer: Mapped["Developer"] = relationship("Developer", back_populates="nomba_config")  # type: ignore

    def __repr__(self) -> str:
        return f"<NombaConfig developer_id={self.developer_id}>"


class OutboundWebhook(Base):
    """Stores the developer's registered outbound webhook URL and signing secret."""
    __tablename__ = "outbound_webhooks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    developer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("developers.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    signing_secret: Mapped[str] = mapped_column(String(64), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    developer: Mapped["Developer"] = relationship("Developer", back_populates="outbound_webhook")  # type: ignore

    def __repr__(self) -> str:
        return f"<OutboundWebhook developer_id={self.developer_id} url={self.url}>"
