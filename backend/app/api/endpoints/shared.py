import os
import uuid
from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.websocket import manager
from app.core.security import decode_token
from app.schemas.token import TokenPayload
from app.api import deps
from app.models.user import User
from app.repositories.user import user_repository
from app.repositories.notification import notification_repository
from app.repositories.chat import chat_repository
from app.schemas.user import UserResponse, UserUpdate, UserListResponse
from app.schemas.notification import NotificationResponse, NotificationListResponse
from app.schemas.chat import ConversationResponse, MessageResponse, MessageCreate
from app.services.matching import calculate_haversine_distance
from sqlalchemy import select

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
    
    # Calculate estimated distance for each donor
    for donor in donors:
        distance = 0.0
        if current_user.latitude and current_user.longitude and donor.latitude and donor.longitude:
            distance = calculate_haversine_distance(
                current_user.latitude, current_user.longitude,
                donor.latitude, donor.longitude
            )
        else:
            u1_dist = (current_user.district or "").strip().lower()
            u2_dist = (donor.district or "").strip().lower()
            u1_div = (current_user.division or "").strip().lower()
            u2_div = (donor.division or "").strip().lower()
            if u1_dist == u2_dist:
                distance = 10.0
            elif u1_div == u2_div:
                distance = 50.0
            else:
                distance = 200.0
        donor.estimated_distance = round(distance, 2)

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

# --- Notification Endpoints ---

@router.get("/notifications", response_model=NotificationListResponse)
async def get_notifications(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 20
) -> Any:
    """
    Get user notifications. Admins receive global system notifications.
    """
    target_id = current_user.id if current_user.role != "ADMIN" else None
    items, total = await notification_repository.get_multi_by_user(db, user_id=target_id, skip=skip, limit=limit)
    unread_count = await notification_repository.get_unread_count(db, user_id=target_id)
    return {
        "items": items,
        "total": total,
        "unread_count": unread_count
    }

@router.put("/notifications/{id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Mark a specific notification as read.
    """
    target_id = current_user.id if current_user.role != "ADMIN" else None
    notification = await notification_repository.mark_as_read(db, id=id, user_id=target_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found."
        )
    return notification

@router.put("/notifications/read-all", response_model=dict)
async def mark_all_notifications_read(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Mark all unread notifications as read.
    """
    target_id = current_user.id if current_user.role != "ADMIN" else None
    count = await notification_repository.mark_all_as_read(db, user_id=target_id)
    return {"message": f"{count} notifications marked as read."}

# --- Chat Endpoints ---

@router.get("/chat/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    List all chat conversations for the current logged-in donor or patient.
    """
    return await chat_repository.get_user_conversations(db, user_id=current_user.id)

@router.get("/chat/conversations/{id}", response_model=ConversationResponse)
async def get_conversation_details(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Get conversation details including message log.
    """
    convo = await chat_repository.get_conversation(db, conversation_id=id)
    if not convo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found."
        )
    if convo.patient_id != current_user.id and convo.donor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this conversation."
        )
    return convo

