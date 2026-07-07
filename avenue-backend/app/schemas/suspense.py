import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class SuspenseItemResponse(BaseModel):
    id: uuid.UUID
    developer_id: uuid.UUID
    account_number: str
    amount: int  # In kobo
    sender_name: Optional[str] = None
    raw_narration: Optional[str] = None
    nomba_reference: Optional[str] = None
    reason: str
    status: str
    raw_payload: dict
    resolved_at: Optional[datetime] = None
    resolution_note: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ResolveSuspenseRequest(BaseModel):
    action: str  # "CREDIT_WALLET" | "DISMISS" | "REFUND"
    target_wallet_id: Optional[uuid.UUID] = None
    note: Optional[str] = None


class FlagSuspenseRequest(BaseModel):
    note: str


class SuspenseListResponse(BaseModel):
    items: list[SuspenseItemResponse]
    total: int
    page: int
    limit: int
