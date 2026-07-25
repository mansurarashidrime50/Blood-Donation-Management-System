import os
import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.crud.donor import crud_donor
from app.models.donor import Donor
from app.schemas.donor import DonorResponse, DonorUpdate

router = APIRouter()

@router.get("", response_model=DonorResponse)
async def get_profile(
    current_user: Donor = Depends(deps.get_current_user)
) -> Any:
    """
    Get the authenticated donor's profile.
    """
    return current_user

@router.put("", response_model=DonorResponse)
async def update_profile(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: Donor = Depends(deps.get_current_user),
    profile_in: DonorUpdate
) -> Any:
    """
    Update the authenticated donor's profile fields.
    """
    updated_user = await crud_donor.update(db, db_obj=current_user, obj_in=profile_in)
    return updated_user

@router.delete("", status_code=status.HTTP_200_OK)
async def delete_profile(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: Donor = Depends(deps.get_current_user)
) -> Any:
    """
    Safely and permanently delete the donor's account.
    """
    success = await crud_donor.remove(db, id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account."
        )
    return {"message": "Account deleted successfully."}

@router.post("/image", response_model=DonorResponse)
async def upload_profile_image(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: Donor = Depends(deps.get_current_user),
    file: UploadFile = File(...)
) -> Any:
    """
    Upload and save a profile image, then update the user's profile image URL.
    """
    # Define local uploads path in the root backend directory
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    upload_dir = os.path.join(base_dir, "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    # Validate image file signature
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a valid image."
        )

    # Ensure a unique file name
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image extensions (.jpg, .jpeg, .png, .webp, .gif) are allowed."
        )

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

    # Save the relative URL format in the database
    image_url = f"/uploads/{new_filename}"
    profile_update = DonorUpdate(profile_image=image_url)
    updated_user = await crud_donor.update(db, db_obj=current_user, obj_in=profile_update)
    return updated_user
