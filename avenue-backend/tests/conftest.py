"""
Shared test fixtures.

Tests run against the live app (via an in-process ASGI transport) and the
DATABASE_URL configured in the environment. Each fixture seeds the rows it needs
directly through the app's own session factory and cleans them up afterwards, so
the suite is self-contained and leaves no residue.
"""
import asyncio
import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete

from app.core.security import generate_api_key
from app.db.models.developer import ApiKey, Developer
from app.db.models.idempotency import IdempotencyKey
from app.db.models.ledger import LedgerEntry
from app.db.models.wallet import Wallet
from app.db.session import AsyncSessionLocal
from app.main import app


def _account_number() -> str:
    """A unique 10-digit NUBAN-like account number."""
    return f"{uuid.uuid4().int % 10**10:010d}"


@pytest.fixture(scope="session")
def event_loop():
    """
    One event loop for the whole session. The app's async DB engine is created at
    import time and binds to a single loop; sharing one loop keeps every test and
    fixture on that loop (avoids asyncpg "attached to a different loop" errors).
    """
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def client() -> AsyncClient:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def env():
    """
    Seed a verified developer, an API key, and two ACTIVE wallets that share a
    sub-account (so transfers between them settle internally on the ledger with
    no external Nomba call). The source wallet is pre-funded.
    """
    developer_id = uuid.uuid4()
    full_key, prefix, key_hash = generate_api_key("test")
    sub_account = f"sub_{uuid.uuid4().hex[:8]}"

    source_id = uuid.uuid4()
    dest_id = uuid.uuid4()
    dest_account = _account_number()
    starting_balance = 100_000  # kobo

    async with AsyncSessionLocal() as db:
        db.add(Developer(
            id=developer_id,
            email=f"test-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="x",
            company_name="Test Co",
            is_verified=True,
        ))
        db.add(ApiKey(
            developer_id=developer_id, key_hash=key_hash, key_prefix=prefix, type="test",
        ))
        for wid, acct in ((source_id, _account_number()), (dest_id, dest_account)):
            db.add(Wallet(
                id=wid,
                developer_id=developer_id,
                customer_reference=f"cust_{uuid.uuid4().hex[:6]}",
                first_name="Test",
                last_name="User",
                email="wallet@example.com",
                nomba_account_id=f"nomba_{uuid.uuid4().hex[:8]}",
                nomba_sub_account_id=sub_account,
                account_number=acct,
                bank_name="Test Bank",
                account_name="Test User",
                status="ACTIVE",
                allow_transfers_out=True,
            ))
        # Pre-fund the source wallet with a settled credit.
        db.add(LedgerEntry(
            wallet_id=source_id,
            developer_id=developer_id,
            type="CREDIT",
            amount=starting_balance,
            balance_before=0,
            balance_after=starting_balance,
            currency="NGN",
            status="SETTLED",
            nomba_reference=f"SEED-{uuid.uuid4().hex[:12]}",
        ))
        await db.commit()

    yield {
        "developer_id": developer_id,
        "api_key": full_key,
        "source_wallet_id": source_id,
        "dest_account_number": dest_account,
        "starting_balance": starting_balance,
    }

    # Teardown: ledger + idempotency first (FK RESTRICT), then wallets, key, developer.
    async with AsyncSessionLocal() as db:
        await db.execute(delete(LedgerEntry).where(LedgerEntry.developer_id == developer_id))
        await db.execute(delete(IdempotencyKey).where(IdempotencyKey.developer_id == developer_id))
        await db.execute(delete(Wallet).where(Wallet.developer_id == developer_id))
        await db.execute(delete(ApiKey).where(ApiKey.developer_id == developer_id))
        await db.execute(delete(Developer).where(Developer.id == developer_id))
        await db.commit()
