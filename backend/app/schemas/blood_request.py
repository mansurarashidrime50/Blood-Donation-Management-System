import re
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, ConfigDict

class BloodRequestBase(BaseModel):
    patient_name: str = Field(..., min_length=2, max_length=100)
    blood_group_required: str = Field(..., description="Blood Group Required (e.g., A+, O-, etc.)")
    blood_units_needed: int = Field(..., gt=0, description="Units needed must be greater than 0")
    hospital_name: str = Field(..., min_length=2, max_length=255)
    division: str = Field(..., min_length=2, max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    emergency_level: str = Field("Normal", description="Allowed: Normal, Urgent, Critical")
    required_date: date
    contact_number: str
    additional_notes: Optional[str] = Field(None, max_length=500)
    request_status: str = Field("Pending", description="Allowed: Pending, Approved, Completed, Cancelled")

    @field_validator("emergency_level")
    @classmethod
    def validate_emergency_level(cls, v: str) -> str:
        allowed = {"Normal", "Urgent", "Critical"}
        if v not in allowed:
            raise ValueError("Emergency level must be one of Normal, Urgent, or Critical.")
        return v

    @field_validator("request_status")
    @classmethod
    def validate_request_status(cls, v: str) -> str:
        allowed = {"Pending", "Approved", "Fulfilled", "Completed", "Cancelled"}
        if v not in allowed:
            raise ValueError("Request status must be one of Pending, Approved, Fulfilled, Completed, or Cancelled.")
        return v

    @field_validator("contact_number")
    @classmethod
    def validate_bangladesh_phone(cls, v: str) -> str:
        pattern = r"^(?:\+88|88)?(01[3-9]\d{8})$"
        if not re.match(pattern, v):
            raise ValueError("Contact number must be a valid Bangladesh phone number (e.g., +8801712345678 or 01712345678).")
        return v

    @field_validator("required_date")
    @classmethod
    def validate_required_date(cls, v: date) -> date:
        if v < date.today():
            raise ValueError("Required date cannot be in the past.")
        return v

class BloodRequestCreate(BloodRequestBase):
    pass

class BloodRequestUpdate(BaseModel):
    patient_name: Optional[str] = Field(None, min_length=2, max_length=100)
    blood_group_required: Optional[str] = None
    blood_units_needed: Optional[int] = Field(None, gt=0)
    hospital_name: Optional[str] = Field(None, min_length=2, max_length=255)
    division: Optional[str] = None
    district: Optional[str] = None
    emergency_level: Optional[str] = None
    required_date: Optional[date] = None
    contact_number: Optional[str] = None
    additional_notes: Optional[str] = Field(None, max_length=500)
    request_status: Optional[str] = None

    @field_validator("emergency_level")
    @classmethod
    def validate_emergency_level(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = {"Normal", "Urgent", "Critical"}
        if v not in allowed:
            raise ValueError("Emergency level must be one of Normal, Urgent, or Critical.")
        return v

    @field_validator("request_status")
    @classmethod
    def validate_request_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = {"Pending", "Approved", "Fulfilled", "Completed", "Cancelled"}
        if v not in allowed:
            raise ValueError("Request status must be one of Pending, Approved, Fulfilled, Completed, or Cancelled.")
        return v

    @field_validator("contact_number")
    @classmethod
    def validate_bangladesh_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        pattern = r"^(?:\+88|88)?(01[3-9]\d{8})$"
        if not re.match(pattern, v):
            raise ValueError("Contact number must be a valid Bangladesh phone number (e.g., +8801712345678 or 01712345678).")
        return v

    @field_validator("required_date")
    @classmethod
    def validate_required_date(cls, v: Optional[date]) -> Optional[date]:
        if v is None:
            return v
        if v < date.today():
            raise ValueError("Required date cannot be in the past.")
        return v

class BloodRequestResponse(BloodRequestBase):
    id: int
    uuid: str
    patient_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BloodRequestListResponse(BaseModel):
    items: List[BloodRequestResponse]
    total: int
    skip: int
    limit: int
