from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_admin
from ..database import get_db
from ..models import User, BloodRequest, Donation


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("/dashboard")
def admin_dashboard(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_donors = db.query(User).filter(User.role == "donor").count()
    total_patients = db.query(User).filter(User.role == "patient").count()
    total_requests = db.query(BloodRequest).count()
    total_donations = db.query(Donation).count()

    return {
        "total_users": total_users,
        "total_donors": total_donors,
        "total_patients": total_patients,
        "total_requests": total_requests,
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
        }
        for user in users
    ]