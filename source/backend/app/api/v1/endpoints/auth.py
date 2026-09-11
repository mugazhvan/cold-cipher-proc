import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import jwt

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token
from app.models.users import User, UserRole
from app.schemas.auth import (
    OTPSendRequest, OTPVerifyRequest, LoginRequest, RefreshRequest,
    StandardResponse, TokenResponseData, UserInfo, TokenPayload
)
from app.api.deps import get_current_user

router = APIRouter()

# MVP Mock OTP Store (In-memory for prototype)
MOCK_OTP_STORE = {}

@router.post("/otp/send", response_model=StandardResponse, status_code=201)
async def send_otp(request: OTPSendRequest) -> Any:
    # MVP: Mock OTP Generation
    if settings.OTP_MODE == "mock":
        MOCK_OTP_STORE[request.phone] = settings.MOCK_OTP_CODE
        delivery = "SIMULATED"
    else:
        # Implement real SMS sending logic here
        delivery = "REAL"
        
    return {
        "success": True,
        "data": {"expires_in": 300, "delivery": delivery},
        "message": "OTP sent."
    }

@router.post("/otp/verify", response_model=StandardResponse)
async def verify_otp(request: OTPVerifyRequest) -> Any:
    if settings.OTP_MODE == "mock":
        expected_otp = MOCK_OTP_STORE.get(request.phone)
        if not expected_otp or request.otp != expected_otp:
            raise HTTPException(status_code=401, detail="Invalid or expired OTP")
    else:
        # Implement real OTP verification logic here
        pass

    # Provide a temporary verification token that they can exchange for JWT
    verification_token = f"temp-{uuid.uuid4()}"
    MOCK_OTP_STORE[verification_token] = request.phone

    return {
        "success": True,
        "data": {"verified": True, "verification_token": verification_token},
        "message": "OTP verified."
    }

@router.post("/login", response_model=StandardResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)) -> Any:
    # 1. Verify temporary token
    phone = MOCK_OTP_STORE.get(request.verification_token)
    if not phone:
        raise HTTPException(status_code=401, detail="Invalid or expired verification token")
    
    # 2. Map role
    try:
        user_role = UserRole[request.role.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid role specified")

    # 3. Find or Create User
    result = await db.execute(
        select(User).where(User.phone == phone)
    )
    user = result.scalars().first()
    
    if user and user.role != user_role:
        raise HTTPException(status_code=403, detail="Role mismatch for this phone number")
        
    if not user:
        # For prototype, auto-register
        user = User(
            phone=phone,
            role=user_role,
            is_active=True
        )
        db.add(user)
        try:
            await db.commit()
            await db.refresh(user)
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=400, detail="Could not create user")
        
        # Auto-create a Farmer profile for FARMER role users
        if user_role == UserRole.FARMER:
            from app.models.entities import Farmer
            farmer = Farmer(
                user_id=user.id,
                name=f"Farmer-{phone[-4:]}",  # Placeholder name from last 4 digits
            )
            db.add(farmer)
            try:
                await db.commit()
            except Exception:
                await db.rollback()
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # 4. Generate Tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    # Clean up verification token
    del MOCK_OTP_STORE[request.verification_token]
    
    # Optional Name from farmer profile (also ensure profile exists for existing users)
    user_name = None
    if user.role == UserRole.FARMER:
        from app.models.entities import Farmer
        f_result = await db.execute(select(Farmer).where(Farmer.user_id == user.id))
        farmer = f_result.scalars().first()
        if not farmer:
            # Backfill: create Farmer profile for pre-existing users who don't have one
            farmer = Farmer(user_id=user.id, name=f"Farmer-{phone[-4:]}")
            db.add(farmer)
            try:
                await db.commit()
                await db.refresh(farmer)
            except Exception:
                await db.rollback()
        if farmer:
            user_name = farmer.name

    if user.role in (UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER):
        from app.models.entities import Officer, Centre
        o_result = await db.execute(select(Officer).where(Officer.user_id == user.id))
        officer = o_result.scalars().first()
        if not officer:
            # Find default demo centre (MDC001) or first available centre
            c_res = await db.execute(select(Centre).order_by(Centre.created_at))
            default_centre = c_res.scalars().first()
            officer = Officer(
                user_id=user.id,
                name=f"Officer-{phone[-4:]}",
                centre_id=default_centre.id if default_centre else None,
                designation="Centre Operator & Weighbridge Lead"
            )
            db.add(officer)
            try:
                await db.commit()
                await db.refresh(officer)
            except Exception:
                await db.rollback()
        if officer:
            user_name = officer.name

    return {
        "success": True,
        "data": TokenResponseData(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserInfo(id=user.id, phone=user.phone, role=user.role if isinstance(user.role, str) else getattr(user.role, 'value', str(user.role)), name=user_name)
        ).model_dump(),
        "message": "Login successful."
    }

@router.post("/refresh", response_model=StandardResponse)
async def refresh_token(request: RefreshRequest, db: AsyncSession = Depends(get_db)) -> Any:
    try:
        payload = jwt.decode(
            request.refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        
        if token_data.type != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
            
        user_id = uuid.UUID(token_data.sub)
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or inactive")
            
        access_token = create_access_token(user.id)
        new_refresh_token = create_refresh_token(user.id)
        
        return {
            "success": True,
            "data": {
                "access_token": access_token,
                "refresh_token": new_refresh_token,
                "token_type": "Bearer",
                "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
            },
            "message": "Token refreshed."
        }
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/logout", status_code=204)
async def logout(current_user: User = Depends(get_current_user)) -> None:
    # In a real system, you'd invalidate the refresh token in the DB or cache
    return None

@router.get("/me", response_model=StandardResponse)
async def read_users_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    user_name = None
    if current_user.role == UserRole.FARMER:
        from app.models.entities import Farmer
        f_result = await db.execute(select(Farmer).where(Farmer.user_id == current_user.id))
        farmer = f_result.scalars().first()
        if farmer:
            user_name = farmer.name
            
    return {
        "success": True,
        "data": UserInfo(
            id=current_user.id,
            phone=current_user.phone,
            role=current_user.role if isinstance(current_user.role, str) else getattr(current_user.role, 'value', str(current_user.role)),
            name=user_name
        ).model_dump(),
        "message": "Current user returned."
    }
