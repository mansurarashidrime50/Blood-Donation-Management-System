from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Tuple
from app.models.donor import Donor
from app.schemas.donor import DonorCreate, DonorUpdate
from app.core.security import get_password_hash

class CRUDDonor:
    async def get(self, db: AsyncSession, id: int) -> Optional[Donor]:
        """
        Fetch a donor by integer primary key.
        """
        result = await db.execute(select(Donor).filter(Donor.id == id))
        return result.scalars().first()

    async def get_by_uuid(self, db: AsyncSession, uuid: str) -> Optional[Donor]:
        """
        Fetch a donor by their unique UUID string.
        """
        result = await db.execute(select(Donor).filter(Donor.uuid == uuid))
        return result.scalars().first()

    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[Donor]:
        """
        Fetch a donor by their unique email.
        """
        result = await db.execute(select(Donor).filter(Donor.email == email))
        return result.scalars().first()

    async def create(self, db: AsyncSession, *, obj_in: DonorCreate) -> Donor:
        """
        Insert a new donor record into the database.
        """
        db_obj = Donor(
            full_name=obj_in.full_name,
            email=obj_in.email,
            password_hash=get_password_hash(obj_in.password),
            phone=obj_in.phone,
            dob=obj_in.dob,
            gender=obj_in.gender,
            blood_group=obj_in.blood_group,
            division=obj_in.division,
            district=obj_in.district,
            area=obj_in.area,
            address=obj_in.address,
            weight=obj_in.weight,
            last_donation_date=obj_in.last_donation_date,
            medical_conditions=obj_in.medical_conditions,
            profile_image=obj_in.profile_image,
            availability=obj_in.availability,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, *, db_obj: Donor, obj_in: DonorUpdate) -> Donor:
        """
        Update a donor's profile fields.
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
        Safely delete a donor from the database.
        """
        result = await db.execute(select(Donor).filter(Donor.id == id))
        db_obj = result.scalars().first()
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
            return True
        return False

    async def get_multi(self, db: AsyncSession, *, skip: int = 0, limit: int = 10) -> Tuple[List[Donor], int]:
        """
        Retrieve a page of donor records along with total count.
        """
        count_query = select(func.count()).select_from(Donor)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar() or 0

        query = select(Donor).offset(skip).limit(limit).order_by(Donor.id.desc())
        result = await db.execute(query)
        donors = result.scalars().all()
        return list(donors), total_count

    async def search(
        self,
        db: AsyncSession,
        *,
        blood_group: Optional[str] = None,
        division: Optional[str] = None,
        district: Optional[str] = None,
        availability: Optional[bool] = None,
        skip: int = 0,
        limit: int = 10
    ) -> Tuple[List[Donor], int]:
        """
        Filter donors by blood group, division, district, and availability, and return total count.
        """
        filters = []
        if blood_group:
            filters.append(Donor.blood_group.ilike(blood_group.strip()))
        if division:
            filters.append(Donor.division.ilike(f"%{division.strip()}%"))
        if district:
            filters.append(Donor.district.ilike(f"%{district.strip()}%"))
        if availability is not None:
            filters.append(Donor.availability == availability)

        # Count filtered donors
        count_query = select(func.count()).select_from(Donor)
        if filters:
            count_query = count_query.filter(and_(*filters))
        count_result = await db.execute(count_query)
        total_count = count_result.scalar() or 0

        # Query filtered donors
        query = select(Donor)
        if filters:
            query = query.filter(and_(*filters))
        query = query.offset(skip).limit(limit).order_by(Donor.id.desc())
        result = await db.execute(query)
        donors = result.scalars().all()
        
        return list(donors), total_count

crud_donor = CRUDDonor()
