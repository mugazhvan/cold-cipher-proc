import enum
import uuid
from datetime import time
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Numeric, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import BaseModel

class CentreStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    TEMPORARILY_CLOSED = "TEMPORARILY_CLOSED"

class Centre(BaseModel):
    __tablename__ = "centres"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    village: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 6), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 6), nullable=True)
    opening_time: Mapped[time] = mapped_column(Time, nullable=False)
    closing_time: Mapped[time] = mapped_column(Time, nullable=False)
    status: Mapped[CentreStatus] = mapped_column(String(50), nullable=False, default=CentreStatus.OPEN)

class Farmer(BaseModel):
    __tablename__ = "farmers"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    village: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    preferred_language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    user = relationship("User")

class Officer(BaseModel):
    __tablename__ = "officers"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    centre_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("centres.id"), nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    user = relationship("User")

class CropCategory(BaseModel):
    __tablename__ = "crop_categories"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    crops = relationship("Crop", back_populates="category")

class Crop(BaseModel):
    __tablename__ = "crops"

    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("crop_categories.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    unit: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. kg/quintal
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    category = relationship("CropCategory", back_populates="crops")
    crop_types = relationship("CropType", back_populates="crop")

class CropType(BaseModel):
    __tablename__ = "crop_types"

    crop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("crops.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    type_kind: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # e.g. VARIETY, GRADE, FORM, QUALITY_CLASS
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    crop = relationship("Crop", back_populates="crop_types")

class FarmerCrop(BaseModel):
    __tablename__ = "farmer_crops"

    farmer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("farmers.id"), nullable=False)
    crop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("crops.id"), nullable=False)
    crop_type_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("crop_types.id"), nullable=True)
    season: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    quantity: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    crop = relationship("Crop")
    crop_type = relationship("CropType")

    __table_args__ = (
        UniqueConstraint('farmer_id', 'crop_id', 'season', 'crop_type_id', name='uq_farmer_crop_season_type'),
    )
