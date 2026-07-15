"""
Idempotency-Key behaviour on the public write API.

The transfers here resolve to internal (ledger-only) moves between two wallets on
the same sub-account, so no external Nomba call is made.
"""
import uuid

from sqlalchemy import func, select

from app.db.models.ledger import LedgerEntry
from app.db.session import AsyncSessionLocal


async def _debit_count(source_wallet_id: uuid.UUID) -> int:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(func.count(LedgerEntry.id)).where(
                LedgerEntry.wallet_id == source_wallet_id,
                LedgerEntry.type == "DEBIT",
            )
        )
        return result.scalar() or 0


def _transfer_body(env, amount=25_000):
    return {
        "destination_account_number": env["dest_account_number"],
        "amount": amount,
        "narration": "idempotency test",
    }


async def test_transfer_without_key_still_works(client, env):
    """Backward compatibility: no Idempotency-Key header behaves exactly as before."""
    headers = {"x-api-key": env["api_key"]}
    resp = await client.post(
        f"/v1/wallets/{env['source_wallet_id']}/transfer",
        json=_transfer_body(env),
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["data"]["status"] == "SUCCESS"
    assert await _debit_count(env["source_wallet_id"]) == 1


async def test_retry_with_same_key_does_not_double_transfer(client, env):
    """The core guarantee: a retried transfer moves money exactly once."""
    key = str(uuid.uuid4())
    headers = {"x-api-key": env["api_key"], "Idempotency-Key": key}
    url = f"/v1/wallets/{env['source_wallet_id']}/transfer"
    body = _transfer_body(env)

    first = await client.post(url, json=body, headers=headers)
    second = await client.post(url, json=body, headers=headers)

    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    # The replay is the stored response, byte-for-byte.
    assert first.json() == second.json()
    # Money moved once, not twice.
    assert await _debit_count(env["source_wallet_id"]) == 1

    balance = await client.get(
        f"/v1/wallets/{env['source_wallet_id']}/balance",
        headers={"x-api-key": env["api_key"]},
    )
    assert balance.json()["data"]["balance"] == env["starting_balance"] - 25_000


async def test_same_key_different_body_is_rejected(client, env):
    """Reusing a key with a different payload is a client error, not a silent replay."""
    key = str(uuid.uuid4())
    headers = {"x-api-key": env["api_key"], "Idempotency-Key": key}
    url = f"/v1/wallets/{env['source_wallet_id']}/transfer"

    first = await client.post(url, json=_transfer_body(env, amount=25_000), headers=headers)
    assert first.status_code == 200, first.text

    conflict = await client.post(url, json=_transfer_body(env, amount=40_000), headers=headers)
    assert conflict.status_code == 409, conflict.text
    # Only the first transfer moved money.
    assert await _debit_count(env["source_wallet_id"]) == 1


async def test_distinct_keys_allow_distinct_transfers(client, env):
    """Different keys are independent — two real transfers go through."""
    url = f"/v1/wallets/{env['source_wallet_id']}/transfer"
    for _ in range(2):
        headers = {"x-api-key": env["api_key"], "Idempotency-Key": str(uuid.uuid4())}
        resp = await client.post(url, json=_transfer_body(env, amount=10_000), headers=headers)
        assert resp.status_code == 200, resp.text
    assert await _debit_count(env["source_wallet_id"]) == 2
