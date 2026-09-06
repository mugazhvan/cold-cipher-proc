import enum
import uuid
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Integer, Date, DateTime, ForeignKey, Text, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from .base import BaseModel

class QueueStatus(str, enum.Enum):
    WAITING = "WAITING"
    CALLED = "CALLED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    SKIPPED = "SKIPPED"
    NO_SHOW = "NO_SHOW"

class QueueToken(BaseModel):
    __tablename__ = "queue_tokens"

    booking_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False)
    centre_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("centres.id"), nullable=False)
    token_number: Mapped[int] = mapped_column(Integer, nullable=False)
    queue_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[QueueStatus] = mapped_column(String(50), nullable=False, default=QueueStatus.WAITING)
    
    check_in_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    called_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    processing_started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint('centre_id', 'queue_date', 'token_number', name='uq_queue_tokens_centre_date_number'),
        Index('idx_queue_tokens_centre_date_status', 'centre_id', 'queue_date', 'status'),
    )

class QueueEvent(BaseModel):
    __tablename__ = "queue_events"

    token_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("queue_tokens.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    old_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    new_status: Mapped[str] = mapped_column(String(50), nullable=False)
    event_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    performed_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
