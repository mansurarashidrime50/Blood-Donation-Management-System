from datetime import date
from sqlalchemy import String, Date, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.base import TimeStampedModel

class Donor(Base, TimeStampedModel):
    """
    SQLAlchemy model representing a registered blood donor.
    """
    __tablename__ = "donors"

    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    dob: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    blood_group: Mapped[str] = mapped_column(String(10), nullable=False)
    division: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    area: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    last_donation_date: Mapped[date] = mapped_column(Date, nullable=True)
    medical_conditions: Mapped[str] = mapped_column(String(500), nullable=True)
    profile_image: Mapped[str] = mapped_column(String(255), nullable=True)
    availability: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
