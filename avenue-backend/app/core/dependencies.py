from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token, hash_api_key
from app.db.session import get_db
from app.db.models.developer import ApiKey, Developer

# ── API Key dependency ────────────────────────────────────────────────────────
api_key_header = APIKeyHeader(name="x-api-key", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_developer_via_api_key(
    api_key: str = Security(api_key_header),
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Developer:
    """Authenticate via x-api-key header OR JWT token (used for public API and dashboard calls)."""
    if not api_key and not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Provide x-api-key header or Bearer token.",
        )
        
    if credentials and not api_key:
        developer_id = decode_access_token(credentials.credentials)
        if not developer_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token.",
            )
        result = await db.execute(select(Developer).where(Developer.id == developer_id))
        developer = result.scalar_one_or_none()
        if not developer or not developer.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Developer account is not verified or does not exist.",
            )
        return developer

    key_hash = hash_api_key(api_key)
    result = await db.execute(
        select(ApiKey)
        .where(ApiKey.key_hash == key_hash)
        .where(ApiKey.revoked_at.is_(None))
    )
    db_key = result.scalar_one_or_none()
    if not db_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key.",
        )

    # Update last_used_at (fire and forget — no await needed for this)
    from datetime import datetime, timezone
    db_key.last_used_at = datetime.now(timezone.utc)
    await db.commit()

    result = await db.execute(
        select(Developer).where(Developer.id == db_key.developer_id)
    )
    developer = result.scalar_one_or_none()
    if not developer or not developer.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Developer account is not verified or does not exist.",
        )
    return developer


async def get_current_developer_via_jwt(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Developer:
    """Authenticate via JWT Bearer token (used for dashboard session calls)."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token.",
        )
    developer_id = decode_access_token(credentials.credentials)
    if not developer_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )
    result = await db.execute(
        select(Developer).where(Developer.id == developer_id)
    )
    developer = result.scalar_one_or_none()
    if not developer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Developer account not found.",
        )
    return developer


# Aliases for cleaner route signatures
CurrentDeveloper = Depends(get_current_developer_via_api_key)
CurrentDeveloperJWT = Depends(get_current_developer_via_jwt)
