"""
Nomba API client — all calls to Nomba go through this service.
Handles: authentication, creating virtual accounts (NUBANs), initiating transfers.

All endpoints follow the official Nomba API documentation:
  - Auth: POST /v1/auth/token/issue
  - Virtual Accounts: POST /v1/accounts/virtual
  - Transfers: POST /v2/transfers/bank
"""
import uuid

import httpx
from app.core.config import settings
from app.services.encryption import decrypt
from app.core.currency import kobo_to_ngn_str


class NombaAPIError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


import time
from datetime import datetime

_TOKEN_CACHE = {}  # { client_id: {"token": "...", "expires_at": timestamp_float} }

async def _get_nomba_token(account_id: str, client_id: str, encrypted_secret: str) -> str:
    """
    Exchange Nomba client credentials for an access token, with caching.

    Nomba auth endpoint: POST /v1/auth/token/issue
    Requires: accountId header, grant_type, client_id, client_secret in body.
    """
    now = time.time()
    cached = _TOKEN_CACHE.get(client_id)
    # Refresh if expired or expiring within 5 minutes (300 seconds)
    if cached and cached["expires_at"] > now + 300:
        return cached["token"]

    client_secret = decrypt(encrypted_secret)
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.NOMBA_BASE_URL}/v1/auth/token/issue",
            headers={
                "Content-Type": "application/json",
                "accountId": account_id,
            },
            json={
                "grant_type": "client_credentials",
                "client_id": client_id,
                "client_secret": client_secret,
            },
            timeout=15.0,
        )
        if response.status_code != 200:
            raise NombaAPIError(f"Nomba auth failed: {response.text}", response.status_code)
        result = response.json()
        if result.get("code") != "00":
            raise NombaAPIError(f"Nomba auth error: {result.get('description', 'Unknown')}")
        
        data = result["data"]
        token = data["access_token"]
        
        # Nomba returns expiresAt in ISO format, but we'll just cache for 30 minutes 
        # (1800 seconds) from now as per their documentation
        _TOKEN_CACHE[client_id] = {
            "token": token,
            "expires_at": now + 1800
        }
        return token


async def create_virtual_account(
    account_id: str,
    client_id: str,
    encrypted_secret: str,
    account_ref: str,
    account_name: str,
) -> dict:
    """
    Create a dedicated virtual account (NUBAN) on Nomba.

    Nomba endpoint: POST /v1/accounts/virtual
    Required fields: accountRef (16-64 chars), accountName (8-64 chars)

    Returns: { account_number, bank_name, account_name, nomba_account_id, account_ref }
    """
    token = await _get_nomba_token(account_id, client_id, encrypted_secret)
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.NOMBA_BASE_URL}/v1/accounts/virtual",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "accountId": account_id,
            },
            json={
                "accountRef": account_ref,
                "accountName": account_name,
            },
            timeout=15.0,
        )
        if response.status_code not in (200, 201):
            raise NombaAPIError(f"Nomba account creation failed: {response.text}", response.status_code)
        result = response.json()
        if result.get("code") != "00":
            raise NombaAPIError(f"Nomba account creation error: {result.get('description', 'Unknown')}")
        data = result["data"]
        return {
            "account_number": data["bankAccountNumber"],
            "bank_name": data.get("bankName", "Nombank MFB"),
            "account_name": data.get("bankAccountName", account_name),
            "nomba_account_id": data.get("accountHolderId", ""),
            "account_ref": data.get("accountRef", account_ref),
        }


async def initiate_transfer(
    account_id: str,
    client_id: str,
    encrypted_secret: str,
    destination_account_number: str,
    destination_bank_code: str,
    destination_account_name: str,
    amount_kobo: int,
    narration: str,
    sender_name: str,
    merchant_tx_ref: str | None = None,
) -> dict:
    """
    Initiate an outbound bank transfer from the parent account.

    Nomba endpoint: POST /v2/transfers/bank
    Amount is in kobo internally — converted to NGN for Nomba API.
    merchantTxRef is the idempotency key (required by Nomba).
    """
    token = await _get_nomba_token(account_id, client_id, encrypted_secret)
    amount_ngn_str = kobo_to_ngn_str(amount_kobo)

    # Generate a unique merchantTxRef if not provided
    if not merchant_tx_ref:
        merchant_tx_ref = f"AVE-{uuid.uuid4().hex[:16].upper()}"

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.NOMBA_BASE_URL}/v2/transfers/bank",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "accountId": account_id,
            },
            json={
                "amount": float(amount_ngn_str),
                "accountNumber": destination_account_number,
                "bankCode": destination_bank_code,
                "accountName": destination_account_name,
                "merchantTxRef": merchant_tx_ref,
                "narration": narration,
                "senderName": sender_name,
            },
            timeout=20.0,
        )
        if response.status_code not in (200, 201):
            raise NombaAPIError(f"Nomba transfer failed: {response.text}", response.status_code)
        return response.json().get("data", {})
