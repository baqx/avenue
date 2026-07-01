import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class WebhookLogResponse(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    event_type: str
    payload: dict
    status: str
    http_status_code: Optional[int]
    response_body: Optional[str]
    attempt_count: int
    next_retry_at: Optional[datetime]
    delivered_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class WebhookLogListResponse(BaseModel):
    items: list[WebhookLogResponse]
    total: int
    page: int
    limit: int


class OutboundEventPayload(BaseModel):
    """Schema for enriched outbound events sent to developer apps."""
    event_id: uuid.UUID
    event_type: str
    api_version: str = "2026-07-01"
    created_at: datetime
    data: dict[str, Any]
