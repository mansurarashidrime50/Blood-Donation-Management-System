from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.blood_request import BloodRequestResponse
from app.schemas.user import UserResponse

class DonationBase(BaseModel):
    request_id: int
    donation_date: date
    status: str = "Pending"  # Pending, Approved, Completed, Cancelled

class DonationCreate(DonationBase):
    pass

class DonationUpdate(BaseModel):
    donation_date: Optional[date] = None
    status: Optional[str] = None  # Pending, Approved, Completed, Cancelled

class DonationResponse(DonationBase):
    id: int
    uuid: str
    donor_id: int
    created_at: datetime
    updated_at: datetime
    
    # We can selectively bundle the associated request or donor profile details
    request: Optional[BloodRequestResponse] = None
    donor: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)

class DonationListResponse(BaseModel):
    items: List[DonationResponse]
    total: int
    skip: int
    limit: int
