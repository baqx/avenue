import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CreateAgentRequest(BaseModel):
    name: str
    trigger: str   # BALANCE_ABOVE | BALANCE_BELOW | ON_CREDIT | ON_CREDIT_AMOUNT_ABOVE
    threshold: Optional[int] = None  # In kobo
    action: str    # SWEEP | PARTIAL_SWEEP | WEBHOOK_NOTIFY | LOCK_WALLET
    destination_wallet_id: Optional[uuid.UUID] = None
    sweep_amount: Optional[int] = None  # In kobo, for PARTIAL_SWEEP


class UpdateAgentRequest(BaseModel):
    name: Optional[str] = None
    threshold: Optional[int] = None
    destination_wallet_id: Optional[uuid.UUID] = None
    sweep_amount: Optional[int] = None


class ToggleAgentRequest(BaseModel):
    is_active: bool


class AgentResponse(BaseModel):
    id: uuid.UUID
    wallet_id: uuid.UUID
    developer_id: uuid.UUID
    name: str
    trigger: str
    threshold: Optional[int]
    action: str
    destination_wallet_id: Optional[uuid.UUID]
    sweep_amount: Optional[int]
    is_active: bool
    trigger_count: int
    last_triggered_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentLogResponse(BaseModel):
    id: uuid.UUID
    agent_id: uuid.UUID
    wallet_id: uuid.UUID
    trigger_event: str
    action_taken: str
    result: str
    error_message: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentListResponse(BaseModel):
    items: list[AgentResponse]
    total: int
    page: int
    limit: int
