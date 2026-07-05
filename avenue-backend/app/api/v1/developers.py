"""Developer settings routes — profile, API keys, Nomba config, webhooks."""
import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import CurrentDeveloperJWT
from app.core.errors import BadRequestError, NotFoundError
from app.core.security import generate_api_key, hash_password, verify_password
from app.db.models.developer import ApiKey, Developer
from app.db.models.nomba_config import NombaConfig, OutboundWebhook
from app.db.session import get_db
from app.schemas.developer import (
    ApiKeyResponse, ChangePasswordRequest, CreateApiKeyRequest,
    DeveloperProfile, NewApiKeyResponse, NombaConfigRequest,
    NombaConfigResponse, OutboundWebhookRequest, OutboundWebhookResponse,
    UpdateDeveloperRequest,
)
from app.services.encryption import encrypt

router = APIRouter()


@router.get("/me", response_model=DeveloperProfile)
async def get_profile(developer: Developer = CurrentDeveloperJWT):
    return DeveloperProfile.model_validate(developer)


@router.patch("/me", response_model=DeveloperProfile)
async def update_profile(
    body: UpdateDeveloperRequest,
    developer: Developer = CurrentDeveloperJWT,
    db: AsyncSession = Depends(get_db),
):
    if body.company_name:
        developer.company_name = body.company_name
    if body.email:
        developer.email = body.email
    await db.commit()
    await db.refresh(developer)
    return DeveloperProfile.model_validate(developer)


@router.patch("/me/password")
async def change_password(
    body: ChangePasswordRequest,
    developer: Developer = CurrentDeveloperJWT,
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(body.current_password, developer.hashed_password):
        raise BadRequestError("Current password is incorrect.")
    developer.hashed_password = hash_password(body.new_password)
    await db.commit()
    return {"message": "Password changed successfully."}


@router.get("/me/keys", response_model=list[ApiKeyResponse])
async def list_api_keys(developer: Developer = CurrentDeveloperJWT):
    return [ApiKeyResponse.model_validate(k) for k in developer.api_keys if k.revoked_at is None]


@router.post("/me/keys", response_model=NewApiKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    body: CreateApiKeyRequest,
    developer: Developer = CurrentDeveloperJWT,
    db: AsyncSession = Depends(get_db),
):
    full_key, prefix, key_hash = generate_api_key(body.type)
    key = ApiKey(developer_id=developer.id, key_hash=key_hash, key_prefix=prefix, label=body.label, type=body.type)
    db.add(key)
    await db.commit()
    await db.refresh(key)
    return NewApiKeyResponse(id=key.id, full_key=full_key, key_prefix=prefix, label=body.label, type=body.type, created_at=key.created_at)


@router.delete("/me/keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(key_id: uuid.UUID, developer: Developer = CurrentDeveloperJWT, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id, ApiKey.developer_id == developer.id))
    key = result.scalar_one_or_none()
    if not key:
        raise NotFoundError("API key")
    key.revoked_at = datetime.now(timezone.utc)
    await db.commit()


@router.post("/me/nomba-config", response_model=NombaConfigResponse)
async def save_nomba_config(
    body: NombaConfigRequest,
    developer: Developer = CurrentDeveloperJWT,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(NombaConfig).where(NombaConfig.developer_id == developer.id))
    config = result.scalar_one_or_none()
    if config:
        config.account_id = body.account_id
        config.client_id = body.client_id
        config.encrypted_client_secret = encrypt(body.client_secret)
        config.webhook_signature_key = body.webhook_signature_key
    else:
        config = NombaConfig(
            developer_id=developer.id,
            account_id=body.account_id,
            client_id=body.client_id,
            encrypted_client_secret=encrypt(body.client_secret),
            webhook_signature_key=body.webhook_signature_key,
        )
        db.add(config)
    await db.commit()
    await db.refresh(config)
    return NombaConfigResponse(
        account_id=config.account_id,
        client_id=config.client_id,
        client_secret_masked="••••••••" + body.client_secret[-4:],
        inbound_webhook_url=f"{settings.BACKEND_URL}/v1/webhooks/inbound/{developer.id}",
    )


@router.get("/me/nomba-config", response_model=NombaConfigResponse)
async def get_nomba_config(developer: Developer = CurrentDeveloperJWT, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NombaConfig).where(NombaConfig.developer_id == developer.id))
    config = result.scalar_one_or_none()
    if not config:
        raise NotFoundError("Nomba configuration")
    return NombaConfigResponse(
        account_id=config.account_id,
        client_id=config.client_id,
        client_secret_masked="••••••••",
        inbound_webhook_url=f"{settings.BACKEND_URL}/v1/webhooks/inbound/{developer.id}",
    )


@router.get("/me/inbound-webhook-url")
async def get_inbound_webhook_url(developer: Developer = CurrentDeveloperJWT):
    return {"url": f"{settings.BACKEND_URL}/v1/webhooks/inbound/{developer.id}"}


@router.post("/me/outbound-webhook", response_model=OutboundWebhookResponse)
async def set_outbound_webhook(
    body: OutboundWebhookRequest,
    developer: Developer = CurrentDeveloperJWT,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(OutboundWebhook).where(OutboundWebhook.developer_id == developer.id))
    webhook = result.scalar_one_or_none()
    if webhook:
        webhook.url = body.url
    else:
        webhook = OutboundWebhook(developer_id=developer.id, url=body.url, signing_secret=secrets.token_urlsafe(32))
        db.add(webhook)
    await db.commit()
    await db.refresh(webhook)
    return OutboundWebhookResponse.model_validate(webhook)


@router.get("/me/outbound-webhook", response_model=OutboundWebhookResponse)
async def get_outbound_webhook(developer: Developer = CurrentDeveloperJWT, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OutboundWebhook).where(OutboundWebhook.developer_id == developer.id))
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise NotFoundError("Outbound webhook")
    return OutboundWebhookResponse.model_validate(webhook)


@router.delete("/me/outbound-webhook", status_code=status.HTTP_204_NO_CONTENT)
async def delete_outbound_webhook(developer: Developer = CurrentDeveloperJWT, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OutboundWebhook).where(OutboundWebhook.developer_id == developer.id))
    webhook = result.scalar_one_or_none()
    if webhook:
        await db.delete(webhook)
        await db.commit()
