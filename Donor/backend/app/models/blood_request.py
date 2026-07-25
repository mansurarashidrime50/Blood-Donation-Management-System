from datetime import date
from sqlalchemy import String, Date, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimeStampedModel

class BloodRequest(Base, TimeStampedModel):
    """
    SQLAlchemy model representing a patient's request for blood donation.
    """
    __tablename__ = "blood_requests"

    patient_id: Mapped[int] = mapped_column(Integer, ForeignKey("donors.id", ondelete="CASCADE"), nullable=False)
    patient_name: Mapped[str] = mapped_column(String(100), nullable=False)
    blood_group_required: Mapped[str] = mapped_column(String(10), nullable=False)
    blood_units_needed: Mapped[int] = mapped_column(Integer, nullable=False)
    hospital_name: Mapped[str] = mapped_column(String(255), nullable=False)
    division: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    emergency_level: Mapped[str] = mapped_column(String(50), default="Normal", nullable=False)  # Normal, Urgent, Critical
    required_date: Mapped[date] = mapped_column(Date, nullable=False)
    contact_number: Mapped[str] = mapped_column(String(20), nullable=False)
    additional_notes: Mapped[str] = mapped_column(String(500), nullable=True)
    request_status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False)  # Pending, Fulfilled, Cancelled

    # Relationship back to the donor (who acts as patient in this context)
    patient: Mapped["Donor"] = relationship("Donor", backref="blood_requests")
