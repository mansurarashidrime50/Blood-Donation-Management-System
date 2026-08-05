from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User
from app.repositories.blood_request import blood_request_repository
from app.repositories.donation import donation_repository
from app.repositories.meeting import meeting_repository
from app.schemas.blood_request import BloodRequestCreate, BloodRequestUpdate, BloodRequestResponse, BloodRequestListResponse
from app.schemas.donation import DonationResponse, DonationUpdate
from app.schemas.meeting import MeetingCreate, MeetingResponse, MeetingBase
from app.services.notification import notify_new_request, send_in_app_notification
import datetime

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
    Immediately creates a Pending request, logs history, and alerts admins.
    If the request is Critical, it is auto-approved and matching donors are notified.
    """
    if request_in.latitude is None:
        request_in.latitude = current_user.latitude
    if request_in.longitude is None:
        request_in.longitude = current_user.longitude

    is_critical = request_in.emergency_level == "Critical"
    if is_critical:
        request_in.request_status = "Approved"

    blood_request = await blood_request_repository.create(db, obj_in=request_in, patient_id=current_user.id)
    
    # Notify Admin (Step 1)
    await notify_new_request(db, blood_request)
    
    if is_critical:
        # Import matching and notification services
        from app.services.matching import get_eligible_donors
        from app.services.notification import notify_eligible_donors
        from app.models.blood_request import BloodRequestHistory
        
        # Get matching/eligible donors
        eligible_donors = await get_eligible_donors(db, blood_request)
        # Notify matching donors
        await notify_eligible_donors(db, blood_request, eligible_donors)
        
        # Log matching history log
        db.add(BloodRequestHistory(
            request_id=blood_request.id,
            status="Matching",
            changed_by_id=current_user.id,
            notes=f"Critical Request Auto-approved. Auto-matching triggered. {len(eligible_donors)} eligible donors notified."
        ))
        await db.commit()
        await db.refresh(blood_request)
        
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
    If the request becomes Critical, it is auto-approved and matching donors are notified.
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
    
    is_now_critical = (request_in.emergency_level == "Critical") or (request_in.emergency_level is None and blood_request.emergency_level == "Critical")
    is_pending = blood_request.request_status == "Pending"
    
    is_auto_approving = is_now_critical and is_pending
    if is_auto_approving:
        request_in.request_status = "Approved"
        
    updated_request = await blood_request_repository.update(db, db_obj=blood_request, obj_in=request_in, changed_by_id=current_user.id)
    
    if is_auto_approving:
        from app.services.matching import get_eligible_donors
        from app.services.notification import notify_eligible_donors
        from app.models.blood_request import BloodRequestHistory
        
        # Get matching/eligible donors
        eligible_donors = await get_eligible_donors(db, updated_request)
        # Notify matching donors
        await notify_eligible_donors(db, updated_request, eligible_donors)
        
        # Log matching history log
        db.add(BloodRequestHistory(
            request_id=updated_request.id,
            status="Matching",
            changed_by_id=current_user.id,
            notes=f"Critical Request Auto-approved on update. Auto-matching triggered. {len(eligible_donors)} eligible donors notified."
        ))
        await db.commit()
        await db.refresh(updated_request)
        
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

@router.post("/requests/{id}/propose-meeting", response_model=MeetingResponse)
async def propose_meeting(
    id: int,
    meeting_base: MeetingBase,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_patient)
) -> Any:
    """
    Step 8: Patient proposes meeting time and location.
    Creates a meeting record and alerts the accepted donor.
    """
    blood_request = await blood_request_repository.get(db, id=id)
    if not blood_request or blood_request.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to propose a meeting for this request."
        )
    
    if not blood_request.accepted_donor_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No donor has accepted this request yet."
        )
        
    # Check if a meeting already exists
    existing_meeting = await meeting_repository.get_by_request(db, request_id=id)
    if existing_meeting:
        # Update existing
        from app.schemas.meeting import MeetingUpdate
        updated = await meeting_repository.update(
            db, 
            db_obj=existing_meeting, 
            obj_in=MeetingUpdate(
                meeting_time=meeting_base.meeting_time,
                meeting_location=meeting_base.meeting_location,
                status="Pending"
            )
        )
        await send_in_app_notification(
            db,
            user_id=blood_request.accepted_donor_id,
            title="Meeting Proposal Updated",
            content=f"Patient proposed new meeting details: {meeting_base.meeting_location} at {meeting_base.meeting_time}.",
            type="MEETING_PROPOSED",
            link="/donor/dashboard"
        )
        return updated
        
    meeting_create = MeetingCreate(
        request_id=id,
        patient_id=current_user.id,
        donor_id=blood_request.accepted_donor_id,
        meeting_time=meeting_base.meeting_time,
        meeting_location=meeting_base.meeting_location,
        status="Pending"
    )
    meeting = await meeting_repository.create(db, obj_in=meeting_create)
    
    # Notify donor
    await send_in_app_notification(
        db,
        user_id=blood_request.accepted_donor_id,
        title="New Meeting Proposal",
        content=f"Patient proposed a donation meeting at {meeting.meeting_location} on {meeting.meeting_time.strftime('%Y-%m-%d %H:%M')}.",
        type="MEETING_PROPOSED",
        link="/donor/dashboard"
    )
    return meeting

@router.post("/requests/{id}/received", response_model=BloodRequestResponse)
async def confirm_blood_received(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_patient)
) -> Any:
    """
    Step 9: Patient clicks 'Blood Received'.
    Sets patient_completed to True. If donor also completed, status goes to 'Waiting Verification'.
    """
    blood_request = await blood_request_repository.get(db, id=id)
    if not blood_request or blood_request.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to confirm receipt for this request."
        )
        
    if not blood_request.accepted_donor_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No accepted donor for this request."
        )

    # Find the active accepted donation record
    donations = await donation_repository.get_multi_by_request(db, request_id=id)
    active_donation = None
    for d in donations:
        if d.donor_id == blood_request.accepted_donor_id and d.status in ["Approved", "Accepted"]:
            active_donation = d
            break
            
    if not active_donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No matching active donation offer found."
        )

    # Update patient completed flag
    await donation_repository.update(db, db_obj=active_donation, obj_in=DonationUpdate(patient_completed=True))
    
    # Check if both have completed
    if active_donation.donor_completed:
        # Update request status to Waiting Verification (Step 9)
        from app.schemas.blood_request import BloodRequestUpdate
        req_update = BloodRequestUpdate(request_status="Waiting Verification")
        updated_req = await blood_request_repository.update(
            db, 
            db_obj=blood_request, 
            obj_in=req_update, 
            changed_by_id=current_user.id,
            notes="Donation completed by both parties. Waiting admin verification."
        )
        # Notify Admin (Step 10)
        await send_in_app_notification(
            db,
            user_id=None,
            title="Donation Waiting for Verification",
            content=f"Patient {current_user.full_name} and Donor accepted the donation. Ready for admin verification.",
            type="WAITING_VERIFICATION",
            link="/admin/donations"
        )
        return updated_req
    else:
        # Just update request status to Donation Completed or leave it as Confirmed, let's keep it Confirmed but logged
        return blood_request

@router.get("/requests/{id}/meetings", response_model=Optional[MeetingResponse])
async def read_request_meeting(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Get meeting scheduled for this request.
    """
    from app.models.donation import Donation
    from sqlalchemy import select
    
    blood_request = await blood_request_repository.get(db, id=id)
    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found."
        )
        
    is_authorized = False
    if current_user.role == "ADMIN":
        is_authorized = True
    elif blood_request.patient_id == current_user.id:
        is_authorized = True
    elif blood_request.accepted_donor_id == current_user.id:
        is_authorized = True
    else:
        # Check if current_user has a donation record for this request
        stmt = select(Donation).filter(Donation.request_id == id, Donation.donor_id == current_user.id)
        res = await db.execute(stmt)
        if res.scalars().first() is not None:
            is_authorized = True
            
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You are not authorized to view this meeting."
        )
        
    meeting = await meeting_repository.get_by_request(db, request_id=id)
    return meeting

