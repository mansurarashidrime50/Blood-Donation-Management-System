import re
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

def validate_password_strength(password: str) -> str:
    """
    Validates that a password is strong (8+ chars, uppercase, lowercase, number, special character).
    """
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not re.search(r"[0-9]", password):
        raise ValueError("Password must contain at least one digit.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise ValueError("Password must contain at least one special character.")
    return password

class DonorBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str
    dob: date
    gender: str = Field(..., description="Gender (e.g., Male, Female, Other)")
    blood_group: str = Field(..., description="Blood Group (e.g., A+, O-, etc.)")
    division: str
    district: str
    area: str
    address: str = Field(..., max_length=255)
    weight: float = Field(..., ge=50.0, description="Weight in kg, must be >= 50")
    last_donation_date: Optional[date] = None
    medical_conditions: Optional[str] = Field(None, max_length=500)
    profile_image: Optional[str] = None
    availability: bool = True

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        # Regex allowing digits, spaces, hyphens, and parenthesis, between 10 and 20 chars
        pattern = r"^\+?[0-9\s\-()]{10,20}$"
        if not re.match(pattern, v):
            raise ValueError("Phone number must contain between 10 and 20 digits.")
        return v

    @field_validator("dob")
    @classmethod
    def validate_age(cls, v: date) -> date:
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError("Donor must be at least 18 years old.")
        return v

class DonorCreate(DonorBase):
    password: str
    confirm_password: str
    terms_accepted: bool = Field(..., description="Must agree to terms and conditions")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_password_strength(v)

    @field_validator("terms_accepted")
    @classmethod
    def validate_terms(cls, v: bool) -> bool:
        if not v:
            raise ValueError("You must accept the terms and conditions.")
        return v

    @model_validator(mode="after")
    def passwords_match(self) -> "DonorCreate":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self

class DonorUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    address: Optional[str] = Field(None, max_length=255)
    weight: Optional[float] = Field(None, ge=50.0)
    last_donation_date: Optional[date] = None
    medical_conditions: Optional[str] = Field(None, max_length=500)
    profile_image: Optional[str] = None
    availability: Optional[bool] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        pattern = r"^\+?[0-9\s\-()]{10,20}$"
        if not re.match(pattern, v):
            raise ValueError("Phone number must contain between 10 and 20 digits.")
        return v

from pydantic import ConfigDict

class DonorResponse(DonorBase):
    id: int
    uuid: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DonorPublicResponse(BaseModel):
    id: int
    uuid: str
    full_name: str
    blood_group: str
    division: str
    district: str
    area: str
    availability: bool
    last_donation_date: Optional[date] = None
    profile_image: Optional[str] = None
    gender: str

    model_config = ConfigDict(from_attributes=True)

class DonorListResponse(BaseModel):
    donors: list[DonorResponse]
    total: int
    skip: int
    limit: int

