from typing import Any
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.core import security
from app.core.config import settings
from app.crud.donor import crud_donor
from app.schemas.donor import DonorCreate, DonorResponse
from app.schemas.token import Token, LoginRequest, RefreshTokenRequest, TokenPayload

router = APIRouter()

@router.post("/register", response_model=DonorResponse, status_code=status.HTTP_201_CREATED)
async def register(
    *,
    db: AsyncSession = Depends(deps.get_db),
    donor_in: DonorCreate
) -> Any:
    """
    Register a new blood donor.
    Validate email uniqueness, passwords match, and specific health checks.
    """
    existing_user = await crud_donor.get_by_email(db, email=donor_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system."
        )
    donor = await crud_donor.create(db, obj_in=donor_in)
    return donor

@router.post("/login", response_model=Token)
async def login(
    *,
    db: AsyncSession = Depends(deps.get_db),
    login_data: LoginRequest
) -> Any:
    """
    Authenticate donor and return access/refresh tokens alongside profile information.
    """
    donor = await crud_donor.get_by_email(db, email=login_data.email)
    if not donor or not security.verify_password(login_data.password, donor.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    return {
        "access_token": security.create_access_token(donor.id, expires_delta=access_token_expires),
        "refresh_token": security.create_refresh_token(donor.id, expires_delta=refresh_token_expires),
        "token_type": "bearer",
        "user": donor
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
        
    donor = await crud_donor.get(db, id=int(token_data.sub))
    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor not found.",
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    return {
        "access_token": security.create_access_token(donor.id, expires_delta=access_token_expires),
        "refresh_token": security.create_refresh_token(donor.id, expires_delta=refresh_token_expires),
        "token_type": "bearer",
        "user": donor
    }
