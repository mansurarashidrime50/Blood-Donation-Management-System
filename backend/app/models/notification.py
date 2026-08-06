from typing import Optional
from sqlalchemy import ForeignKey, Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.models.base import TimeStampedModel

class Notification(Base, TimeStampedModel):
    """
    SQLAlchemy model representing in-app notifications.
    """
    __tablename__ = "notifications"

    # If user_id is null, it's a broadcast or Admin-wide notification
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    content: Mapped[str] = mapped_column(String(500), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # REQUEST_CREATED, REQUEST_APPROVED, MATCHED_DONOR, ACCEPTED, CONFIRMED, COMPLETED, WAITING_VERIFICATION
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    link: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationship back to the recipient user
    user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[user_id], backref="notifications")

from app.models.user import User
