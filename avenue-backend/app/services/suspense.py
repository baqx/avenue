"""
Suspense service — routes anomalous payments to the suspense table.
"""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.suspense import SuspenseItem


async def create_suspense_item(
    developer_id: uuid.UUID,
    account_number: str,
    amount_kobo: int,
    sender_name: str | None,
    raw_narration: str | None,
    nomba_reference: str | None,
    reason: str,
    raw_payload: dict,
    db: AsyncSession,
) -> SuspenseItem:
    item = SuspenseItem(
        developer_id=developer_id,
        account_number=account_number,
        amount=amount_kobo,
        sender_name=sender_name,
        raw_narration=raw_narration,
        nomba_reference=nomba_reference,
        reason=reason,
        raw_payload=raw_payload,
    )
    db.add(item)
    await db.flush()
    return item
