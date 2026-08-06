from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse
from app.schemas.blood_request import BloodRequestResponse

class MeetingBase(BaseModel):
    request_id: Optional[int] = None
    meeting_time: datetime
    meeting_location: str
    status: str = "Pending"

class MeetingCreate(MeetingBase):
    patient_id: int
    donor_id: int

class MeetingUpdate(BaseModel):
    meeting_time: Optional[datetime] = None
    meeting_location: Optional[str] = None
    status: Optional[str] = None # Pending, Confirmed, Cancelled

class MeetingResponse(MeetingBase):
    id: int
    uuid: str
    patient_id: int
    donor_id: int
    created_at: datetime
    updated_at: datetime
    patient: Optional[UserResponse] = None
    donor: Optional[UserResponse] = None
    request: Optional[BloodRequestResponse] = None

    model_config = ConfigDict(from_attributes=True)
