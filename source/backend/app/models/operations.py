import enum
import uuid
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Integer, Numeric, Date, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from .base import BaseModel

class ProcurementStatus(str, enum.Enum):
    ARRIVED = "ARRIVED"
    WEIGHING = "WEIGHING"
    QUALITY_CHECK = "QUALITY_CHECK"
    ACCEPTED = "ACCEPTED"
    PROCUREMENT_COMPLETED = "PROCUREMENT_COMPLETED"
    PAYMENT_INITIATED = "PAYMENT_INITIATED"
    PAYMENT_COMPLETED = "PAYMENT_COMPLETED"
    REJECTED = "REJECTED"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    INITIATED = "INITIATED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Procurement(BaseModel):
    __tablename__ = "procurements"

    booking_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bookings.id"), unique=True, nullable=False)
    centre_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("centres.id"), nullable=False)
    status: Mapped[ProcurementStatus] = mapped_column(String(50), nullable=False, default=ProcurementStatus.ARRIVED)
    
    gross_weight: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    tare_weight: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    net_weight: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    
    quality_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    quality_remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    procurement_completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

class Payment(BaseModel):
    __tablename__ = "payments"

    procurement_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("procurements.id"), unique=True, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(String(50), nullable=False, default=PaymentStatus.PENDING)
    payment_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    initiated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    failure_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

class CentreCapacity(BaseModel):
    __tablename__ = "centre_capacity"

    centre_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("centres.id"), nullable=False)
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    max_daily_bookings: Mapped[int] = mapped_column(Integer, nullable=False)
    processing_lanes: Mapped[int] = mapped_column(Integer, nullable=False)
    max_active_queue: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
