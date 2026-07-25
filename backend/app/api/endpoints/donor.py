from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User
from app.repositories.blood_request import blood_request_repository
from app.repositories.donation import donation_repository
from app.schemas.blood_request import BloodRequestListResponse
from app.schemas.donation import DonationCreate, DonationResponse, DonationListResponse

router = APIRouter()

@router.get("/requests", response_model=BloodRequestListResponse)
async def get_compatible_requests(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_donor),
    skip: int = 0,
    limit: int = 10
) -> Any:
    """
    Get compatible active blood requests matching the donor's blood group and/or division.
    This serves as the 'Request Notifications' feed for the donor.
    """
    # Find active blood requests matching donor's blood group and division (for localized matching)
    requests, total = await blood_request_repository.get_compatible_active_requests(
        db, 
        blood_group=current_user.blood_group, 
        division=current_user.division, 
        skip=skip, 
        limit=limit
    )
    return {
        "items": requests,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/donations", response_model=DonationListResponse)
async def get_donation_history(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_donor),
    skip: int = 0,
    limit: int = 10
) -> Any:
    """
    Retrieve history of donation offers made by the current donor.
    """
    donations, total = await donation_repository.get_multi_by_donor(
        db, donor_id=current_user.id, skip=skip, limit=limit
    )
    return {
        "items": donations,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.post("/donations", response_model=DonationResponse, status_code=status.HTTP_201_CREATED)
async def create_donation_offer(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_donor),
    offer_in: DonationCreate
) -> Any:
    """
    Submit an offer to donate blood for a specific patient's blood request.
    Checks that the blood request exists, is active, and no duplicate offer is active.
    """
    # 1. Check if the blood request exists
    blood_request = await blood_request_repository.get(db, id=offer_in.request_id)
    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found."
        )
        
    if blood_request.request_status not in ["Pending", "Approved"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This blood request is no longer active."
        )

    # Prevent offering to yourself
    if blood_request.patient_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot offer a blood donation for your own request."
        )

    # 2. Check for duplicate active offer
    existing = await donation_repository.check_existing_offer(
        db, donor_id=current_user.id, request_id=offer_in.request_id
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted a donation offer for this request."
        )

    # 3. Create donation offer
    donation = await donation_repository.create(db, obj_in=offer_in, donor_id=current_user.id)
    return donation

@router.delete("/donations/{id}", response_model=dict)
async def cancel_donation_offer(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_donor)
) -> Any:
    """
    Cancel an active donation offer.
    """
    donation = await donation_repository.get(db, id=id)
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation offer not found."
        )
    if donation.donor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to cancel this offer."
        )
    if donation.status in ["Completed", "Approved"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approved or completed donations cannot be cancelled."
        )

    # Update status to Cancelled
    from app.schemas.donation import DonationUpdate
    await donation_repository.update(db, db_obj=donation, obj_in=DonationUpdate(status="Cancelled"))
    return {"message": "Donation offer cancelled successfully.", "id": id}
