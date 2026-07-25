from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List, Optional, Tuple
from datetime import date
from app.models.donation import Donation
from app.schemas.donation import DonationCreate, DonationUpdate

class DonationRepository:
    async def get(self, db: AsyncSession, id: int) -> Optional[Donation]:
        result = await db.execute(
            select(Donation)
            .filter(Donation.id == id)
            .options(selectinload(Donation.request), selectinload(Donation.donor))
        )
        return result.scalars().first()

    async def get_by_uuid(self, db: AsyncSession, uuid: str) -> Optional[Donation]:
        result = await db.execute(
            select(Donation)
            .filter(Donation.uuid == uuid)
            .options(selectinload(Donation.request), selectinload(Donation.donor))
        )
        return result.scalars().first()

    async def create(self, db: AsyncSession, *, obj_in: DonationCreate, donor_id: int) -> Donation:
        db_obj = Donation(
            donor_id=donor_id,
            request_id=obj_in.request_id,
            donation_date=obj_in.donation_date,
            status=obj_in.status
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        # Refresh relationships
        result = await db.execute(
            select(Donation)
            .filter(Donation.id == db_obj.id)
            .options(selectinload(Donation.request), selectinload(Donation.donor))
        )
        return result.scalars().first()

    async def update(self, db: AsyncSession, *, db_obj: Donation, obj_in: DonationUpdate) -> Donation:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 10
    ) -> Tuple[List[Donation], int]:
        count_query = select(func.count()).select_from(Donation)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar() or 0

        query = (
            select(Donation)
            .options(selectinload(Donation.request), selectinload(Donation.donor))
            .offset(skip)
            .limit(limit)
            .order_by(Donation.id.desc())
        )
        result = await db.execute(query)
        donations = result.scalars().all()
        return list(donations), total_count

    async def get_multi_by_donor(
        self, db: AsyncSession, *, donor_id: int, skip: int = 0, limit: int = 10
    ) -> Tuple[List[Donation], int]:
        count_query = select(func.count()).select_from(Donation).filter(Donation.donor_id == donor_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar() or 0

        query = (
            select(Donation)
            .filter(Donation.donor_id == donor_id)
            .options(selectinload(Donation.request), selectinload(Donation.donor))
            .offset(skip)
            .limit(limit)
            .order_by(Donation.id.desc())
        )
        result = await db.execute(query)
        donations = result.scalars().all()
        return list(donations), total_count

    async def get_multi_by_request(
        self, db: AsyncSession, *, request_id: int
    ) -> List[Donation]:
        query = (
            select(Donation)
            .filter(Donation.request_id == request_id)
            .options(selectinload(Donation.donor))
            .order_by(Donation.id.desc())
        )
        result = await db.execute(query)
        donations = result.scalars().all()
        return list(donations)

    async def check_existing_offer(self, db: AsyncSession, *, donor_id: int, request_id: int) -> Optional[Donation]:
        query = select(Donation).filter(
            and_(Donation.donor_id == donor_id, Donation.request_id == request_id, Donation.status != "Cancelled")
        )
        result = await db.execute(query)
        return result.scalars().first()

donation_repository = DonationRepository()
