import enum
import uuid
from datetime import date, time, datetime
from typing import Optional
from sqlalchemy import String, Integer, Numeric, Date, Time, DateTime, ForeignKey, Index, CheckConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import BaseModel

class SlotStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    FULL = "FULL"

class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    ARRIVED = "ARRIVED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"

class Slot(BaseModel):
    __tablename__ = "slots"

    centre_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("centres.id"), nullable=False)
    crop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("crops.id"), nullable=False)
    slot_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    booked_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[SlotStatus] = mapped_column(String(50), nullable=False, default=SlotStatus.OPEN)

    crop = relationship("Crop")

    __table_args__ = (
        Index('idx_slots_centre_date_time', 'centre_id', 'slot_date', 'start_time'),
        CheckConstraint('booked_count <= capacity', name='check_booked_count_capacity'),
    )

class Booking(BaseModel):
    __tablename__ = "bookings"

    farmer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("farmers.id"), nullable=False)
    centre_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("centres.id"), nullable=False)
    slot_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("slots.id"), nullable=False)
    crop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("crops.id"), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[BookingStatus] = mapped_column(String(50), nullable=False, default=BookingStatus.PENDING)
    booking_reference: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    check_in_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    crop = relationship("Crop")

    __table_args__ = (
        Index('idx_bookings_farmer_status', 'farmer_id', 'status'),
        Index('idx_bookings_centre_slot', 'centre_id', 'slot_id'),
        Index('idx_unique_active_booking_per_slot', 'farmer_id', 'slot_id', unique=True, postgresql_where=text("status != 'CANCELLED'")),
    )

