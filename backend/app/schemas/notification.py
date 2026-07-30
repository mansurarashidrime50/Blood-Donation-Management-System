from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class NotificationBase(BaseModel):
    title: str
    content: str
    type: str
    is_read: bool = False
    link: Optional[str] = None

class NotificationCreate(NotificationBase):
    user_id: Optional[int] = None

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

class NotificationResponse(NotificationBase):
    id: int
    uuid: str
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total: int
    unread_count: int
