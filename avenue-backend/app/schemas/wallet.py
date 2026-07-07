import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CreateWalletRequest(BaseModel):
    customer_reference: str
    first_name: str
    last_name: str
    email: str
    label: Optional[str] = None
    currency: str = "NGN"
    system_prompt: Optional[str] = None
    allow_transfers_out: bool = True
    sub_account_id: Optional[str] = None


class UpdateWalletRequest(BaseModel):
    label: Optional[str] = None
    system_prompt: Optional[str] = None
    customer_reference: Optional[str] = None
    allow_transfers_out: Optional[bool] = None


class VirtualAccountDetails(BaseModel):
    account_number: str
    bank_name: str
    account_name: str


class WalletResponse(BaseModel):
    id: uuid.UUID
    customer_reference: str
    first_name: str
    last_name: str
    email: str
    label: Optional[str] = None
    account_number: str
    bank_name: str
    account_name: str
    balance: int   # In kobo — frontend divides by 100
    currency: str
    status: str
    system_prompt: Optional[str] = None
    allow_transfers_out: bool
    sub_account_id: Optional[str] = None
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


class TransferRequest(BaseModel):
    destination_account_number: str
    destination_bank_code: Optional[str] = None
    destination_account_name: Optional[str] = None
    amount: int  # In kobo
    narration: Optional[str] = "Wallet Transfer"


class TransferResponse(BaseModel):
    status: str
    transaction_id: Optional[str] = None
    nomba_reference: Optional[str] = None
    new_balance: int  # In kobo
    currency: str


class CategoryInsight(BaseModel):
    category: str
    total_amount: int
    transaction_count: int


class DailyFlow(BaseModel):
    date: str  # YYYY-MM-DD
    total_inflow: int
    total_outflow: int


class WalletReportResponse(BaseModel):
    wallet_id: uuid.UUID
    start_date: datetime
    end_date: datetime
    total_inflow: int
    total_outflow: int
    net_flow: int
    transaction_count: int
    flagged_transactions_count: int
    categories: list[CategoryInsight]
    daily_flows: list[DailyFlow]
