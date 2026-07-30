import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

class TimeStampedModel:
    """
    A mixin class to provide id, uuid, and timestamp fields
    for database models.
    """
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # We use a 36-character string for cross-database compatibility (PostgreSQL and SQLite)
    uuid: Mapped[str] = mapped_column(
        String(36), 
        unique=True, 
        index=True, 
        default=lambda: str(uuid.uuid4())
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc)
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc)
    )
