import uuid
from datetime import date, datetime
from typing import Optional, Any
from sqlalchemy import String, Integer, Numeric, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .base import BaseModel

class ProcessingHistory(BaseModel):
    __tablename__ = "processing_history"

    booking_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True)
    centre_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("centres.id"), nullable=False)
    crop_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("crops.id"), nullable=True)
    
    processing_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    processing_minutes: Mapped[int] = mapped_column(Integer, nullable=False)

class WaitTimeHistory(BaseModel):
    __tablename__ = "wait_time_history"

    booking_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True)
    centre_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("centres.id"), nullable=False)
    
    queue_date: Mapped[date] = mapped_column(Date, nullable=False)
    check_in_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    processing_start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    wait_minutes: Mapped[int] = mapped_column(Integer, nullable=False)

class CentreMetric(BaseModel):
    __tablename__ = "centre_metrics"

    centre_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("centres.id"), nullable=False)
    metric_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    total_bookings: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_arrivals: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_completed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    
    average_wait_minutes: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    peak_queue_length: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    average_processing_minutes: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    no_show_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    utilization_percent: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)

class Prediction(BaseModel):
    __tablename__ = "predictions"

    centre_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("centres.id"), nullable=False)
    prediction_type: Mapped[str] = mapped_column(String(50), nullable=False)
    prediction_for: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    predicted_value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    risk_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    model_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    input_summary: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    actual_value: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)

    __table_args__ = (
        Index('idx_predictions_centre_for', 'centre_id', 'prediction_for'),
    )
