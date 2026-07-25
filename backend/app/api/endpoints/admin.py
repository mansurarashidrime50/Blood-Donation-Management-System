from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User
from app.models.blood_request import BloodRequest
from app.models.donation import Donation
from app.repositories.user import user_repository
from app.repositories.blood_request import blood_request_repository
from app.repositories.donation import donation_repository
from app.schemas.user import UserResponse, UserListResponse, UserStatusUpdate
from app.schemas.blood_request import BloodRequestResponse, BloodRequestListResponse, BloodRequestUpdate
from app.schemas.donation import DonationResponse, DonationListResponse, DonationUpdate

router = APIRouter()

@router.get("/dashboard", response_model=dict)
async def get_dashboard_statistics(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin)
) -> Any:
    """
    Get dashboard metrics for administrative statistics.
    """
    # 1. Total users
    res = await db.execute(select(func.count(User.id)))
    total_users = res.scalar() or 0
    
    # 2. Total donors
    res = await db.execute(select(func.count(User.id)).filter(User.role == "DONOR"))
    total_donors = res.scalar() or 0
    
    # 3. Total patients
    res = await db.execute(select(func.count(User.id)).filter(User.role == "PATIENT"))
    total_patients = res.scalar() or 0
    
    # 4. Total requests
    res = await db.execute(select(func.count(BloodRequest.id)))
    total_requests = res.scalar() or 0
    
    # 5. Pending requests
    res = await db.execute(select(func.count(BloodRequest.id)).filter(BloodRequest.request_status == "Pending"))
    pending_requests = res.scalar() or 0
    
    # 6. Approved requests
    res = await db.execute(select(func.count(BloodRequest.id)).filter(BloodRequest.request_status == "Approved"))
    approved_requests = res.scalar() or 0

    # 7. Completed requests
    res = await db.execute(select(func.count(BloodRequest.id)).filter(BloodRequest.request_status == "Completed"))
    completed_requests = res.scalar() or 0

    # 8. Completed donations
    res = await db.execute(select(func.count(Donation.id)).filter(Donation.status == "Completed"))
    completed_donations = res.scalar() or 0

    # 9. Supply/Demand matching per Blood Group
    # Group request counts
    req_group = await db.execute(select(BloodRequest.blood_group_required, func.count(BloodRequest.id)).group_by(BloodRequest.blood_group_required))
    demand = {bg: cnt for bg, cnt in req_group.all()}
    
    # Group donor counts
    donor_group = await db.execute(select(User.blood_group, func.count(User.id)).filter(User.role == "DONOR", User.status == "ACTIVE").group_by(User.blood_group))
    supply = {bg: cnt for bg, cnt in donor_group.all() if bg is not None}

    return {
        "total_users": total_users,
        "total_donors": total_donors,
        "total_patients": total_patients,
        "total_requests": total_requests,
        "pending_requests": pending_requests,
        "approved_requests": approved_requests,
        "completed_requests": completed_requests,
        "completed_donations": completed_donations,
        "demand_by_blood_group": demand,
        "supply_by_blood_group": supply
    }

@router.get("/users", response_model=UserListResponse)
async def read_users(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 10
) -> Any:
    """
    Get all registered users with pagination and filter criteria (role, status, search string).
    """
    users, total = await user_repository.get_multi_users(
        db, role=role, status=status, search=search, skip=skip, limit=limit
    )
    return {
        "items": users,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.put("/users/{id}/status", response_model=UserResponse)
async def update_user_status(
    id: int,
    status_update: UserStatusUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin)
) -> Any:
    """
    Ban, deactivate, or activate a user account.
    """
    user = await user_repository.get(db, id=id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own admin status."
        )
        
    updated_user = await user_repository.update_status(db, db_obj=user, status=status_update.status)
    return updated_user

@router.get("/blood-requests", response_model=BloodRequestListResponse)
async def read_blood_requests(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
    skip: int = 0,
    limit: int = 10
) -> Any:
    """
    Get all patient blood requests.
    """
    requests, total = await blood_request_repository.get_multi(db, skip=skip, limit=limit)
    return {
        "items": requests,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.put("/blood-requests/{id}/status", response_model=BloodRequestResponse)
async def update_blood_request_status(
    id: int,
    request_update: BloodRequestUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin)
) -> Any:
    """
    Modify request details or status (e.g. Approved, Cancelled, Completed).
    """
    blood_request = await blood_request_repository.get(db, id=id)
    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found."
        )
    updated_request = await blood_request_repository.update(db, db_obj=blood_request, obj_in=request_update)
    return updated_request

@router.get("/donations", response_model=DonationListResponse)
async def read_donations(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
    skip: int = 0,
    limit: int = 10
) -> Any:
    """
    Get all donation records in the system.
    """
    donations, total = await donation_repository.get_multi(db, skip=skip, limit=limit)
    return {
        "items": donations,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.put("/donations/{id}/status", response_model=DonationResponse)
async def update_donation_status(
    id: int,
    donation_update: DonationUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin)
) -> Any:
    """
    Admin override status of a donation offer (e.g. Approve/Complete).
    """
    donation = await donation_repository.get(db, id=id)
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation record not found."
        )
    updated_donation = await donation_repository.update(db, db_obj=donation, obj_in=donation_update)
    return updated_donation
