"""
Idempotency service — makes client-initiated write endpoints safe to retry.

A client attaches an `Idempotency-Key` header to a write request. The first
request with a given (developer, key) runs normally and its response is stored;
any retry with the same key replays that stored response verbatim instead of
executing the work a second time. This prevents duplicate transfers / duplicate
wallet provisioning when a client retries after a timeout.

Usage inside a route:

    idem = Idempotency(request, developer.id)
    replay = await idem.begin()
    if replay is not None:
        return replay
    try:
        response = StandardResponse(data=...)
        await idem.complete(status_code=200, body=response.model_dump(mode="json"))
        return response
    except Exception:
        await idem.release()
        raise

When no `Idempotency-Key` header is present the guard is inert and the endpoint
behaves exactly as before (fully backward compatible).
"""
import hashlib
import uuid

from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError
from app.db.models.idempotency import IdempotencyKey
from app.db.session import AsyncSessionLocal

HEADER_NAME = "Idempotency-Key"
_STATUS_IN_PROGRESS = "IN_PROGRESS"
_STATUS_COMPLETED = "COMPLETED"


def _hash_request(method: str, path: str, body: bytes) -> str:
    """Fingerprint a request so key reuse with a different payload can be rejected."""
    hasher = hashlib.sha256()
    hasher.update(method.upper().encode())
    hasher.update(b"\n")
    hasher.update(path.encode())
    hasher.update(b"\n")
    hasher.update(body or b"")
    return hasher.hexdigest()


class Idempotency:
    """
    Per-request idempotency guard. Uses its own DB session so bookkeeping is
    never tangled with the business transaction the route manages.
    """

    def __init__(self, request: Request, developer_id: uuid.UUID):
        self._request = request
        self._developer_id = developer_id
        self._key: str | None = request.headers.get(HEADER_NAME)
        self._record_id: uuid.UUID | None = None
        self.active: bool = bool(self._key)

    async def begin(self) -> JSONResponse | None:
        """
        Claim the key before doing any work.

        Returns:
          - None  → first time (or no key): proceed and run the endpoint normally.
          - JSONResponse → a completed prior response to replay verbatim.

        Raises ConflictError (409) when the same key is reused with a different
        body, or when an identical request is still being processed.
        """
        if not self.active:
            return None

        request_hash = _hash_request(
            self._request.method,
            self._request.url.path,
            await self._request.body(),
        )

        async with AsyncSessionLocal() as db:
            record = IdempotencyKey(
                developer_id=self._developer_id,
                idempotency_key=self._key,
                request_hash=request_hash,
                status=_STATUS_IN_PROGRESS,
            )
            db.add(record)
            try:
                await db.commit()
            except IntegrityError:
                # The (developer, key) pair already exists — this is a retry.
                await db.rollback()
                return await self._handle_existing(db, request_hash)

            self._record_id = record.id
            return None

    async def _handle_existing(self, db: AsyncSession, request_hash: str) -> JSONResponse:
        result = await db.execute(
            select(IdempotencyKey).where(
                IdempotencyKey.developer_id == self._developer_id,
                IdempotencyKey.idempotency_key == self._key,
            )
        )
        existing = result.scalar_one()

        if existing.request_hash != request_hash:
            raise ConflictError(
                "This Idempotency-Key was already used with a different request payload."
            )

        if existing.status != _STATUS_COMPLETED:
            raise ConflictError(
                "A request with this Idempotency-Key is still being processed. Retry shortly."
            )

        return JSONResponse(status_code=existing.response_status or 200, content=existing.response_body)

    async def complete(self, status_code: int, body: dict) -> None:
        """Persist the successful response so future retries replay it."""
        if not self.active or self._record_id is None:
            return
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(IdempotencyKey).where(IdempotencyKey.id == self._record_id)
            )
            record = result.scalar_one_or_none()
            if record is None:
                return
            record.status = _STATUS_COMPLETED
            record.response_status = status_code
            record.response_body = body
            await db.commit()

    async def release(self) -> None:
        """Drop the claim after a failed attempt so the client can retry the key."""
        if not self.active or self._record_id is None:
            return
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(IdempotencyKey).where(IdempotencyKey.id == self._record_id)
            )
            record = result.scalar_one_or_none()
            if record is not None and record.status != _STATUS_COMPLETED:
                await db.delete(record)
                await db.commit()
