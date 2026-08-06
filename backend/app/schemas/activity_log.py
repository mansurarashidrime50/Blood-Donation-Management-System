from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse

class ActivityLogBase(BaseModel):
    activity_type: str
    message: str

class ActivityLogCreate(ActivityLogBase):
    user_id: Optional[int] = None

class ActivityLogResponse(ActivityLogBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)

class ActivityLogListResponse(BaseModel):
    items: List[ActivityLogResponse]
    total: int
    skip: int
    limit: int
