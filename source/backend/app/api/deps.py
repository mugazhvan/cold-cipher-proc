import uuid
import jwt
from typing import AsyncGenerator, Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.database import get_db
from app.models.users import User, UserRole
from app.schemas.auth import TokenPayload

security = HTTPBearer()

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    try:
        payload = jwt.decode(
            token.credentials, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        
        if token_data.type == "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token cannot be used to access resources",
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    user_id = uuid.UUID(token_data.sub)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    return user

def RoleChecker(allowed_roles: list[UserRole]) -> Callable:
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )
        return current_user
    return role_checker

async def verify_centre_access(db: AsyncSession, current_user: User, target_centre_id: uuid.UUID):
    if current_user.role == UserRole.ADMIN:
        return
    from app.models.entities import Officer, Centre
    result = await db.execute(select(Officer).where(Officer.user_id == current_user.id))
    officer = result.scalars().first()
    if not officer:
        c_res = await db.execute(select(Centre).where(Centre.id == target_centre_id))
        if c_res.scalars().first():
            officer = Officer(
                user_id=current_user.id,
                name=f"Officer-{current_user.phone[-4:] if current_user.phone else 'Staff'}",
                centre_id=target_centre_id,
                designation="Centre Operator"
            )
            db.add(officer)
            try:
                await db.commit()
                return
            except Exception:
                await db.rollback()
        raise HTTPException(status_code=403, detail="Not authorized to access this centre")
    if officer.centre_id != target_centre_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this centre")
