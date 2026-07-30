from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse
from app.schemas.blood_request import BloodRequestResponse

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    conversation_id: int

class MessageResponse(MessageBase):
    id: int
    uuid: str
    conversation_id: int
    sender_id: int
    created_at: datetime
    updated_at: datetime
    is_read: bool = False
    sender: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)

class ConversationBase(BaseModel):
    patient_id: int
    donor_id: int
    request_id: int

class ConversationCreate(ConversationBase):
    pass

class ConversationResponse(ConversationBase):
    id: int
    uuid: str
    created_at: datetime
    updated_at: datetime
    patient: Optional[UserResponse] = None
    donor: Optional[UserResponse] = None
    request: Optional[BloodRequestResponse] = None
    messages: List[MessageResponse] = []

    model_config = ConfigDict(from_attributes=True)
