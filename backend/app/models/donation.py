from datetime import date
from sqlalchemy import String, Date, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.models.base import TimeStampedModel

class Donation(Base, TimeStampedModel):
    """
    SQLAlchemy model representing a donor's offer or historical donation
    for a specific patient's blood request.
    """
    __tablename__ = "donations"

    donor_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    request_id: Mapped[int] = mapped_column(Integer, ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False)
    donation_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False)  # Pending, Approved, Completed, Cancelled

    # Relationships
    donor: Mapped["User"] = relationship("User", foreign_keys=[donor_id], backref="donations")
    request: Mapped["BloodRequest"] = relationship("BloodRequest", foreign_keys=[request_id], backref="donations")
