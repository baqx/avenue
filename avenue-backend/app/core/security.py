import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# ── Password Hashing ──────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT Tokens ────────────────────────────────────────────────────────────────
ALGORITHM = "HS256"


def create_access_token(subject: str) -> str:
    """Create a JWT token with developer_id as subject."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """Decode JWT and return subject (developer_id), or None if invalid."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


# ── API Key Generation & Hashing ──────────────────────────────────────────────
def generate_api_key(key_type: str = "live") -> tuple[str, str, str]:
    """
    Generate a new API key.
    Returns (full_key, key_prefix_for_display, sha256_hash_for_storage)
    """
    raw = secrets.token_urlsafe(32)
    full_key = f"ave_{key_type}_{raw}"
    prefix = full_key[:16] + "..."  # e.g. "ave_live_xxxxxxx..."
    key_hash = hashlib.sha256(full_key.encode()).hexdigest()
    return full_key, prefix, key_hash


def hash_api_key(api_key: str) -> str:
    """Hash an API key for DB lookup."""
    return hashlib.sha256(api_key.encode()).hexdigest()


# ── HMAC Signature Verification ───────────────────────────────────────────────
def verify_hmac_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verify Nomba HMAC-SHA512 webhook signature."""
    expected = hmac.new(secret.encode(), payload, hashlib.sha512).hexdigest()
    return hmac.compare_digest(expected, signature)


# ── Webhook Signing ───────────────────────────────────────────────────────────
def sign_outbound_webhook(payload: bytes, secret: str) -> str:
    """Sign an outbound Avenue webhook payload using HMAC-SHA256."""
    return hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()


# ── Inbound Webhook Token ─────────────────────────────────────────────────────
def generate_webhook_token() -> str:
    """Generate a secure random token for the developer's inbound webhook URL."""
    return secrets.token_urlsafe(32)
