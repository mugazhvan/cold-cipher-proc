from typing import Optional, Any
from pydantic import BaseModel, ConfigDict
import uuid
from datetime import date, time
from app.schemas.crop import CropResponse

class SlotBase(BaseModel):
    crop_id: uuid.UUID
    slot_date: Optional[date] = None
    date: Optional[date] = None
    start_time: time
    end_time: time
    capacity: Optional[int] = 20000
    capacity_kg: Optional[float] = None
    status: str = "OPEN"

    def get_date(self) -> date:
        return self.slot_date or self.date or date.today()

    def get_capacity(self) -> int:
        if self.capacity_kg is not None:
            return int(self.capacity_kg)
        return self.capacity if self.capacity is not None else 20000

class SlotCreate(SlotBase):
    pass

class BatchSlotCreate(BaseModel):
    crop_id: uuid.UUID
    slot_date: date
    capacity: int = 20000

class SlotUpdate(BaseModel):
    capacity: Optional[int] = None
    status: Optional[str] = None

class SlotResponse(BaseModel):
    id: uuid.UUID
    centre_id: uuid.UUID
    crop_id: uuid.UUID
    slot_date: date
    date: date
    start_time: time
    end_time: time
    capacity: int
    capacity_kg: float
    booked_count: int
    booked_kg: float
    remaining_kg: float
    status: str
    crop: Optional[CropResponse] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_slot(cls, slot: Any) -> "SlotResponse":
        s_date = slot.slot_date
        cap = int(slot.capacity)
        bkd = int(slot.booked_count)
        stat = slot.status if isinstance(slot.status, str) else getattr(slot.status, 'value', str(slot.status))
        
        crop_data = None
        if getattr(slot, 'crop', None):
            crop_data = CropResponse.model_validate(slot.crop)

        return cls(
            id=slot.id,
            centre_id=slot.centre_id,
            crop_id=slot.crop_id,
            slot_date=s_date,
            date=s_date,
            start_time=slot.start_time,
            end_time=slot.end_time,
            capacity=cap,
            capacity_kg=float(cap),
            booked_count=bkd,
            booked_kg=float(bkd),
            remaining_kg=float(max(0, cap - bkd)),
            status=stat,
            crop=crop_data
        )
