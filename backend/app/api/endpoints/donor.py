from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User
from app.models.blood_request import BloodRequest
from app.models.declined_request import DeclinedRequest
from app.models.activity_log import ActivityLog
from app.repositories.blood_request import blood_request_repository
from app.repositories.donation import donation_repository
from app.repositories.meeting import meeting_repository
from app.schemas.blood_request import DonorDashboardRequestsResponse, BloodRequestResponse, BloodRequestUpdate
from app.schemas.donation import DonationCreate, DonationResponse, DonationListResponse, DonationUpdate
from app.schemas.meeting import MeetingResponse, MeetingUpdate
from app.services.matching import is_blood_compatible, calculate_haversine_distance, get_location_tier_distance
from app.services.notification import send_in_app_notification, notify_patient_donation_accepted
import datetime

router = APIRouter()

@router.get("/requests", response_model=DonorDashboardRequestsResponse)
async def get_compatible_requests(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_donor)
) -> Any:
    """
    Get compatible active blood requests matching the donor's blood group and eligibility parameters.
    Splits into Critical Blood Requests (Emergency Level = Critical) and Nearby Approved Blood Requests.
    """
    # 1. Strict Eligibility & Availability Checks
    if not current_user.availability or not current_user.is_verified:
        return {"critical_requests": [], "nearby_requests": []}
        
    if current_user.last_donation_date:
        days_since_donation = (datetime.date.today() - current_user.last_donation_date).days
        if days_since_donation < 90:
            return {"critical_requests": [], "nearby_requests": []}

    # 2. Fetch declined requests by this donor to exclude them
    declined_stmt = select(DeclinedRequest.request_id).filter(DeclinedRequest.donor_id == current_user.id)
    declined_res = await db.execute(declined_stmt)
    declined_ids = set(declined_res.scalars().all())

    # 3. Fetch all requests in Approved state
    from sqlalchemy.orm import selectinload
    stmt = select(BloodRequest).filter(
        BloodRequest.request_status == "Approved"
    ).options(selectinload(BloodRequest.histories))
    res = await db.execute(stmt)
    all_requests = res.scalars().all()
    
    critical_requests = []
    nearby_requests = []
    
    for req in all_requests:
        # Exclude already declined requests
        if req.id in declined_ids:
            continue
            
        # A. Check blood compatibility
        if not is_blood_compatible(current_user.blood_group, req.blood_group_required):
            continue
            
        # Compute distance for display / sorting
        distance = 0.0
        if req.latitude and req.longitude and current_user.latitude and current_user.longitude:
            distance = calculate_haversine_distance(req.latitude, req.longitude, current_user.latitude, current_user.longitude)
        else:
            distance = get_location_tier_distance(current_user, req)
            
        req.distance = round(distance, 2)
        req.histories = [] # Set empty list to prevent serialization errors for base response model

        # B. Split requests into Critical and Nearby Approved
        if req.emergency_level == "Critical":
            critical_requests.append(req)
        else:
            # Check search radius for nearby requests
            req_radius = (req.search_radius or "area").lower()
            req_div = req.division.strip().lower()
            req_dist = req.district.strip().lower()
            d_div = (current_user.division or "").strip().lower()
            d_dist = (current_user.district or "").strip().lower()
            
            in_radius = False
            if req_radius == "area":
                if req.latitude and req.longitude and current_user.latitude and current_user.longitude:
                    in_radius = (distance <= 15.0)
                else:
                    in_radius = (d_dist == req_dist)
            elif req_radius == "district":
                in_radius = (d_dist == req_dist)
            elif req_radius == "division":
                in_radius = (d_div == req_div)
            else:
                in_radius = True
                
            if in_radius:
                nearby_requests.append(req)
        
    # Sort Critical requests by distance, then newest first
    critical_requests.sort(key=lambda r: (getattr(r, "distance", 9999.0), -r.created_at.timestamp() if r.created_at else 0))

    # Sort Nearby Approved requests by:
    # 1. Emergency Level (Urgent -> Normal)
    # 2. Distance (proximity ascending)
    # 3. Request Time (newest first, created_at descending)
    def sort_key_nearby(r):
        dist = getattr(r, "distance", 9999.0)
        # Emergency priority (Urgent is higher priority than Normal)
        urgency_priority = 1 if r.emergency_level == "Urgent" else 2
        # Timestamp (negative value to sort newest first)
        ts = r.created_at.timestamp() if r.created_at else 0
        return (urgency_priority, dist, -ts)

    nearby_requests.sort(key=sort_key_nearby)
    
    return {
        "critical_requests": critical_requests,
        "nearby_requests": nearby_requests
    }