@router.post("/chat/start", response_model=ConversationResponse)
async def start_chat(
    req_id: int,
    opponent_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Start or retrieve a conversation between patient and donor for a request.
    Strictly restricted to accepted donor matches.
    """
    from app.models.blood_request import BloodRequest
    
    stmt = select(BloodRequest).filter(BloodRequest.id == req_id)
    res = await db.execute(stmt)
    blood_request = res.scalars().first()
    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found."
        )

    if current_user.role == "DONOR":
        donor_id = current_user.id
        patient_id = opponent_id
    else:
        patient_id = current_user.id
        donor_id = opponent_id

    # Communication Lock: Donor must be accepted
    if blood_request.accepted_donor_id != donor_id or blood_request.request_status not in ["Accepted", "Confirmed", "Donation Completed", "Waiting Verification", "Verified"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Communication is disabled. You can only chat after a request has been accepted by the donor."
        )

    if blood_request.patient_id != patient_id and blood_request.accepted_donor_id != donor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied."
        )

    return await chat_repository.get_or_create_conversation(db, patient_id=blood_request.patient_id, donor_id=donor_id, request_id=req_id)

@router.post("/chat/messages", response_model=MessageResponse)
async def send_message(
    msg_in: MessageCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Send a chat message in a conversation.
    """
    convo = await chat_repository.get_conversation(db, conversation_id=msg_in.conversation_id)
    if not convo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found."
        )
    if convo.patient_id != current_user.id and convo.donor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a participant in this conversation."
        )

    # Communication Lock
    blood_request = convo.request
    if not blood_request or blood_request.accepted_donor_id != convo.donor_id or blood_request.request_status not in ["Accepted", "Confirmed", "Donation Completed", "Waiting Verification", "Verified"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Communication is disabled. The blood request must be in accepted status."
        )
        
    msg = await chat_repository.create_message(
        db,
        conversation_id=msg_in.conversation_id,
        sender_id=current_user.id,
        content=msg_in.content
    )

    # Log communication & activity
    receiver_id = convo.donor_id if current_user.id == convo.patient_id else convo.patient_id
    from app.schemas.communication import CommunicationLogCreate, CallLogCreate
    from app.repositories.communication import communication_repository
    
    comm_in = CommunicationLogCreate(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        request_id=convo.request_id,
        log_type="CHAT",
        details=f"Message: {msg_in.content[:50]}..."
    )
    await communication_repository.create_communication_log(db, obj_in=comm_in)

    activity_type = "PATIENT_SENT_MESSAGE" if current_user.role == "PATIENT" else "DONOR_SENT_MESSAGE"
    from app.models.activity_log import ActivityLog
    db.add(ActivityLog(
        activity_type=activity_type,
        message=f"{current_user.role.title()} {current_user.full_name} sent a message in chat",
        user_id=current_user.id
    ))

    # Notify recipient
    from app.services.notification import send_in_app_notification
    await send_in_app_notification(
        db,
        user_id=receiver_id,
        title="New Chat Message",
        content=f"{current_user.full_name} sent a message: {msg_in.content[:60]}...",
        type="MESSAGE_RECEIVED",
        link=f"/patient/requests/{convo.request_id}/track" if receiver_id == convo.patient_id else "/donor/dashboard"
    )

    # Notify admin
    await send_in_app_notification(
        db,
        user_id=None,
        title="Communication Activity",
        content=f"{current_user.role.title()} {current_user.full_name} sent chat message for request #{convo.request_id}.",
        type="COMMUNICATION_ACTIVITY",
        link="/admin/requests"
    )

    await db.commit()
    await db.refresh(msg)

    message_dict = {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender_id": msg.sender_id,
        "content": msg.content,
        "is_read": msg.is_read,
        "created_at": msg.created_at.isoformat() if msg.created_at else None
    }
    await manager.broadcast_to_conversation(message_dict, msg_in.conversation_id)

    return msg

@router.websocket("/chat/ws/{conversation_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    conversation_id: int,
    token: str,
    db: AsyncSession = Depends(deps.get_db)
):
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    try:
        token_data = TokenPayload(**payload)
        user_id = int(token_data.sub) if token_data.sub else None
        if not user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    convo = await chat_repository.get_conversation(db, conversation_id=conversation_id)
    if not convo:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if convo.patient_id != user_id and convo.donor_id != user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, conversation_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Client sends messages via POST /chat/messages, this is just to keep connection open
    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id)

# --- Call & Communication Logging Endpoints ---

from app.schemas.communication import CallLogCreate, CallLogResponse, CommunicationLogCreate, CommunicationLogResponse
from app.repositories.communication import communication_repository

