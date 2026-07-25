from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User
from app.repositories.blood_request import blood_request_repository
from app.repositories.donation import donation_repository
from app.schemas.blood_request import BloodRequestCreate, BloodRequestUpdate, BloodRequestResponse, BloodRequestListResponse
from app.schemas.donation import DonationResponse, DonationUpdate

router = APIRouter()

@router.post("/requests", response_model=BloodRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_blood_request(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_patient),
    request_in: BloodRequestCreate
) -> Any:
    """
    Create a new blood request linked to the logged-in patient.
    """
    blood_request = await blood_request_repository.create(db, obj_in=request_in, patient_id=current_user.id)
    return blood_request

@router.get("/requests", response_model=BloodRequestListResponse)
async def read_patient_requests(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_patient),
    skip: int = 0,
    limit: int = 10
) -> Any:
    """
    Retrieve logged-in patient's own blood requests with pagination.
    """
    requests, total = await blood_request_repository.get_multi_by_patient(
        db, patient_id=current_user.id, skip=skip, limit=limit
    )
    return {
        "items": requests,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/requests/{id}", response_model=BloodRequestResponse)
async def read_blood_request(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_patient)
) -> Any:
    """
    Get details of a single blood request. Only the owner can view this.
    """
    blood_request = await blood_request_repository.get(db, id=id)
    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found."
        )
    if blood_request.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this request."
        )
    return blood_request

@router.put("/requests/{id}", response_model=BloodRequestResponse)
async def update_blood_request(
    id: int,
    request_in: BloodRequestUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_patient)
) -> Any:
    """
    Update a blood request. Only the owner can modify this.
    """
    blood_request = await blood_request_repository.get(db, id=id)
    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found."
        )
    if blood_request.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to edit this request."
        )
    
    updated_request = await blood_request_repository.update(db, db_obj=blood_request, obj_in=request_in)
    return updated_request

@router.delete("/requests/{id}", response_model=dict)
async def delete_blood_request(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_patient)
) -> Any:
    """
    Delete a blood request. Only the owner can delete this.
    """
    blood_request = await blood_request_repository.get(db, id=id)
    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found."
        )
    if blood_request.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this request."
        )
    
    success = await blood_request_repository.remove(db, id=id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete the blood request."
        )
    return {"message": "Blood request successfully deleted.", "id": id}

@router.get("/requests/{id}/donations", response_model=List[DonationResponse])
async def get_request_donation_offers(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_patient)
) -> Any:
    """
    Track donation offers made by donors for a specific blood request.
    Only the owner of the blood request can see who offered to donate.
    """
    blood_request = await blood_request_repository.get(db, id=id)
    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found."
        )
    if blood_request.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to track offers for this request."
        )
    
    offers = await donation_repository.get_multi_by_request(db, request_id=id)
    return offers

@router.put("/requests/donations/{donation_id}/status", response_model=DonationResponse)
async def update_donation_offer_status(
    donation_id: int,
    status_update: DonationUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_patient)
) -> Any:
    """
    Accept, complete, or reject a donation offer.
    Only the patient who created the request can manage the offer status.
    """
    donation = await donation_repository.get(db, id=donation_id)
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation offer not found."
        )
        
    blood_request = await blood_request_repository.get(db, id=donation.request_id)
    if not blood_request or blood_request.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this donation offer."
        )
        
    if status_update.status not in ["Approved", "Completed", "Cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status update for donation."
        )

    updated_donation = await donation_repository.update(db, db_obj=donation, obj_in=status_update)
    
    # If a donation is marked Completed, we might want to update the request status to Fulfilled automatically!
    if status_update.status == "Completed":
        from app.schemas.blood_request import BloodRequestUpdate
        await blood_request_repository.update(db, db_obj=blood_request, obj_in=BloodRequestUpdate(request_status="Completed"))
        
        # Also update the donor's last donation date!
        from app.schemas.user import UserUpdate
        from app.repositories.user import user_repository
        import datetime
        donor_profile = await user_repository.get(db, id=donation.donor_id)
        if donor_profile:
            await user_repository.update(db, db_obj=donor_profile, obj_in=UserUpdate(last_donation_date=datetime.date.today()))

    return updated_donation
