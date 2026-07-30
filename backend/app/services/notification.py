from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.notification import notification_repository
from app.schemas.notification import NotificationCreate
from app.models.user import User
from app.models.blood_request import BloodRequest

async def send_in_app_notification(
    db: AsyncSession,
    *,
    user_id: Optional[int],
    title: str,
    content: str,
    type: str,
    link: Optional[str] = None
):
    """
    Saves an in-app notification in the database.
    If user_id is None, it targets Admin users.
    """
    obj_in = NotificationCreate(
        user_id=user_id,
        title=title,
        content=content,
        type=type,
        is_read=False,
        link=link
    )
    return await notification_repository.create(db, obj_in=obj_in)

async def notify_new_request(db: AsyncSession, request: BloodRequest):
    """
    Triggers Admin alert: 'New Blood Request Received'
    """
    await send_in_app_notification(
        db,
        user_id=None,  # Admin target
        title="New Blood Request Received",
        content=f"Patient {request.patient_name} requested {request.blood_units_needed} units of {request.blood_group_required} blood at {request.hospital_name}.",
        type="REQUEST_CREATED",
        link=f"/admin/requests"
    )

async def notify_eligible_donors(db: AsyncSession, request: BloodRequest, donors: List[User]):
    """
    Automatically notify all eligible matching donors about emergency blood requests.
    """
    for donor in donors:
        distance_str = f"{getattr(donor, 'computed_distance', 'N/A')} km"
        required_time = request.required_time or "As soon as possible"
        
        if request.emergency_level == "Critical":
            title = "CRITICAL: Urgent Blood Needed"
            content = f"Urgent Critical request: {request.blood_group_required} blood required at {request.hospital_name}. Distance: {distance_str}."
            n_type = "CRITICAL_REQUEST"
        else:
            title = "Nearby Blood Request Approved"
            content = f"Approved match: {request.blood_group_required} blood required at {request.hospital_name}. Distance: {distance_str}."
            n_type = "NEARBY_REQUEST"

        await send_in_app_notification(
            db,
            user_id=donor.id,
            title=title,
            content=content,
            type=n_type,
            link="/donor/dashboard"
        )

async def notify_patient_donation_accepted(db: AsyncSession, request: BloodRequest, donor: User):
    """
    Notify patient that their blood request has been accepted.
    """
    await send_in_app_notification(
        db,
        user_id=request.patient_id,
        title="Blood Request Accepted",
        content=f"{donor.full_name} accepted your blood request for {request.blood_group_required}.",
        type="ACCEPTED",
        link=f"/patient/requests/{request.id}/track"
    )