@router.post("/communication/calls", response_model=CallLogResponse)
async def log_call(
    call_in: CallLogCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Log a phone call click between donor and patient. Only allowed if an active accepted request exists.
    """
    from app.models.blood_request import BloodRequest
    stmt = select(BloodRequest).filter(BloodRequest.id == call_in.request_id)
    res = await db.execute(stmt)
    blood_request = res.scalars().first()
    if not blood_request:
        raise HTTPException(status_code=404, detail="Blood request not found.")

    # Strictly enforce acceptance lock
    if blood_request.accepted_donor_id is None or blood_request.request_status not in ["Accepted", "Confirmed", "Donation Completed", "Waiting Verification", "Verified"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Calls can only be initiated after a donor has accepted the blood request."
        )

    allowed_ids = {blood_request.patient_id, blood_request.accepted_donor_id}
    if call_in.caller_id not in allowed_ids or call_in.receiver_id not in allowed_ids:
        raise HTTPException(status_code=403, detail="Unauthorized call participants.")

    if current_user.id != call_in.caller_id:
        raise HTTPException(status_code=403, detail="Caller ID must match current authenticated user.")

    # Write call log
    call = await communication_repository.create_call_log(db, obj_in=call_in)

    # Log in activity logs for Admin
    caller_role = "Patient" if current_user.role == "PATIENT" else "Donor"
    db.add(ActivityLog(
        activity_type="CALL_INITIATED",
        message=f"{caller_role} {current_user.full_name} initiated phone call to match",
        user_id=current_user.id
    ))
    
    # Notify admin
    from app.services.notification import send_in_app_notification
    await send_in_app_notification(
        db,
        user_id=None,
        title="Communication Activity",
        content=f"{caller_role} {current_user.full_name} initiated a phone call for request #{blood_request.id}.",
        type="COMMUNICATION_ACTIVITY",
        link="/admin/requests"
    )

    # Record general communication log
    comm_in = CommunicationLogCreate(
        sender_id=call_in.caller_id,
        receiver_id=call_in.receiver_id,
        request_id=call_in.request_id,
        log_type="CALL",
        details=f"Phone call initiated by {current_user.full_name}."
    )
    await communication_repository.create_communication_log(db, obj_in=comm_in)

    await db.commit()
    return call

@router.post("/communication/logs", response_model=CommunicationLogResponse)
async def log_communication(
    comm_in: CommunicationLogCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Create a custom communication log (e.g. WhatsApp clicks).
    """
    from app.models.blood_request import BloodRequest
    stmt = select(BloodRequest).filter(BloodRequest.id == comm_in.request_id)
    res = await db.execute(stmt)
    blood_request = res.scalars().first()
    if not blood_request:
        raise HTTPException(status_code=404, detail="Blood request not found.")

    if blood_request.accepted_donor_id is None or blood_request.request_status not in ["Accepted", "Confirmed", "Donation Completed", "Waiting Verification", "Verified"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Communication logs can only be created after the blood request has been accepted."
        )

    if current_user.id != comm_in.sender_id:
        raise HTTPException(status_code=403, detail="Sender ID must match current authenticated user.")

    log = await communication_repository.create_communication_log(db, obj_in=comm_in)
    
    # Log in activity log
    db.add(ActivityLog(
        activity_type="COMMUNICATION_LOGGED",
        message=f"User {current_user.full_name} logged {comm_in.log_type} redirection",
        user_id=current_user.id
    ))
    
    # Notify admin
    from app.services.notification import send_in_app_notification
    await send_in_app_notification(
        db,
        user_id=None,
        title="Communication Activity",
        content=f"User {current_user.full_name} logged {comm_in.log_type} activity for request #{blood_request.id}.",
        type="COMMUNICATION_ACTIVITY",
        link="/admin/requests"
    )

    await db.commit()
    return log

@router.get("/communication/logs", response_model=List[CommunicationLogResponse])
async def list_communication_logs(
    request_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Get communication logs.
    """
    from app.models.blood_request import BloodRequest
    stmt = select(BloodRequest).filter(BloodRequest.id == request_id)
    res = await db.execute(stmt)
    blood_request = res.scalars().first()
    if not blood_request:
        raise HTTPException(status_code=404, detail="Blood request not found.")

    if blood_request.patient_id != current_user.id and blood_request.accepted_donor_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Access denied.")

    return await communication_repository.get_communications_by_request(db, request_id=request_id)

