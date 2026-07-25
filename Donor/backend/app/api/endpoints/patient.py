import logging
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.crud.blood_request import crud_blood_request
from app.models.donor import Donor
from app.schemas.blood_request import BloodRequestCreate, BloodRequestUpdate, BloodRequestResponse, BloodRequestListResponse

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("", response_model=BloodRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_blood_request(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: Donor = Depends(deps.get_current_user),
    request_in: BloodRequestCreate
) -> Any:
    """
    Create a new blood request.
    """
    logger.info(f"User {current_user.email} is creating a blood request for patient {request_in.patient_name}.")
    try:
        blood_request = await crud_blood_request.create(db, obj_in=request_in, patient_id=current_user.id)
        return blood_request
    except Exception as e:
        logger.error(f"Error creating blood request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the blood request."
        )

@router.get("", response_model=BloodRequestListResponse)
async def read_blood_requests(
    db: AsyncSession = Depends(deps.get_db),
    current_user: Donor = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 10
) -> Any:
    """
    Retrieve logged-in patient's own blood requests with pagination.
    """
    logger.info(f"Fetching blood requests for user {current_user.email}.")
    try:
        requests, total = await crud_blood_request.get_multi_by_patient(
            db, patient_id=current_user.id, skip=skip, limit=limit
        )
        return {
            "items": requests,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Error fetching blood requests: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching your blood requests."
        )

@router.get("/{id}", response_model=BloodRequestResponse)
async def read_blood_request(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: Donor = Depends(deps.get_current_user)
) -> Any:
    """
    Get a single blood request by ID.
    Only the owner can view details of their request.
    """
    logger.info(f"User {current_user.email} is fetching blood request ID {id}.")
    blood_request = await crud_blood_request.get(db, id=id)
    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found."
        )
    if blood_request.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this blood request."
        )
    return blood_request

@router.put("/{id}", response_model=BloodRequestResponse)
async def update_blood_request(
    id: int,
    request_in: BloodRequestUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: Donor = Depends(deps.get_current_user)
) -> Any:
    """
    Update a blood request by ID.
    Only the owner of the request can edit it.
    """
    logger.info(f"User {current_user.email} is updating blood request ID {id}.")
    blood_request = await crud_blood_request.get(db, id=id)
    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found."
        )
    if blood_request.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to edit this blood request."
        )
    
    try:
        updated_request = await crud_blood_request.update(db, db_obj=blood_request, obj_in=request_in)
        return updated_request
    except Exception as e:
        logger.error(f"Error updating blood request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the blood request."
        )

@router.delete("/{id}", response_model=dict)
async def delete_blood_request(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: Donor = Depends(deps.get_current_user)
) -> Any:
    """
    Delete a blood request by ID.
    Only the owner of the request can delete it.
    """
    logger.info(f"User {current_user.email} is deleting blood request ID {id}.")
    blood_request = await crud_blood_request.get(db, id=id)
    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found."
        )
    if blood_request.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this blood request."
        )
    
    success = await crud_blood_request.remove(db, id=id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete the blood request."
        )
    return {"message": "Blood request successfully deleted.", "id": id}
