"""
Encryption service using AES-256 (Fernet) for encrypting sensitive values like
Nomba client secrets at rest.
"""
import base64
from cryptography.fernet import Fernet
from app.core.config import settings


def _get_fernet() -> Fernet:
    """Build a Fernet cipher from the ENCRYPTION_KEY env var."""
    # ENCRYPTION_KEY must be a URL-safe base64-encoded 32-byte key
    key = settings.ENCRYPTION_KEY.encode()
    # Pad/encode to ensure it's valid Fernet key format
    key_bytes = base64.urlsafe_b64decode(key + b"=" * (4 - len(key) % 4))
    fernet_key = base64.urlsafe_b64encode(key_bytes[:32])
    return Fernet(fernet_key)


def encrypt(plaintext: str) -> str:
    """Encrypt a string and return the ciphertext as a string."""
    f = _get_fernet()
    return f.encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    """Decrypt a ciphertext string and return the original plaintext."""
    f = _get_fernet()
    return f.decrypt(ciphertext.encode()).decode()
