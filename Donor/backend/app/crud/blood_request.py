from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Tuple
from app.models.blood_request import BloodRequest
from app.schemas.blood_request import BloodRequestCreate, BloodRequestUpdate

class CRUDBloodRequest:
    async def get(self, db: AsyncSession, id: int) -> Optional[BloodRequest]:
        """
        Fetch a blood request by integer primary key.
        """
        result = await db.execute(select(BloodRequest).filter(BloodRequest.id == id))
        return result.scalars().first()

    async def get_by_uuid(self, db: AsyncSession, uuid: str) -> Optional[BloodRequest]:
        """
        Fetch a blood request by its unique UUID string.
        """
        result = await db.execute(select(BloodRequest).filter(BloodRequest.uuid == uuid))
        return result.scalars().first()

    async def create(self, db: AsyncSession, *, obj_in: BloodRequestCreate, patient_id: int) -> BloodRequest:
        """
        Insert a new blood request record linked to a patient.
        """
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
        """
        Update a blood request's fields.
        """
        update_data = obj_in.model_dump(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, *, id: int) -> bool:
        """
        Delete a blood request from the database.
        """
        result = await db.execute(select(BloodRequest).filter(BloodRequest.id == id))
        db_obj = result.scalars().first()
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
            return True
        return False

    async def get_multi_by_patient(
        self, db: AsyncSession, *, patient_id: int, skip: int = 0, limit: int = 10
    ) -> Tuple[List[BloodRequest], int]:
        """
        Retrieve all requests belonging to a specific patient with total count for pagination.
        """
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

crud_blood_request = CRUDBloodRequest()
