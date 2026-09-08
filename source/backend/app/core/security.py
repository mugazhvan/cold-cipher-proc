from datetime import datetime, timedelta, timezone
from typing import Any, Union
import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def create_refresh_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
        )
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

import hmac
import hashlib
import base64
import json
import time

def create_signed_qr_payload(booking_ref: str, centre_id: str, expiry_ts: int) -> str:
    """Generates a cryptographically signed QR payload using HMAC-SHA256."""
    # Ensure canonical JSON representation
    data = json.dumps({
        "b": booking_ref,
        "c": centre_id,
        "e": expiry_ts
    }, separators=(',', ':'), sort_keys=True)
    
    # Generate HMAC-SHA256 signature
    signature = hmac.new(
        settings.QR_SECRET_KEY.encode('utf-8'),
        data.encode('utf-8'),
        hashlib.sha256
    ).digest()
    
    # Base64url encode both data and signature
    encoded_data = base64.urlsafe_b64encode(data.encode('utf-8')).decode('utf-8').rstrip("=")
    encoded_sig = base64.urlsafe_b64encode(signature).decode('utf-8').rstrip("=")
    
    return f"kf-pass:v1:{encoded_data}.{encoded_sig}"

def verify_signed_qr_payload(payload: str) -> dict:
    """
    Verifies a signed QR payload.
    Raises ValueError if format is invalid, signature is tampered, or expired.
    Returns the decoded dictionary.
    """
    if not payload.startswith("kf-pass:v1:"):
        raise ValueError("Invalid QR payload format")
        
    parts = payload[11:].split('.')
    if len(parts) != 2:
        raise ValueError("Invalid QR payload structure")
        
    encoded_data, encoded_sig = parts
    
    # Restore padding
    def decode_b64url(s: str) -> bytes:
        return base64.urlsafe_b64decode(s + "=" * (4 - len(s) % 4))
        
    try:
        data_bytes = decode_b64url(encoded_data)
        sig_bytes = decode_b64url(encoded_sig)
    except Exception:
        raise ValueError("Invalid base64url encoding")
        
    # Recompute signature to verify
    expected_sig = hmac.new(
        settings.QR_SECRET_KEY.encode('utf-8'),
        data_bytes,
        hashlib.sha256
    ).digest()
    
    if not hmac.compare_digest(sig_bytes, expected_sig):
        raise ValueError("Cryptographic signature verification failed")
        
    try:
        data = json.loads(data_bytes.decode('utf-8'))
    except Exception:
        raise ValueError("Invalid payload data structure")
        
    expiry = data.get("e")
    if not expiry or not isinstance(expiry, int) or expiry < int(time.time()):
        raise ValueError("e-Pass has expired")
        
    return {
        "booking_ref": data.get("b"),
        "centre_id": data.get("c"),
        "expiry": expiry
    }