@router.post("/requests/{id}/decline", response_model=dict)
async def decline_blood_request(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_donor)
) -> Any:
    """
    Donor declines a blood request. It is logged in DeclinedRequest and ActivityLog
    so it won't appear on their dashboard feed anymore.
    """
    blood_request = await blood_request_repository.get(db, id=id)
    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found."
        )
        
    # Check if already declined
    existing_stmt = select(DeclinedRequest).filter(
        and_(DeclinedRequest.donor_id == current_user.id, DeclinedRequest.request_id == id)
    )
    existing_res = await db.execute(existing_stmt)
    if existing_res.scalars().first():
        return {"message": "Request already declined."}
        
    # Record decline
    declined_req = DeclinedRequest(donor_id=current_user.id, request_id=id)
    db.add(declined_req)
    
    # Log activity
    db.add(ActivityLog(
        activity_type="DECLINE_REQUEST",
        message=f"Donor {current_user.full_name} declined blood request from {blood_request.patient_name}",
        user_id=current_user.id
    ))
    
    await db.commit()
    return {"message": "Blood request declined successfully."}

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
async def accept_blood_request(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_donor),
    offer_in: DonationCreate
) -> Any:
    """
    Step 5: Donor accepts a blood request.
    Immediately updates request status to 'Accepted', stores accepted donor/time,
    marks donor status as 'Reserved' (availability = False), and creates a donation offer.
    """
    # 1. Check if blood request is active
    blood_request = await blood_request_repository.get(db, id=offer_in.request_id)
    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found."
        )
        
    if blood_request.request_status not in ["Pending", "Approved", "Matching", "Notified"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This request has already been accepted or closed."
        )
        
    # Prevent accepting own request
    if blood_request.patient_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot donate to your own blood request."
        )

    # 2. Check for duplicate acceptance
    existing = await donation_repository.check_existing_offer(
        db, donor_id=current_user.id, request_id=offer_in.request_id
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already accepted this blood request."
        )
        
    # Prevent accepting if already accepted by someone else and multi-donor not allowed
    if blood_request.accepted_donor_id and not blood_request.allow_multiple_donors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This blood request is already reserved by another donor."
        )

    # 3. Mark donor as Reserved (availability = False) (Step 5)
    if current_user.donor_profile:
        current_user.donor_profile.availability = False
        db.add(current_user.donor_profile)

    # 4. Update request status to 'Accepted'
    req_update = BloodRequestUpdate(
        request_status="Accepted",
        accepted_donor_id=current_user.id
    )
    # Update request details
    blood_request.accepted_at = datetime.datetime.now()
    await blood_request_repository.update(
        db, 
        db_obj=blood_request, 
        obj_in=req_update, 
        changed_by_id=current_user.id,
        notes="Blood request accepted by donor."
    )

    # 5. Create donation offer record
    offer_in.status = "Accepted"
    donation = await donation_repository.create(db, obj_in=offer_in, donor_id=current_user.id)
    
    # 6. Notify patient (Step 6)
    await notify_patient_donation_accepted(db, blood_request, current_user)
    
    # Log activity
    db.add(ActivityLog(
        activity_type="ACCEPT_REQUEST",
        message=f"Donor {current_user.full_name} accepted blood request from {blood_request.patient_name}",
        user_id=current_user.id
    ))
    await db.commit()
    
    return donation

