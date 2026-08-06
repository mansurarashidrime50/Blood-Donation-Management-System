from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List, Optional, Tuple
from app.models.blood_request import BloodRequest, BloodRequestHistory
from app.schemas.blood_request import BloodRequestCreate, BloodRequestUpdate

class BloodRequestRepository:
    async def get(self, db: AsyncSession, id: int) -> Optional[BloodRequest]:
        result = await db.execute(
            select(BloodRequest)
            .filter(BloodRequest.id == id)
            .options(
                selectinload(BloodRequest.histories).selectinload(BloodRequestHistory.changed_by),
                selectinload(BloodRequest.accepted_donor)
            )
        )
        return result.scalars().first()

    async def get_by_uuid(self, db: AsyncSession, uuid: str) -> Optional[BloodRequest]:
        result = await db.execute(
            select(BloodRequest)
            .filter(BloodRequest.uuid == uuid)
            .options(
                selectinload(BloodRequest.histories).selectinload(BloodRequestHistory.changed_by),
                selectinload(BloodRequest.accepted_donor)
            )
        )
        return result.scalars().first()

    async def create(self, db: AsyncSession, *, obj_in: BloodRequestCreate, patient_id: int) -> BloodRequest:
        db_obj = BloodRequest(
            patient_id=patient_id,
            patient_name=obj_in.patient_name,
            blood_group_required=obj_in.blood_group_required,
            blood_units_needed=obj_in.blood_units_needed,
            hospital_name=obj_in.hospital_name,
            hospital_location=obj_in.hospital_location,
            division=obj_in.division,
            district=obj_in.district,
            emergency_level=obj_in.emergency_level,
            required_date=obj_in.required_date,
            required_time=obj_in.required_time,
            contact_number=obj_in.contact_number,
            additional_notes=obj_in.additional_notes,
            request_status=obj_in.request_status,
            allow_multiple_donors=obj_in.allow_multiple_donors,
            latitude=obj_in.latitude,
            longitude=obj_in.longitude,
            search_radius=obj_in.search_radius
        )
        db.add(db_obj)
        await db.flush()

        # Write history
        history = BloodRequestHistory(
            request_id=db_obj.id,
            status=db_obj.request_status,
            changed_by_id=patient_id,
            notes="Blood request created by patient"
        )
        db.add(history)
        await db.commit()
        return await self.get(db, db_obj.id)

    async def update(
        self, db: AsyncSession, *, db_obj: BloodRequest, obj_in: BloodRequestUpdate, changed_by_id: Optional[int] = None, notes: Optional[str] = None
    ) -> BloodRequest:
        old_status = db_obj.request_status
        update_data = obj_in.model_dump(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        await db.flush()

        # Write history log if status changes
        if old_status != db_obj.request_status:
            history = BloodRequestHistory(
                request_id=db_obj.id,
                status=db_obj.request_status,
                changed_by_id=changed_by_id,
                notes=notes or f"Status changed from {old_status} to {db_obj.request_status}"
            )
            db.add(history)

        await db.commit()
        return await self.get(db, db_obj.id)

    async def remove(self, db: AsyncSession, *, id: int) -> bool:
        result = await db.execute(select(BloodRequest).filter(BloodRequest.id == id))
        db_obj = result.scalars().first()
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
            return True
        return False

    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 10
    ) -> Tuple[List[BloodRequest], int]:
        count_query = select(func.count()).select_from(BloodRequest)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar() or 0

        query = (
            select(BloodRequest)
            .options(selectinload(BloodRequest.histories).selectinload(BloodRequestHistory.changed_by))
            .offset(skip)
            .limit(limit)
            .order_by(BloodRequest.id.desc())
        )
        result = await db.execute(query)
        requests = result.scalars().all()
        return list(requests), total_count

    async def get_multi_by_patient(
        self, db: AsyncSession, *, patient_id: int, skip: int = 0, limit: int = 10
    ) -> Tuple[List[BloodRequest], int]:
        count_query = select(func.count()).select_from(BloodRequest).filter(BloodRequest.patient_id == patient_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar() or 0

        query = (
            select(BloodRequest)
            .filter(BloodRequest.patient_id == patient_id)
            .options(
                selectinload(BloodRequest.histories).selectinload(BloodRequestHistory.changed_by),
                selectinload(BloodRequest.accepted_donor)
            )
            .offset(skip)
            .limit(limit)
            .order_by(BloodRequest.id.desc())
        )
        result = await db.execute(query)
        requests = result.scalars().all()
        return list(requests), total_count

    async def get_compatible_active_requests(
        self, db: AsyncSession, *, blood_group: Optional[str] = None, division: Optional[str] = None, skip: int = 0, limit: int = 10
    ) -> Tuple[List[BloodRequest], int]:
        filters = [BloodRequest.request_status.in_(["Pending", "Approved", "Matching", "Notified", "Accepted"])]
        if blood_group:
            filters.append(BloodRequest.blood_group_required == blood_group)
        if division:
            filters.append(BloodRequest.division.ilike(division))

        count_query = select(func.count()).select_from(BloodRequest).filter(and_(*filters))
        count_result = await db.execute(count_query)
        total_count = count_result.scalar() or 0

        query = select(BloodRequest).filter(and_(*filters)).offset(skip).limit(limit).order_by(BloodRequest.id.desc())
        result = await db.execute(query)
        requests = result.scalars().all()
        return list(requests), total_count

blood_request_repository = BloodRequestRepository()

