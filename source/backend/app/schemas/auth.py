import uuid
from typing import Optional, Any
from pydantic import BaseModel, Field

# Common standard response envelope
class StandardResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: str
    request_id: Optional[str] = None

class OTPSendRequest(BaseModel):
    phone: str = Field(..., description="Phone number to send OTP to")

class OTPVerifyRequest(BaseModel):
    phone: str = Field(..., description="Phone number")
    otp: str = Field(..., description="OTP received")

class LoginRequest(BaseModel):
    verification_token: str = Field(..., description="Token received from OTP verification")
    role: str = Field(..., description="Role to log in as (e.g. FARMER, CENTRE_OPERATOR)")

class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., description="Valid refresh token")

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None

class UserInfo(BaseModel):
    id: uuid.UUID
    phone: str
    role: str
    name: Optional[str] = None

class TokenResponseData(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: Optional[UserInfo] = None
