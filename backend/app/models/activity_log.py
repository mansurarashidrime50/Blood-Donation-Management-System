from typing import Optional
from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.models.base import TimeStampedModel

class ActivityLog(Base, TimeStampedModel):
    """
    SQLAlchemy model representing system activities for Admin monitoring.
    """
    __tablename__ = "activity_logs"

    activity_type: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. "ACCEPT_REQUEST", "DECLINE_REQUEST", "CALL_PATIENT", "CALL_DONOR", "MESSAGE_SENT", "MEETING_CONFIRMED", "DONATION_COMPLETED"
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[user_id])

from app.models.user import User
