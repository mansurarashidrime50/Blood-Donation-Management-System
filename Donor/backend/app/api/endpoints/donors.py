from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.crud.donor import crud_donor
from app.schemas.donor import DonorResponse, DonorListResponse

router = APIRouter()

@router.get("", response_model=DonorListResponse)
async def list_donors(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 10
) -> Any:
    """
    Retrieve a list of donors with offset pagination.
    """
    donors, total = await crud_donor.get_multi(db, skip=skip, limit=limit)
    return {
        "donors": donors,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{id}", response_model=DonorResponse)
async def get_donor_by_id(
    id: int,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """
    Fetch a specific donor's detailed profile by their unique ID.
    """
    donor = await crud_donor.get(db, id=id)
    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor not found."
        )
    return donor
