from datetime import date
from typing import Optional
from sqlalchemy import String, Date, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
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
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # 1-to-1 Profile Relationships
    admin_profile: Mapped[Optional["AdminProfile"]] = relationship(
        "AdminProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    donor_profile: Mapped[Optional["DonorProfile"]] = relationship(
        "DonorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    patient_profile: Mapped[Optional["PatientProfile"]] = relationship(
        "PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    @property
    def next_eligible_date(self) -> Optional[date]:
        if 'donor_profile' in self.__dict__ and self.donor_profile:
            return self.donor_profile.next_eligible_date
        return None

    @property
    def total_donations(self) -> int:
        if 'donor_profile' in self.__dict__ and self.donor_profile:
            return self.donor_profile.total_donations
        return 0

    @property
    def is_verified(self) -> bool:
        if 'donor_profile' in self.__dict__ and self.donor_profile:
            return self.donor_profile.is_verified
        return False

    @property
    def smoking_status(self) -> Optional[str]:
        if 'donor_profile' in self.__dict__ and self.donor_profile:
            return self.donor_profile.smoking_status
        return None

    @property
    def alcohol_consumption(self) -> Optional[str]:
        if 'donor_profile' in self.__dict__ and self.donor_profile:
            return self.donor_profile.alcohol_consumption
        return None

from app.models.profile import AdminProfile, DonorProfile, PatientProfile


