from fastapi import APIRouter


router = APIRouter(
    prefix="/patient",
    tags=["Patient"],
)


@router.get("/dashboard")
def patient_dashboard():
    return {
        "message": "Patient dashboard is working"
    }