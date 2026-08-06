from datetime import date, datetime
from typing import Optional, List
from sqlalchemy import String, Date, DateTime, Integer, ForeignKey, Boolean
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
    
    # State: Pending, Approved, Completed, Cancelled
    status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False)
    
    donation_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    donation_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    eta: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Estimated arrival time
    
    donor_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    patient_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    verified_by_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    donor: Mapped["User"] = relationship("User", foreign_keys=[donor_id], backref="donations")
    request: Mapped["BloodRequest"] = relationship("BloodRequest", foreign_keys=[request_id], backref="donations")
    verified_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[verified_by_id])
    
    histories: Mapped[List["DonationHistory"]] = relationship("DonationHistory", back_populates="donation", cascade="all, delete-orphan", order_by="DonationHistory.id")

class DonationHistory(Base, TimeStampedModel):
    """
    SQLAlchemy model representing the status transition log for a Donation offer.
    """
    __tablename__ = "donation_histories"

    donation_id: Mapped[int] = mapped_column(Integer, ForeignKey("donations.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    changed_by_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    donation: Mapped["Donation"] = relationship("Donation", back_populates="histories")
    changed_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[changed_by_id])

from app.models.user import User
from app.models.blood_request import BloodRequest

