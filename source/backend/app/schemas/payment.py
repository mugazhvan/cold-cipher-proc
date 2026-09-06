from typing import Optional
from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime

class PaymentBase(BaseModel):
    amount: float
    status: str
    payment_reference: Optional[str] = None
    failure_reason: Optional[str] = None

class PaymentUpdate(BaseModel):
    status: Optional[str] = None
    payment_reference: Optional[str] = None
    failure_reason: Optional[str] = None

class PaymentResponse(PaymentBase):
    id: uuid.UUID
    procurement_id: uuid.UUID
    initiated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
