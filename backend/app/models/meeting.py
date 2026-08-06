from datetime import datetime
from sqlalchemy import ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.models.base import TimeStampedModel

class Meeting(Base, TimeStampedModel):
    """
    SQLAlchemy model representing a scheduled meeting/confirmation
    between Patient and Donor at a donation location.
    """
    __tablename__ = "meetings"

    request_id: Mapped[int] = mapped_column(Integer, ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False)
    patient_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    donor_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    meeting_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    meeting_location: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False)  # Pending, Confirmed, Cancelled

    # Relationships
    request: Mapped["BloodRequest"] = relationship("BloodRequest", foreign_keys=[request_id], backref="meetings")
    patient: Mapped["User"] = relationship("User", foreign_keys=[patient_id], backref="patient_meetings")
    donor: Mapped["User"] = relationship("User", foreign_keys=[donor_id], backref="donor_meetings")

from app.models.user import User
from app.models.blood_request import BloodRequest
