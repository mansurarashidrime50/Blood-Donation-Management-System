from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime
from app.models.meeting import Meeting
from app.schemas.meeting import MeetingCreate, MeetingUpdate

class MeetingRepository:
    async def get(self, db: AsyncSession, id: int) -> Optional[Meeting]:
        result = await db.execute(
            select(Meeting)
            .filter(Meeting.id == id)
            .options(selectinload(Meeting.patient), selectinload(Meeting.donor), selectinload(Meeting.request))
        )
        return result.scalars().first()

    async def get_by_request(self, db: AsyncSession, request_id: int) -> Optional[Meeting]:
        result = await db.execute(
            select(Meeting)
            .filter(Meeting.request_id == request_id)
            .options(selectinload(Meeting.patient), selectinload(Meeting.donor), selectinload(Meeting.request))
            .order_by(Meeting.id.desc())
        )
        return result.scalars().first()

    async def create(self, db: AsyncSession, *, obj_in: MeetingCreate) -> Meeting:
        db_obj = Meeting(
            request_id=obj_in.request_id,
            patient_id=obj_in.patient_id,
            donor_id=obj_in.donor_id,
            meeting_time=obj_in.meeting_time,
            meeting_location=obj_in.meeting_location,
            status=obj_in.status
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return await self.get(db, db_obj.id)

    async def update(self, db: AsyncSession, *, db_obj: Meeting, obj_in: MeetingUpdate) -> Meeting:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

meeting_repository = MeetingRepository()
