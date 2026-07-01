import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CreateWalletRequest(BaseModel):
    customer_reference: str
    label: Optional[str] = None
    currency: str = "NGN"
    system_prompt: Optional[str] = None


class UpdateWalletRequest(BaseModel):
    label: Optional[str] = None
    system_prompt: Optional[str] = None
    customer_reference: Optional[str] = None


class VirtualAccountDetails(BaseModel):
    account_number: str
    bank_name: str
    account_name: str


class WalletResponse(BaseModel):
    id: uuid.UUID
    customer_reference: str
    label: Optional[str]
    account_number: str
    bank_name: str
    account_name: str
    balance: int   # In kobo — frontend divides by 100
    currency: str
    status: str
    system_prompt: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class WalletBalanceResponse(BaseModel):
    wallet_id: uuid.UUID
    balance: int   # In kobo
    currency: str


class WalletListResponse(BaseModel):
    items: list[WalletResponse]
    total: int
    page: int
    limit: int
