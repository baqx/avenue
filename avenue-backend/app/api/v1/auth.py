"""
Auth routes — signup, login, email verification, password reset.
"""
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentDeveloperJWT
from app.core.errors import BadRequestError, ConflictError, NotFoundError
from app.core.security import (
    create_access_token,
    generate_api_key,
    hash_password,
    verify_password,
)
from app.db.models.developer import ApiKey, Developer
from app.db.session import get_db
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
    VerifyEmailRequest,
)
from app.schemas.base import StandardResponse
from typing import Any
from app.services.email import send_password_reset_email, send_verification_email

router = APIRouter()


@router.post("/signup", response_model=StandardResponse[Any], status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Check email uniqueness
    result = await db.execute(select(Developer).where(Developer.email == body.email))
    if result.scalar_one_or_none():
        raise ConflictError("An account with this email already exists.")

    verification_token = secrets.token_urlsafe(32)
    developer = Developer(
        email=body.email,
        hashed_password=hash_password(body.password),
        company_name=body.company_name,
        verification_token=verification_token,
        is_verified=True, #for testing
        verified_at=datetime.now(timezone.utc), #for testing
    )
    db.add(developer)
    await db.flush()

    # Create default live + test API keys
    for key_type in ("live", "test"):
        full_key, prefix, key_hash = generate_api_key(key_type)
        db.add(ApiKey(developer_id=developer.id, key_hash=key_hash, key_prefix=prefix, type=key_type))

    await db.commit()
    # BYPASSED FOR TESTING: await send_verification_email(body.email, body.company_name, verification_token)

    return StandardResponse(data={"message": "Account created successfully. You can now log in."})


@router.post("/login", response_model=StandardResponse[TokenResponse])
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Developer).where(Developer.email == body.email))
    developer = result.scalar_one_or_none()

    if not developer or not verify_password(body.password, developer.hashed_password):
        raise BadRequestError("Invalid email or password.")

    # BYPASSED FOR TESTING:
    # if not developer.is_verified:
    #     raise BadRequestError("Please verify your email before logging in.")

    token = create_access_token(str(developer.id))
    return StandardResponse(data=TokenResponse(access_token=token, developer_id=str(developer.id)))


@router.post("/verify-email", response_model=StandardResponse[Any])
async def verify_email(body: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Developer).where(Developer.verification_token == body.token)
    )
    developer = result.scalar_one_or_none()
    if not developer:
        raise BadRequestError("Invalid or expired verification token.")

    developer.is_verified = True
    developer.verified_at = datetime.now(timezone.utc)
    developer.verification_token = None
    await db.commit()
    return StandardResponse(data={"message": "Email verified successfully. You can now log in."})


@router.post("/resend-verification", response_model=StandardResponse[Any])
async def resend_verification(body: ResendVerificationRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Developer).where(Developer.email == body.email))
    developer = result.scalar_one_or_none()
    if not developer or developer.is_verified:
        return StandardResponse(data={"message": "If this account exists and is unverified, a new email will be sent."})

    token = secrets.token_urlsafe(32)
    developer.verification_token = token
    await db.commit()
    await send_verification_email(body.email, developer.company_name, token)
    return StandardResponse(data={"message": "Verification email resent."})


@router.post("/forgot-password", response_model=StandardResponse[Any])
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Developer).where(Developer.email == body.email))
    developer = result.scalar_one_or_none()
    if developer:
        token = secrets.token_urlsafe(32)
        developer.password_reset_token = token
        developer.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.commit()
        await send_password_reset_email(body.email, token)
    return StandardResponse(data={"message": "If this email exists, a password reset link has been sent."})


@router.post("/reset-password", response_model=StandardResponse[Any])
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Developer).where(Developer.password_reset_token == body.token)
    )
    developer = result.scalar_one_or_none()
    if not developer or (
        developer.password_reset_expires_at and developer.password_reset_expires_at < datetime.now(timezone.utc)
    ):
        raise BadRequestError("Invalid or expired reset token.")

    developer.hashed_password = hash_password(body.new_password)
    developer.password_reset_token = None
    developer.password_reset_expires_at = None
    await db.commit()
    return StandardResponse(data={"message": "Password reset successfully. You can now log in."})


@router.post("/logout", response_model=StandardResponse[Any])
async def logout(developer: Developer = CurrentDeveloperJWT):
    # JWT is stateless — client should discard the token
    return StandardResponse(data={"message": "Logged out successfully."})


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(developer: Developer = CurrentDeveloperJWT, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Developer).where(Developer.id == developer.id))
    dev = result.scalar_one_or_none()
    if dev:
        await db.delete(dev)
        await db.commit()
