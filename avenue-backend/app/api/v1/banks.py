from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentDeveloper
from app.core.errors import BadRequestError
from app.db.models.developer import Developer
from app.db.models.nomba_config import NombaConfig
from app.db.session import get_db
from app.schemas.base import StandardResponse
from app.schemas.banks import BankListResponse, BankResponse, BankAccountLookupRequest, BankAccountLookupResponse
from app.services import nomba

router = APIRouter()

@router.get("", response_model=StandardResponse[BankListResponse])
async def list_banks(
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(NombaConfig).where(NombaConfig.developer_id == developer.id))
    nomba_config = result.scalar_one_or_none()
    if not nomba_config:
        raise BadRequestError("Nomba config not found.")

    banks_data = await nomba.get_banks(
        account_id=nomba_config.account_id,
        client_id=nomba_config.client_id,
        encrypted_secret=nomba_config.encrypted_client_secret,
    )
    
    banks = [BankResponse(code=b["code"], name=b["name"]) for b in banks_data]
    return StandardResponse(data=BankListResponse(items=banks))


@router.post("/resolve", response_model=StandardResponse[BankAccountLookupResponse])
async def resolve_bank_account(
    body: BankAccountLookupRequest,
    developer: Developer = CurrentDeveloper,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(NombaConfig).where(NombaConfig.developer_id == developer.id))
    nomba_config = result.scalar_one_or_none()
    if not nomba_config:
        raise BadRequestError("Nomba config not found.")

    lookup_data = await nomba.resolve_bank_account(
        account_id=nomba_config.account_id,
        client_id=nomba_config.client_id,
        encrypted_secret=nomba_config.encrypted_client_secret,
        account_number=body.account_number,
        bank_code=body.bank_code,
    )
    
    return StandardResponse(data=BankAccountLookupResponse(
        account_number=lookup_data.get("accountNumber", body.account_number),
        account_name=lookup_data.get("accountName", "Unknown")
    ))
