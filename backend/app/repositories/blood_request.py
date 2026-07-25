from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Tuple
from app.models.blood_request import BloodRequest
from app.schemas.blood_request import BloodRequestCreate, BloodRequestUpdate

class BloodRequestRepository:
    async def get(self, db: AsyncSession, id: int) -> Optional[BloodRequest]:
        result = await db.execute(select(BloodRequest).filter(BloodRequest.id == id))
        return result.scalars().first()

    async def get_by_uuid(self, db: AsyncSession, uuid: str) -> Optional[BloodRequest]:
        result = await db.execute(select(BloodRequest).filter(BloodRequest.uuid == uuid))
        return result.scalars().first()

    async def create(self, db: AsyncSession, *, obj_in: BloodRequestCreate, patient_id: int) -> BloodRequest:
        db_obj = BloodRequest(
            patient_id=patient_id,
            patient_name=obj_in.patient_name,
            blood_group_required=obj_in.blood_group_required,
            blood_units_needed=obj_in.blood_units_needed,
            hospital_name=obj_in.hospital_name,
            division=obj_in.division,
            district=obj_in.district,
            emergency_level=obj_in.emergency_level,
            required_date=obj_in.required_date,
            contact_number=obj_in.contact_number,
            additional_notes=obj_in.additional_notes,
            request_status=obj_in.request_status,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, *, db_obj: BloodRequest, obj_in: BloodRequestUpdate) -> BloodRequest:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

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

        query = select(BloodRequest).offset(skip).limit(limit).order_by(BloodRequest.id.desc())
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
        # Donors match requests in status Pending or Approved
        filters = [BloodRequest.request_status.in_(["Pending", "Approved"])]
        if blood_group:
            # Basic matching (or we can expand to universal compatibility later)
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
