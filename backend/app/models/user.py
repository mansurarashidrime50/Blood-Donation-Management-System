from datetime import date
from sqlalchemy import String, Date, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database.session import Base
from app.models.base import TimeStampedModel

class User(Base, TimeStampedModel):
    """
    SQLAlchemy model representing a registered user (Admin, Donor, or Patient)
    in the Blood Donation Management System.
    """
    __tablename__ = "users"

    # Core fields (common for all roles)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="DONOR", nullable=False)  # ADMIN, DONOR, PATIENT
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE", nullable=False) # ACTIVE, BANNED, INACTIVE

    # Profile & Health fields (mostly for Donors / Patients)
    dob: Mapped[date] = mapped_column(Date, nullable=True)
    gender: Mapped[str] = mapped_column(String(20), nullable=True)
    blood_group: Mapped[str] = mapped_column(String(10), nullable=True)
    division: Mapped[str] = mapped_column(String(100), nullable=True)
    district: Mapped[str] = mapped_column(String(100), nullable=True)
    area: Mapped[str] = mapped_column(String(100), nullable=True)
    address: Mapped[str] = mapped_column(String(255), nullable=True)
    weight: Mapped[float] = mapped_column(Float, nullable=True)
    last_donation_date: Mapped[date] = mapped_column(Date, nullable=True)
    medical_conditions: Mapped[str] = mapped_column(String(500), nullable=True)
    profile_image: Mapped[str] = mapped_column(String(255), nullable=True)
    availability: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
