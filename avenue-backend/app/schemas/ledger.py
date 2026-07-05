import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class AvenueIntelligence(BaseModel):
    raw_narration: Optional[str] = None
    extracted_intent: Optional[str] = None
    confidence_score: Optional[float] = None
    flags: list[str] = []
    suggested_label: Optional[str] = None


class TransactionResponse(BaseModel):
    id: uuid.UUID
    wallet_id: uuid.UUID
    developer_id: uuid.UUID
    type: str         # CREDIT | DEBIT
    amount: int       # In kobo
    balance_before: int
    balance_after: int
    currency: str
    status: str
    nomba_reference: Optional[str] = None
    sender_name: Optional[str] = None
    sender_account: Optional[str] = None
    raw_narration: Optional[str] = None
    avenue_intelligence: Optional[AvenueIntelligence] = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_ai(cls, entry: Any) -> "TransactionResponse":
        ai = None
        if entry.ai_metadata:
            ai = AvenueIntelligence(**entry.ai_metadata)
        return cls(
            id=entry.id,
            wallet_id=entry.wallet_id,
            developer_id=entry.developer_id,
            type=entry.type,
            amount=entry.amount,
            balance_before=entry.balance_before,
            balance_after=entry.balance_after,
            currency=entry.currency,
            status=entry.status,
            nomba_reference=entry.nomba_reference,
            sender_name=entry.sender_name,
            sender_account=entry.sender_account,
            raw_narration=entry.raw_narration,
            avenue_intelligence=ai,
            created_at=entry.created_at,
        )


class StatementEntry(BaseModel):
    date: datetime
    type: str
    amount: int
    balance: int   # Running balance after this entry
    label: Optional[str] = None
    flags: list[str] = []


class TransactionListResponse(BaseModel):
    items: list[TransactionResponse]
    total: int
    page: int
    limit: int
