from pydantic import BaseModel
from typing import List


class BankResponse(BaseModel):
    code: str
    name: str

    model_config = {"from_attributes": True}


class BankListResponse(BaseModel):
    items: List[BankResponse]


class BankAccountLookupRequest(BaseModel):
    account_number: str
    bank_code: str


class BankAccountLookupResponse(BaseModel):
    account_number: str
    account_name: str

    model_config = {"from_attributes": True}
