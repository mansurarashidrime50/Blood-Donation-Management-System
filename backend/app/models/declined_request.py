from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.models.base import TimeStampedModel

class DeclinedRequest(Base, TimeStampedModel):
    """
    SQLAlchemy model representing a blood request declined by a donor.
    """
    __tablename__ = "declined_requests"

    donor_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    request_id: Mapped[int] = mapped_column(Integer, ForeignKey("blood_requests.id", ondelete="CASCADE"), primary_key=True)

    # Relationships
    donor: Mapped["User"] = relationship("User", foreign_keys=[donor_id])
    request: Mapped["BloodRequest"] = relationship("BloodRequest", foreign_keys=[request_id])

from app.models.user import User
from app.models.blood_request import BloodRequest
