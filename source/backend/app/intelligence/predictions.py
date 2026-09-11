import uuid
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, String

from app.models.queue import QueueToken, QueueStatus
from app.models.booking import Booking, Slot
from app.schemas.intelligence import (
    WaitTimePredictionResponse,
    CongestionPredictionResponse,
    RecommendedSlot
)

# Baseline Processing time in minutes
BASELINE_PROCESSING_TIME_MINUTES = 15

async def predict_wait_time(db: AsyncSession, centre_id: uuid.UUID) -> WaitTimePredictionResponse:
    # Deterministic baseline model
    waiting_result = await db.execute(
        select(func.count()).where(QueueToken.centre_id == centre_id).where(QueueToken.status == QueueStatus.WAITING)
    )
    total_waiting = waiting_result.scalar_one()
    
    # Assume 1 processing lane for baseline
    lanes = 1
    
    predicted_wait = int((total_waiting * BASELINE_PROCESSING_TIME_MINUTES) / lanes)
    
    return WaitTimePredictionResponse(
        centre_id=centre_id,
        predicted_wait_minutes=predicted_wait,
        confidence_score=0.85, # Simulated confidence
        factors=[
            f"Current queue length: {total_waiting} farmers",
            f"Average processing time: {BASELINE_PROCESSING_TIME_MINUTES} mins",
            "[SIMULATION/PROTOTYPE] Baseline deterministic model used due to lack of historical data"
        ]
    )

async def predict_congestion(db: AsyncSession, centre_id: uuid.UUID, target_date: str) -> CongestionPredictionResponse:
    # Get total booked capacity for the day
    booking_result = await db.execute(
        select(func.sum(Booking.quantity))
        .join(Slot, Booking.slot_id == Slot.id)
        .where(Slot.centre_id == centre_id)
        .where(func.cast(Slot.slot_date, String) == str(target_date))
    )
    predicted_load = float(booking_result.scalar() or 0.0)
    
    # Dynamic capacity based on slots created for the day
    capacity_result = await db.execute(
        select(func.sum(Slot.capacity))
        .where(Slot.centre_id == centre_id)
        .where(func.cast(Slot.slot_date, String) == str(target_date))
    )
    DAILY_CAPACITY_KG = float(capacity_result.scalar() or 50000.0)
    
    utilization = predicted_load / DAILY_CAPACITY_KG if DAILY_CAPACITY_KG > 0 else 0
    
    if utilization > 0.8:
        level = "HIGH"
        explanation = "Centre is nearing maximum daily capacity. Expect delays."
    elif utilization > 0.4:
        level = "MEDIUM"
        explanation = "Moderate load expected. Processing time should be standard."
    else:
        level = "LOW"
        explanation = "Light load expected. Fast processing likely."
        
    explanation += " [SIMULATION/PROTOTYPE MODEL]"
        
    return CongestionPredictionResponse(
        centre_id=centre_id,
        date=str(target_date),
        congestion_level=level,
        predicted_load_kg=predicted_load,
        expected_queue_length=int(utilization * 50),
        explanation=explanation
    )

async def recommend_slots(
    db: AsyncSession, centre_id: uuid.UUID, crop_id: uuid.UUID, quantity_kg: float, target_date: str
) -> List[RecommendedSlot]:
    # 1. Fetch available open slots for the centre, crop, and date
    stmt = (
        select(Slot)
        .where(Slot.centre_id == centre_id)
        .where(func.cast(Slot.slot_date, String) == str(target_date))
        .where(Slot.status == "OPEN")
    )
    if crop_id:
        stmt = stmt.where(Slot.crop_id == crop_id)
        
    result = await db.execute(stmt)
    slots = result.scalars().all()
    
    recommendations = []
    
    for slot in slots:
        remaining_capacity = slot.capacity - slot.booked_count
        if quantity_kg <= remaining_capacity:
            utilization = slot.booked_count / slot.capacity if slot.capacity > 0 else 1
            score = round((1.0 - utilization) * 100, 1)  # 100 is best, 0 is worst
            
            reasons = [
                f"{remaining_capacity} capacity remaining",
            ]
            
            if utilization > 0.8:
                congestion = "HIGH"
                wait = 60
                reason = "Slot is nearly full, high wait time expected."
                reasons.append("High current utilization")
                reasons.append("Longer estimated wait time")
            elif utilization > 0.4:
                congestion = "MEDIUM"
                wait = 30
                reason = "Moderate traffic expected."
                reasons.append("Moderate current utilization")
                reasons.append("Average estimated wait time")
            else:
                congestion = "LOW"
                wait = 10
                reason = "Best time to visit, low traffic."
                reasons.append("Low current utilization")
                reasons.append("Short estimated wait time")
                
            start_str = slot.start_time.strftime("%H:%M") if hasattr(slot.start_time, "strftime") else str(slot.start_time)[:5]
            end_str = slot.end_time.strftime("%H:%M") if hasattr(slot.end_time, "strftime") else str(slot.end_time)[:5]
            
            recommendations.append(
                RecommendedSlot(
                    slot_id=slot.id,
                    date=str(slot.slot_date),
                    start_time=start_str,
                    end_time=end_str,
                    estimated_wait_minutes=wait,
                    congestion_level=congestion,
                    reason=reason,
                    capacity=slot.capacity,
                    booked_count=slot.booked_count,
                    remaining_capacity=remaining_capacity,
                    utilization=round(utilization, 2),
                    score=score,
                    reasons=reasons
                )
            )
            
    # Sort by score descending (highest score is best)
    recommendations.sort(key=lambda x: x.score, reverse=True)
    
    return recommendations