@router.post("/requests/{id}/confirm-meeting", response_model=MeetingResponse)
async def confirm_meeting(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_donor)
) -> Any:
    """
    Step 8: Donor confirms meeting details proposed by the patient.
    Status becomes 'Confirmed' for meeting and request.
    """
    meeting = await meeting_repository.get_by_request(db, request_id=id)
    if not meeting or meeting.donor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No meeting proposal found for this request."
        )
        
    if meeting.status == "Confirmed":
        return meeting

    # Confirm meeting
    from app.schemas.meeting import MeetingUpdate
    updated_meeting = await meeting_repository.update(db, db_obj=meeting, obj_in=MeetingUpdate(status="Confirmed"))
    
    # Update request status to Confirmed
    blood_request = await blood_request_repository.get(db, id=id)
    if blood_request:
        await blood_request_repository.update(
            db, 
            db_obj=blood_request, 
            obj_in=BloodRequestUpdate(request_status="Confirmed"), 
            changed_by_id=current_user.id,
            notes="Meeting confirmed. Status advanced to Confirmed."
        )
        
        # Notify patient
        await send_in_app_notification(
            db,
            user_id=blood_request.patient_id,
            title="Meeting Confirmed",
            content=f"Donor {current_user.full_name} confirmed the meeting details at {meeting.meeting_location}.",
            type="CONFIRMED",
            link=f"/patient/requests/{id}/track"
        )
        
    return updated_meeting

@router.post("/requests/{id}/completed", response_model=DonationResponse)
async def complete_donation(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_donor)
) -> Any:
    """
    Step 9: Donor confirms 'Donation Completed'.
    Sets donor_completed to True. If patient also completed, status goes to 'Waiting Verification'.
    """
    blood_request = await blood_request_repository.get(db, id=id)
    if not blood_request or blood_request.accepted_donor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active accepted request found for this donor."
        )

    # Find the active donation record
    donations = await donation_repository.get_multi_by_request(db, request_id=id)
    active_donation = None
    for d in donations:
        if d.donor_id == current_user.id and d.status in ["Approved", "Accepted"]:
            active_donation = d
            break
            
    if not active_donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active donation offer record found."
        )

    # Update donor completed flag, donation time, donation location
    await donation_repository.update(
        db, 
        db_obj=active_donation, 
        obj_in=DonationUpdate(
            donor_completed=True,
            donation_time=datetime.datetime.now(),
            donation_location=blood_request.hospital_name
        ),
        changed_by_id=current_user.id,
        notes="Donation declared completed by donor."
    )
    
    # Check if patient also completed
    if active_donation.patient_completed:
        # Update request status to Waiting Verification (Step 9)
        from app.schemas.blood_request import BloodRequestUpdate
        req_update = BloodRequestUpdate(request_status="Waiting Verification")
        await blood_request_repository.update(
            db, 
            db_obj=blood_request, 
            obj_in=req_update, 
            changed_by_id=current_user.id,
            notes="Donation completed by both parties. Advanced to Waiting Verification."
        )
        # Notify Admin (Step 10)
        await send_in_app_notification(
            db,
            user_id=None,
            title="Donation Waiting for Verification",
            content=f"Patient and Donor {current_user.full_name} completed donation. Ready for admin verification.",
            type="WAITING_VERIFICATION",
            link="/admin/donations"
        )
        
    return active_donation

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
    if donation.status in ["Completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed donations cannot be cancelled."
        )

    # Free the donor
    if current_user.donor_profile:
        current_user.donor_profile.availability = True
        db.add(current_user.donor_profile)

    # Cancel request accepted fields
    blood_request = await blood_request_repository.get(db, id=donation.request_id)
    if blood_request and blood_request.accepted_donor_id == current_user.id:
        blood_request.accepted_donor_id = None
        blood_request.accepted_at = None
        await blood_request_repository.update(
            db, 
            db_obj=blood_request, 
            obj_in=BloodRequestUpdate(request_status="Approved"), 
            changed_by_id=current_user.id,
            notes="Donor cancelled acceptance. Reverting request status to Approved."
        )

    # Update status to Cancelled
    await donation_repository.update(db, db_obj=donation, obj_in=DonationUpdate(status="Cancelled"), changed_by_id=current_user.id)
    return {"message": "Donation offer cancelled successfully.", "id": id}

@router.get("/requests/{id}", response_model=BloodRequestResponse)
async def get_blood_request(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_donor)
) -> Any:
    """
    Retrieve details of a single blood request for a donor (for matching/accepted coordination).
    """
    blood_request = await blood_request_repository.get(db, id=id)
    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found."
        )
    return blood_request


