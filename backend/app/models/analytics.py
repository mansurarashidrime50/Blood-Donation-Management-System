from datetime import date
from typing import Optional
from sqlalchemy import String, Float, Date
from sqlalchemy.orm import Mapped, mapped_column
from app.database.session import Base
from app.models.base import TimeStampedModel

class Analytics(Base, TimeStampedModel):
    """
    SQLAlchemy model representing system analytics and caching metrics for the Admin Dashboard.
    """
    __tablename__ = "analytics"

    metric_key: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    metric_value: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    group_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # completed_donations, total_donations, monthly_donations
    recorded_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
