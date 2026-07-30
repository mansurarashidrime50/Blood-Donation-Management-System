from typing import Optional
from sqlalchemy import ForeignKey, Integer, String, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.models.base import TimeStampedModel

class CallLog(Base, TimeStampedModel):
    """
    SQLAlchemy model representing a call click/attempt log.
    """
    __tablename__ = "call_logs"

    caller_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    request_id: Mapped[int] = mapped_column(Integer, ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False)
    call_type: Mapped[str] = mapped_column(String(50), nullable=False)  # CALL_DONOR, CALL_PATIENT
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Initiated", nullable=False)  # Initiated, Completed, Missed

    # Relationships
    caller: Mapped["User"] = relationship("User", foreign_keys=[caller_id], backref="calls_made")
    receiver: Mapped["User"] = relationship("User", foreign_keys=[receiver_id], backref="calls_received")
    request: Mapped["BloodRequest"] = relationship("BloodRequest", foreign_keys=[request_id], backref="call_logs")

class CommunicationLog(Base, TimeStampedModel):
    """
    SQLAlchemy model representing general communication logs (Chat messages, Calls, WhatsApp redirect clicks).
    """
    __tablename__ = "communication_logs"

    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    request_id: Mapped[int] = mapped_column(Integer, ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False)
    log_type: Mapped[str] = mapped_column(String(50), nullable=False)  # CHAT, CALL, WHATSAPP
    details: Mapped[str] = mapped_column(String(500), nullable=False)

    # Relationships
    sender: Mapped["User"] = relationship("User", foreign_keys=[sender_id], backref="communications_sent")
    receiver: Mapped["User"] = relationship("User", foreign_keys=[receiver_id], backref="communications_received")
    request: Mapped["BloodRequest"] = relationship("BloodRequest", foreign_keys=[request_id], backref="communication_logs")

from app.models.user import User
from app.models.blood_request import BloodRequest
