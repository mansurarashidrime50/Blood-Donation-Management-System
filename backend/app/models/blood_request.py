from datetime import date, datetime
from typing import Optional, List
from sqlalchemy import String, Date, DateTime, Integer, ForeignKey, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.models.base import TimeStampedModel

class BloodRequest(Base, TimeStampedModel):
    """
    SQLAlchemy model representing a patient's request for blood donation.
    """
    __tablename__ = "blood_requests"

    patient_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    patient_name: Mapped[str] = mapped_column(String(100), nullable=False)
    blood_group_required: Mapped[str] = mapped_column(String(10), nullable=False)
    blood_units_needed: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    hospital_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hospital_location: Mapped[str] = mapped_column(String(255), nullable=True)
    division: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    emergency_level: Mapped[str] = mapped_column(String(50), default="Normal", nullable=False)  # Normal, Urgent, Critical
    required_date: Mapped[date] = mapped_column(Date, nullable=False)
    required_time: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    contact_number: Mapped[str] = mapped_column(String(20), nullable=False)
    additional_notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # State: Pending, Approved, Matching, Notified, Accepted, Confirmed, Donation Completed, Waiting Verification, Verified, Closed
    request_status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False)
    
    # Matching / Assignment metadata
    approved_by_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    accepted_donor_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    allow_multiple_donors: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    search_radius: Mapped[str] = mapped_column(String(50), default="area", nullable=False)  # area, district, division, country
    
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    patient: Mapped["User"] = relationship("User", foreign_keys=[patient_id], backref="blood_requests")
    approved_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[approved_by_id], backref="approved_requests")
    accepted_donor: Mapped[Optional["User"]] = relationship("User", foreign_keys=[accepted_donor_id], backref="accepted_requests")
    
    histories: Mapped[List["BloodRequestHistory"]] = relationship("BloodRequestHistory", back_populates="request", cascade="all, delete-orphan", order_by="BloodRequestHistory.id")

class BloodRequestHistory(Base, TimeStampedModel):
    """
    SQLAlchemy model representing the status transition log for a Blood Request.
    """
    __tablename__ = "blood_request_histories"

    request_id: Mapped[int] = mapped_column(Integer, ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    changed_by_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    request: Mapped["BloodRequest"] = relationship("BloodRequest", back_populates="histories")
    changed_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[changed_by_id])

from app.models.user import User

