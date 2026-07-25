import re
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator, ConfigDict

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

class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        pattern = r"^\+?[0-9\s\-()]{10,20}$"
        if not re.match(pattern, v):
            raise ValueError("Phone number must contain between 10 and 20 digits.")
        return v

class DonorRegister(UserBase):
    password: str
    confirm_password: str
    dob: date
    gender: str
    blood_group: str
    division: str
    district: str
    area: str
    address: str
    weight: float = Field(..., ge=50.0, description="Weight in kg, must be >= 50")
    last_donation_date: Optional[date] = None
    medical_conditions: Optional[str] = None
    terms_accepted: bool = True
    availability: bool = True

    @field_validator("dob")
    @classmethod
    def validate_age(cls, v: date) -> date:
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError("Donor must be at least 18 years old.")
        return v

    @field_validator("password")
    @classmethod
    def validate_pwd(cls, v: str) -> str:
        return validate_password_strength(v)

    @field_validator("terms_accepted")
    @classmethod
    def validate_terms(cls, v: bool) -> bool:
        if not v:
            raise ValueError("You must accept the terms and conditions.")
        return v

    @model_validator(mode="after")
    def passwords_match(self) -> "DonorRegister":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self

class PatientRegister(UserBase):
    password: str
    confirm_password: str
    blood_group: Optional[str] = None
    division: str
    district: str
    area: str
    address: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[date] = None

    @field_validator("password")
    @classmethod
    def validate_pwd(cls, v: str) -> str:
        return validate_password_strength(v)

    @model_validator(mode="after")
    def passwords_match(self) -> "PatientRegister":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    division: Optional[str] = None
    district: Optional[str] = None
    area: Optional[str] = None
    address: Optional[str] = None
    weight: Optional[float] = Field(None, ge=50.0)
    last_donation_date: Optional[date] = None
    medical_conditions: Optional[str] = None
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

class UserResponse(BaseModel):
    id: int
    uuid: str
    full_name: str
    email: EmailStr
    phone: str
    role: str
    status: str
    
    # Profile & Health fields
    dob: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    division: Optional[str] = None
    district: Optional[str] = None
    area: Optional[str] = None
    address: Optional[str] = None
    weight: Optional[float] = None
    last_donation_date: Optional[date] = None
    medical_conditions: Optional[str] = None
    profile_image: Optional[str] = None
    availability: bool = True
    
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserPublicResponse(BaseModel):
    id: int
    uuid: str
    full_name: str
    blood_group: Optional[str] = None
    division: Optional[str] = None
    district: Optional[str] = None
    area: Optional[str] = None
    availability: bool = True
    last_donation_date: Optional[date] = None
    profile_image: Optional[str] = None
    gender: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UserStatusUpdate(BaseModel):
    status: str  # ACTIVE, BANNED, INACTIVE

class UserListResponse(BaseModel):
    items: List[UserResponse]
    total: int
    skip: int
    limit: int
