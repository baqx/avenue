"""
Nomba API client — all calls to Nomba go through this service.
Handles: creating virtual accounts (NUBANs), initiating transfers.
"""
import httpx
from app.core.config import settings
from app.services.encryption import decrypt


class NombaAPIError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def _get_nomba_token(client_id: str, encrypted_secret: str) -> str:
    """Exchange Nomba client credentials for an access token."""
    client_secret = decrypt(encrypted_secret)
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.NOMBA_BASE_URL}/auth/token/",
            json={"clientId": client_id, "clientSecret": client_secret},
            timeout=15.0,
        )
        if response.status_code != 200:
            raise NombaAPIError(f"Nomba auth failed: {response.text}", response.status_code)
        data = response.json()
        return data["data"]["accessToken"]


async def create_virtual_account(
    client_id: str,
    encrypted_secret: str,
    account_name: str,
    customer_email: str,
    customer_reference: str,
) -> dict:
    """
    Create a dedicated virtual account (NUBAN) on Nomba.
    Returns: { account_number, bank_name, account_name, nomba_account_id }
    """
    token = await _get_nomba_token(client_id, encrypted_secret)
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.NOMBA_BASE_URL}/accounts/virtual/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "accountName": account_name,
                "customerEmail": customer_email,
                "customerReference": customer_reference,
                "currencyCode": "NGN",
            },
            timeout=15.0,
        )
        if response.status_code not in (200, 201):
            raise NombaAPIError(f"Nomba account creation failed: {response.text}", response.status_code)
        data = response.json()["data"]
        return {
            "account_number": data["accountNumber"],
            "bank_name": data.get("bankName", "Nomba MFB"),
            "account_name": data["accountName"],
            "nomba_account_id": data["accountId"],
        }


async def initiate_transfer(
    client_id: str,
    encrypted_secret: str,
    source_account_id: str,
    destination_account_number: str,
    destination_bank_code: str,
    amount_kobo: int,
    narration: str,
) -> dict:
    """
    Initiate an outbound transfer from a virtual account.
    Amount is in kobo — converted to NGN for Nomba API.
    """
    token = await _get_nomba_token(client_id, encrypted_secret)
    amount_ngn = amount_kobo / 100
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.NOMBA_BASE_URL}/transfers/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "sourceAccountId": source_account_id,
                "destinationAccountNumber": destination_account_number,
                "destinationBankCode": destination_bank_code,
                "amount": amount_ngn,
                "narration": narration,
            },
            timeout=20.0,
        )
        if response.status_code not in (200, 201):
            raise NombaAPIError(f"Nomba transfer failed: {response.text}", response.status_code)
        return response.json()["data"]
