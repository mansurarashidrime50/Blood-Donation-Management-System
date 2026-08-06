from datetime import date
from typing import Optional
from sqlalchemy import ForeignKey, Integer, Date, Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.models.base import TimeStampedModel

class AdminProfile(Base, TimeStampedModel):
    """
    SQLAlchemy model representing an Administrator profile.
    """
    __tablename__ = "admin_profiles"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="admin_profile")

class DonorProfile(Base, TimeStampedModel):
    """
    SQLAlchemy model representing a Blood Donor profile.
    """
    __tablename__ = "donor_profiles"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    last_donation_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    next_eligible_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    total_donations: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    availability: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    smoking_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    alcohol_consumption: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="donor_profile")

class PatientProfile(Base, TimeStampedModel):
    """
    SQLAlchemy model representing a Patient profile.
    """
    __tablename__ = "patient_profiles"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="patient_profile")

# Import User at runtime to avoid circular imports
from app.models.user import User
