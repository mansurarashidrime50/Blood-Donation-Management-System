from datetime import datetime, timezone, timedelta
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.blood_request import BloodRequest
from app.repositories.blood_request import blood_request_repository
from app.schemas.blood_request import BloodRequestUpdate
from app.services.matching import get_eligible_donors
from app.services.notification import notify_eligible_donors
from app.models.notification import Notification

async def check_donor_already_notified(db: AsyncSession, donor_id: int, request_id: int) -> bool:
    """
    Checks if a donor was already notified about a specific blood request.
    Uses the notification type and a query match on content/link.
    """
    # Since donor notifications link to dashboard or have request details in the text, we search:
    stmt = select(Notification).filter(
        and_(
            Notification.user_id == donor_id,
            Notification.type == "MATCHED_DONOR",
            Notification.content.like(f"%request_id:{request_id}%")
        )
    )
    # We will embed 'request_id:{id}' invisibly or explicitly at the end of the notification content!
    result = await db.execute(stmt)
    return result.scalars().first() is not None

async def run_escalation_process(db: AsyncSession):
    """
    Scans for approved, unaccepted blood requests and escalates search radius
    if they remain unaccepted for 15, 30, or 45+ minutes.
    """
    # Fetch requests that are Approved and not yet accepted
    stmt = select(BloodRequest).filter(
        BloodRequest.request_status == "Approved"
    )
    result = await db.execute(stmt)
    active_requests = result.scalars().all()
    
    now = datetime.now(timezone.utc)
    
    for req in active_requests:
        # Calculate time elapsed since approval (fall back to created_at)
        time_origin = req.approved_at or req.created_at
        
        # Ensure time_origin has timezone info to compare with UTC
        if time_origin.tzinfo is None:
            time_origin = time_origin.replace(tzinfo=timezone.utc)
            
        elapsed_minutes = (now - time_origin).total_seconds() / 60.0
        
        current_radius = req.search_radius
        new_radius = None
        
        if elapsed_minutes >= 45.0 and current_radius == "division":
            new_radius = "country"
        elif elapsed_minutes >= 30.0 and current_radius == "district":
            new_radius = "division"
        elif elapsed_minutes >= 15.0 and current_radius == "area":
            new_radius = "district"
            
        if new_radius:
            # Upgrade search radius
            update_data = BloodRequestUpdate(search_radius=new_radius)
            await blood_request_repository.update(
                db,
                db_obj=req,
                obj_in=update_data,
                notes=f"Search radius escalated automatically from {current_radius} to {new_radius} after {int(elapsed_minutes)} mins."
            )
            
            # Re-run matching in expanded radius
            eligible_donors = await get_eligible_donors(db, req)
            
            # Filter out donors who were already notified
            newly_eligible_donors = []
            for donor in eligible_donors:
                already_notified = await check_donor_already_notified(db, donor.id, req.id)
                if not already_notified:
                    newly_eligible_donors.append(donor)
            
            if newly_eligible_donors:
                # Notify newly eligible donors
                # We format the notification content to include 'request_id:{id}' for tracking
                for donor in newly_eligible_donors:
                    distance_str = f"{getattr(donor, 'computed_distance', 'N/A')} km"
                    required_time = req.required_time or "As soon as possible"
                    
                    from app.services.notification import send_in_app_notification
                    await send_in_app_notification(
                        db,
                        user_id=donor.id,
                        title="Emergency Blood Needed (Expanded Search)",
                        content=(
                            f"Emergency: {req.blood_group_required} blood required at {req.hospital_name}. "
                            f"Distance: {distance_str}. Urgency: {req.emergency_level}. Required time: {required_time}. [request_id:{req.id}]"
                        ),
                        type="MATCHED_DONOR",
                        link="/donor/dashboard"
                    )
