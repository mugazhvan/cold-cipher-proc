import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from .base import BaseModel

class UserRole(str, enum.Enum):
    FARMER = "FARMER"
    CENTRE_OPERATOR = "CENTRE_OPERATOR"
    CENTRE_MANAGER = "CENTRE_MANAGER"
    ADMIN = "ADMIN"

class User(BaseModel):
    __tablename__ = "users"

    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    role: Mapped[UserRole] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
