from typing import Optional
from pydantic import BaseModel, EmailStr
from app.schemas.donor import DonorResponse

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: DonorResponse

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    type: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str
