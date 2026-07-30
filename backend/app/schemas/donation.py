from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.blood_request import BloodRequestResponse
from app.schemas.user import UserResponse

class DonationBase(BaseModel):
    request_id: int
    donation_date: date
    status: str = "Pending"  # Pending, Approved, Completed, Cancelled
    donation_time: Optional[datetime] = None
    donation_location: Optional[str] = None
    eta: Optional[str] = None
    donor_completed: bool = False
    patient_completed: bool = False

class DonationCreate(DonationBase):
    pass

class DonationUpdate(BaseModel):
    donation_date: Optional[date] = None
    status: Optional[str] = None
    donation_time: Optional[datetime] = None
    donation_location: Optional[str] = None
    eta: Optional[str] = None
    donor_completed: Optional[bool] = None
    patient_completed: Optional[bool] = None
    verified_by_id: Optional[int] = None
    verified_at: Optional[datetime] = None

class DonationHistoryResponse(BaseModel):
    id: int
    donation_id: int
    status: str
    changed_by_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DonationResponse(DonationBase):
    id: int
    uuid: str
    donor_id: int
    verified_by_id: Optional[int] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # We can selectively bundle the associated request or donor profile details
    request: Optional[BloodRequestResponse] = None
    donor: Optional[UserResponse] = None
    histories: List[DonationHistoryResponse] = []

    model_config = ConfigDict(from_attributes=True)

class DonationListResponse(BaseModel):
    items: List[DonationResponse]
    total: int
    skip: int
    limit: int

