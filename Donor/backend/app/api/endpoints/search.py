from typing import Optional, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.crud.donor import crud_donor
from app.schemas.donor import DonorListResponse

router = APIRouter()

@router.get("", response_model=DonorListResponse)
async def search_donors(
    *,
    db: AsyncSession = Depends(deps.get_db),
    blood_group: Optional[str] = None,
    division: Optional[str] = None,
    district: Optional[str] = None,
    availability: Optional[bool] = None,
    skip: int = 0,
    limit: int = 10
) -> Any:
    """
    Search donors matching multiple query criteria: blood group, division, district, and availability.
    """
    donors, total = await crud_donor.search(
        db,
        blood_group=blood_group,
        division=division,
        district=district,
        availability=availability,
        skip=skip,
        limit=limit
    )
    return {
        "donors": donors,
        "total": total,
        "skip": skip,
        "limit": limit
    }
