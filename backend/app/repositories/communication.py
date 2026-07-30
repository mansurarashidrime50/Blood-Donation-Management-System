from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List
from app.models.communication import CallLog, CommunicationLog
from app.schemas.communication import CallLogCreate, CommunicationLogCreate

class CommunicationRepository:
    async def create_call_log(self, db: AsyncSession, *, obj_in: CallLogCreate) -> CallLog:
        db_obj = CallLog(
            caller_id=obj_in.caller_id,
            receiver_id=obj_in.receiver_id,
            request_id=obj_in.request_id,
            call_type=obj_in.call_type,
            duration_seconds=obj_in.duration_seconds,
            status=obj_in.status
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def create_communication_log(self, db: AsyncSession, *, obj_in: CommunicationLogCreate) -> CommunicationLog:
        db_obj = CommunicationLog(
            sender_id=obj_in.sender_id,
            receiver_id=obj_in.receiver_id,
            request_id=obj_in.request_id,
            log_type=obj_in.log_type,
            details=obj_in.details
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_calls_by_request(self, db: AsyncSession, *, request_id: int) -> List[CallLog]:
        stmt = select(CallLog).filter(CallLog.request_id == request_id).order_by(CallLog.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_communications_by_request(self, db: AsyncSession, *, request_id: int) -> List[CommunicationLog]:
        stmt = select(CommunicationLog).filter(CommunicationLog.request_id == request_id).order_by(CommunicationLog.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

communication_repository = CommunicationRepository()
