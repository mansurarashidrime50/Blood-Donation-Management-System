import os
import uuid
from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User
from app.repositories.user import user_repository
from app.schemas.user import UserResponse, UserUpdate, UserListResponse

router = APIRouter()

DIVISION_DISTRICTS = {
    "Dhaka": ["Dhaka", "Gazipur", "Narayanganj", "Tangail", "Faridpur"],
    "Chattogram": ["Chattogram", "Cox's Bazar", "Feni", "Cumilla", "Noakhali"],
    "Sylhet": ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
    "Rajshahi": ["Rajshahi", "Bogra", "Pabna", "Naogaon"],
    "Khulna": ["Khulna", "Jashore", "Kushtia", "Satkhira"],
    "Barishal": ["Barishal", "Bhola", "Patuakhali"],
    "Rangpur": ["Rangpur", "Dinajpur", "Gaibandha"],
    "Mymensingh": ["Mymensingh", "Netrokona", "Sherpur"]
}

@router.get("/profile", response_model=UserResponse)
async def get_profile(
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Get current logged in user's profile.
    """
    return current_user

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    profile_in: UserUpdate
) -> Any:
    """
    Update current logged in user's profile fields.
    """
    updated_user = await user_repository.update(db, db_obj=current_user, obj_in=profile_in)
    return updated_user

@router.delete("/profile", status_code=status.HTTP_200_OK)
async def delete_profile(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Delete logged in user's account.
    """
    success = await user_repository.remove(db, id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account."
        )
    return {"message": "Account deleted successfully."}

@router.post("/profile/image", response_model=UserResponse)
async def upload_profile_image(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    file: UploadFile = File(...)
) -> Any:
    """
    Upload profile picture and link it to the user.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a valid image."
        )

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image extensions (.jpg, .jpeg, .png, .webp) are allowed."
        )

    # Setup directories
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    upload_dir = os.path.join(base_dir, "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    new_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, new_filename)

    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save profile image to disk: {str(e)}"
        )

    image_url = f"/uploads/{new_filename}"
    updated_user = await user_repository.update_profile_image(db, db_obj=current_user, image_path=image_url)
    return updated_user

@router.get("/search/donors", response_model=UserListResponse)
async def search_donors(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    blood_group: Optional[str] = None,
    division: Optional[str] = None,
    district: Optional[str] = None,
    availability: Optional[bool] = None,
    skip: int = 0,
    limit: int = 10
) -> Any:
    """
    Search active donors with filtering and pagination.
    """
    donors, total = await user_repository.search_donors(
        db,
        blood_group=blood_group,
        division=division,
        district=district,
        availability=availability,
        skip=skip,
        limit=limit
    )
    return {
        "items": donors,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/divisions", response_model=Dict[str, List[str]])
async def get_divisions() -> Any:
    """
    Get Bangladesh division-districts mapping.
    """
    return DIVISION_DISTRICTS

@router.get("/public-stats")
async def get_public_stats(db: AsyncSession = Depends(deps.get_db)) -> Any:
    """
    Get public counters, blood group breakdown, and recent blood requests.
    """
    from sqlalchemy import select, func
    from app.models.blood_request import BloodRequest
    
    donor_stmt = select(func.count(User.id)).where(User.role == "DONOR", User.status == "ACTIVE")
    donor_result = await db.execute(donor_stmt)
    total_donors = donor_result.scalar() or 0

    request_stmt = select(func.count(BloodRequest.id)).where(BloodRequest.request_status.in_(["Approved", "Pending"]))
    request_result = await db.execute(request_stmt)
    active_requests = request_result.scalar() or 0

    # Group counts of active requests by blood group
    requests_by_group_stmt = (
        select(BloodRequest.blood_group_required, func.count(BloodRequest.id))
        .where(BloodRequest.request_status.in_(["Approved", "Pending"]))
        .group_by(BloodRequest.blood_group_required)
    )
    requests_by_group_result = await db.execute(requests_by_group_stmt)
    requests_by_group = {row[0]: row[1] for row in requests_by_group_result.all() if row[0]}

    # Group counts of active donors by blood group
    donors_by_group_stmt = (
        select(User.blood_group, func.count(User.id))
        .where(User.role == "DONOR", User.status == "ACTIVE")
        .group_by(User.blood_group)
    )
    donors_by_group_result = await db.execute(donors_by_group_stmt)
    donors_by_group = {row[0]: row[1] for row in donors_by_group_result.all() if row[0]}

    # Recent active requests (limit to 5)
    recent_stmt = (
        select(BloodRequest)
        .where(BloodRequest.request_status.in_(["Approved", "Pending"]))
        .order_by(BloodRequest.created_at.desc())
        .limit(5)
    )
    recent_result = await db.execute(recent_stmt)
    recent_items = recent_result.scalars().all()
    recent_requests = []
    for r in recent_items:
        recent_requests.append({
            "id": r.id,
            "patient_name": r.patient_name,
            "blood_group_required": r.blood_group_required,
            "blood_units_needed": r.blood_units_needed,
            "hospital_name": r.hospital_name,
            "division": r.division,
            "district": r.district,
            "emergency_level": r.emergency_level,
            "required_date": r.required_date.isoformat() if r.required_date else None,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })

    return {
        "total_donors": total_donors,
        "active_requests": active_requests,
        "requests_by_group": requests_by_group,
        "donors_by_group": donors_by_group,
        "recent_requests": recent_requests
    }
