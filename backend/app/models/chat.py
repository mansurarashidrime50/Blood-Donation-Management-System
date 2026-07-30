from typing import List
from sqlalchemy import ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.models.base import TimeStampedModel

class Conversation(Base, TimeStampedModel):
    """
    SQLAlchemy model representing a chat room between a Patient and a Donor for a request.
    """
    __tablename__ = "conversations"

    patient_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    donor_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    request_id: Mapped[int] = mapped_column(Integer, ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    patient: Mapped["User"] = relationship("User", foreign_keys=[patient_id], backref="patient_conversations")
    donor: Mapped["User"] = relationship("User", foreign_keys=[donor_id], backref="donor_conversations")
    request: Mapped["BloodRequest"] = relationship("BloodRequest", foreign_keys=[request_id], backref="conversations")
    
    messages: Mapped[List["Message"]] = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.id")

class Message(Base, TimeStampedModel):
    """
    SQLAlchemy model representing a chat message inside a conversation.
    """
    __tablename__ = "messages"

    conversation_id: Mapped[int] = mapped_column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
    sender: Mapped["User"] = relationship("User", foreign_keys=[sender_id])

from app.models.user import User
from app.models.blood_request import BloodRequest
