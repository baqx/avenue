import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Developer(Base):
    __tablename__ = "developers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(Text, nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verification_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    password_reset_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    password_reset_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    api_keys: Mapped[list["ApiKey"]] = relationship("ApiKey", back_populates="developer", lazy="selectin")
    wallets: Mapped[list] = relationship("Wallet", back_populates="developer")
    nomba_config: Mapped[Optional["NombaConfig"]] = relationship("NombaConfig", back_populates="developer", uselist=False)
    outbound_webhook: Mapped[Optional["OutboundWebhook"]] = relationship("OutboundWebhook", back_populates="developer", uselist=False)

    def __repr__(self) -> str:
        return f"<Developer id={self.id} email={self.email}>"


class ApiKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    developer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("developers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    key_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    key_prefix: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g. "ave_live_xxxx..."
    label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    type: Mapped[str] = mapped_column(
        Enum("live", "test", name="api_key_type"), nullable=False, default="live"
    )
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    developer: Mapped["Developer"] = relationship("Developer", back_populates="api_keys")

    @property
    def is_active(self) -> bool:
        return self.revoked_at is None

    def __repr__(self) -> str:
        return f"<ApiKey id={self.id} prefix={self.key_prefix} type={self.type}>"


# Imported here to avoid circular imports in relationship definitions
from app.db.models.nomba_config import NombaConfig, OutboundWebhook  # noqa: E402
from app.db.models.wallet import Wallet  # noqa: E402
