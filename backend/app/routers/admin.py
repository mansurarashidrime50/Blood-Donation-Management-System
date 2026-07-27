# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session

# from ..auth import get_current_admin
# from ..database import get_db
# from ..models import User, BloodRequest, Donation


# router = APIRouter(
#     prefix="/admin",
#     tags=["Admin"],
#     dependencies=[Depends(get_current_admin)],
# )


# @router.get("/dashboard")
# def admin_dashboard(db: Session = Depends(get_db)):
#     total_users = db.query(User).count()
#     total_donors = db.query(User).filter(User.role == "donor").count()
#     total_patients = db.query(User).filter(User.role == "patient").count()
#     total_requests = db.query(BloodRequest).count()
#     total_donations = db.query(Donation).count()

#     return {
#         "total_users": total_users,
#         "total_donors": total_donors,
#         "total_patients": total_patients,
#         "total_requests": total_requests,
#         "total_donations": total_donations,
#     }


# @router.get("/users")
# def get_users(db: Session = Depends(get_db)):
#     users = db.query(User).all()

#     return [
#         {
#             "id": user.id,
#             "full_name": user.full_name,
#             "email": user.email,
#             "role": user.role,
#             "phone": user.phone,
#             "blood_group": user.blood_group,
#         }
#         for user in users
#     ]





from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..auth import get_current_admin
from ..database import get_db
from ..models import User, BloodRequest, Donation


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_admin)],
)


class RoleUpdateSchema(BaseModel):
    role: str


class RequestStatusUpdateSchema(BaseModel):
    status: str


@router.get("/dashboard")
def admin_dashboard(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_donors = db.query(User).filter(User.role == "donor").count()
    total_patients = db.query(User).filter(User.role == "patient").count()
    total_requests = db.query(BloodRequest).count()
    pending_requests = db.query(BloodRequest).filter(BloodRequest.status == "Pending").count()
    approved_requests = db.query(BloodRequest).filter(BloodRequest.status == "Approved").count()
    assigned_requests = db.query(BloodRequest).filter(BloodRequest.status == "Assigned").count()
    total_donations = db.query(Donation).count()

    return {
        "total_users": total_users,
        "total_donors": total_donors,
        "total_patients": total_patients,
        "total_requests": total_requests,
        "pending_requests": pending_requests,
        "approved_requests": approved_requests,
        "assigned_requests": assigned_requests,
        "total_donations": total_donations,
    }


@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()

    return [
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "phone": user.phone,
            "blood_group": user.blood_group,
            "address": user.address,
        }
        for user in users
    ]


@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, payload: RoleUpdateSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = payload.role
    db.commit()
    db.refresh(user)

    return {"message": "User role updated successfully", "user": {"id": user.id, "role": user.role}}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}


@router.get("/requests")
def get_all_requests(db: Session = Depends(get_db)):
    requests = db.query(BloodRequest).all()
    return [
        {
            "id": req.id,
            "patient_id": req.patient_id,
            "patient_name": req.patient.full_name if req.patient else "Unknown",
            "blood_group": req.blood_group,
            "hospital": req.hospital,
            "quantity": req.quantity,
            "status": req.status,
            "created_at": req.created_at.strftime("%Y-%m-%d %H:%M") if req.created_at else None,
        }
        for req in requests
    ]


@router.put("/requests/{request_id}/status")
def update_request_status(request_id: int, payload: RequestStatusUpdateSchema, db: Session = Depends(get_db)):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Blood request not found")

    req.status = payload.status
    db.commit()
    db.refresh(req)

    return {"message": "Request status updated successfully", "request": {"id": req.id, "status": req.status}}