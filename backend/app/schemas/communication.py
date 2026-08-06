from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class CallLogBase(BaseModel):
    caller_id: int
    receiver_id: int
    request_id: int
    call_type: str
    duration_seconds: Optional[int] = None
    status: str = "Initiated"

class CallLogCreate(CallLogBase):
    pass

class CallLogResponse(CallLogBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CommunicationLogBase(BaseModel):
    sender_id: int
    receiver_id: int
    request_id: int
    log_type: str  # CHAT, CALL, WHATSAPP
    details: str

class CommunicationLogCreate(CommunicationLogBase):
    pass

class CommunicationLogResponse(CommunicationLogBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
