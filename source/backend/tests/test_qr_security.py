import pytest
import time
from app.core.security import create_signed_qr_payload, verify_signed_qr_payload
from app.core.config import settings

def test_valid_signed_qr():
    booking_ref = "KF-2026-1234"
    centre_id = "centre-123"
    expiry = int(time.time()) + 3600
    
    payload = create_signed_qr_payload(booking_ref, centre_id, expiry)
    assert payload.startswith("kf-pass:v1:")
    
    # Should decode correctly
    data = verify_signed_qr_payload(payload)
    assert data["booking_ref"] == booking_ref
    assert data["centre_id"] == centre_id
    assert data["expiry"] == expiry

def test_modified_booking_reference():
    booking_ref = "KF-2026-1234"
    centre_id = "centre-123"
    expiry = int(time.time()) + 3600
    
    payload = create_signed_qr_payload(booking_ref, centre_id, expiry)
    
    # Tamper the data part
    parts = payload[11:].split('.')
    data, sig = parts
    
    # Let's decode, change booking_ref, encode again
    import base64
    import json
    
    def decode_b64url(s: str) -> bytes:
        return base64.urlsafe_b64decode(s + "=" * (4 - len(s) % 4))
        
    decoded = json.loads(decode_b64url(data).decode('utf-8'))
    decoded["b"] = "KF-2026-9999"
    tampered_data = base64.urlsafe_b64encode(json.dumps(decoded).encode('utf-8')).decode('utf-8').rstrip("=")
    
    tampered_payload = f"kf-pass:v1:{tampered_data}.{sig}"
    
    with pytest.raises(ValueError, match="Cryptographic signature verification failed"):
        verify_signed_qr_payload(tampered_payload)

def test_modified_signature():
    booking_ref = "KF-2026-1234"
    centre_id = "centre-123"
    expiry = int(time.time()) + 3600
    
    payload = create_signed_qr_payload(booking_ref, centre_id, expiry)
    
    # Tamper the signature part
    tampered_payload = payload[:-4] + "abcd"
    
    with pytest.raises(ValueError, match="Cryptographic signature verification failed"):
        verify_signed_qr_payload(tampered_payload)

def test_fabricated_qr():
    with pytest.raises(ValueError, match="Invalid QR payload format"):
        verify_signed_qr_payload("KISANFLOW://TOKEN/KF-2026-1234")

def test_expired_qr():
    booking_ref = "KF-2026-1234"
    centre_id = "centre-123"
    expiry = int(time.time()) - 3600  # Expired an hour ago
    
    payload = create_signed_qr_payload(booking_ref, centre_id, expiry)
    
    with pytest.raises(ValueError, match="e-Pass has expired"):
        verify_signed_qr_payload(payload)
