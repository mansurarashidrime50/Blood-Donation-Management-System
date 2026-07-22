from fastapi import APIRouter


router = APIRouter(
    prefix="/donor",
    tags=["Donor"],
)


@router.get("/dashboard")
def donor_dashboard():
    return {
        "message": "Donor dashboard is working"
    }