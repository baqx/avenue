import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class DeveloperProfile(BaseModel):
    id: uuid.UUID
    email: str
    company_name: str
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UpdateDeveloperRequest(BaseModel):
    company_name: Optional[str] = None
    email: Optional[EmailStr] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ApiKeyResponse(BaseModel):
    id: uuid.UUID
    key_prefix: str
    label: Optional[str] = None
    type: str
    last_used_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CreateApiKeyRequest(BaseModel):
    label: Optional[str] = None
    type: str = "live"  # "live" or "test"


class NewApiKeyResponse(BaseModel):
    """Only returned ONCE at creation — the full key is never shown again."""
    id: uuid.UUID
    full_key: str
    key_prefix: str
    label: Optional[str] = None
    type: str
    created_at: datetime


class NombaConfigRequest(BaseModel):
    account_id: str  # Nomba parent accountId
    client_id: str
    client_secret: str
    webhook_signature_key: str  # Signature key from Nomba dashboard
    sub_account_id: Optional[str] = None


class NombaConfigResponse(BaseModel):
    account_id: str
    client_id: str
    client_secret_masked: str  # e.g. "••••••••xxxx"
    inbound_webhook_url: str
    sub_account_id: Optional[str] = None


class OutboundWebhookRequest(BaseModel):
    url: str


class OutboundWebhookResponse(BaseModel):
    id: uuid.UUID
    url: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
