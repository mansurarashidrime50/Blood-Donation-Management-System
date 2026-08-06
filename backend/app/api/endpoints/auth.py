from typing import Any
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.core import security
from app.core.config import settings
from app.repositories.user import user_repository
from app.schemas.user import DonorRegister, PatientRegister, UserResponse
from app.schemas.token import Token, LoginRequest, RefreshTokenRequest, TokenPayload

router = APIRouter()

@router.post("/register/donor", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_donor(
    *,
    db: AsyncSession = Depends(deps.get_db),
    donor_in: DonorRegister
) -> Any:
    """
    Register a new blood donor.
    Validate email uniqueness and save record with DONOR role.
    """
    existing_user = await user_repository.get_by_email(db, email=donor_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system."
        )
    donor = await user_repository.create_donor(db, obj_in=donor_in)
    return donor

@router.post("/register/patient", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_patient(
    *,
    db: AsyncSession = Depends(deps.get_db),
    patient_in: PatientRegister
) -> Any:
    """
    Register a new patient request user.
    Validate email uniqueness and save record with PATIENT role.
    """
    existing_user = await user_repository.get_by_email(db, email=patient_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system."
        )
    patient = await user_repository.create_patient(db, obj_in=patient_in)
    return patient

@router.post("/login", response_model=Token)
async def login(
    *,
    db: AsyncSession = Depends(deps.get_db),
    login_data: LoginRequest
) -> Any:
    """
    Authenticate user and return access/refresh tokens alongside profile information and role.
    """
    user = await user_repository.get_by_email(db, email=login_data.email)
    if not user or not security.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    
    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is not active. Please contact administrator.",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    return {
        "access_token": security.create_access_token(user.id, expires_delta=access_token_expires),
        "refresh_token": security.create_refresh_token(user.id, expires_delta=refresh_token_expires),
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(
    *,
    db: AsyncSession = Depends(deps.get_db),
    refresh_data: RefreshTokenRequest
) -> Any:
    """
    Generate new access and refresh tokens from a valid refresh token.
    """
    payload = security.decode_token(refresh_data.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )
    
    try:
        token_data = TokenPayload(**payload)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload.",
        )
        
    if token_data.type != "refresh" or not token_data.sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type for refresh operation.",
        )
        
    user = await user_repository.get(db, id=int(token_data.sub))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
        
    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is not active.",
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    return {
        "access_token": security.create_access_token(user.id, expires_delta=access_token_expires),
        "refresh_token": security.create_refresh_token(user.id, expires_delta=refresh_token_expires),
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: UserResponse = Depends(deps.get_current_user)
) -> Any:
    """
    Return currently logged in user info.
    """
    return current_user
