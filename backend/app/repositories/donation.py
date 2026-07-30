from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List, Optional, Tuple
from datetime import date, datetime
from app.models.donation import Donation, DonationHistory
from app.schemas.donation import DonationCreate, DonationUpdate
from app.models.user import User
from app.models.blood_request import BloodRequest


class DonationRepository:
    async def get(self, db: AsyncSession, id: int) -> Optional[Donation]:
        result = await db.execute(
            select(Donation)
            .filter(Donation.id == id)
            .options(
                selectinload(Donation.request).selectinload(BloodRequest.histories),
                selectinload(Donation.donor).selectinload(User.donor_profile),
                selectinload(Donation.histories).selectinload(DonationHistory.changed_by)
            )
        )
        return result.scalars().first()

    async def get_by_uuid(self, db: AsyncSession, uuid: str) -> Optional[Donation]:
        result = await db.execute(
            select(Donation)
            .filter(Donation.uuid == uuid)
            .options(
                selectinload(Donation.request).selectinload(BloodRequest.histories),
                selectinload(Donation.donor).selectinload(User.donor_profile),
                selectinload(Donation.histories).selectinload(DonationHistory.changed_by)
            )
        )
        return result.scalars().first()

    async def create(self, db: AsyncSession, *, obj_in: DonationCreate, donor_id: int) -> Donation:
        db_obj = Donation(
            donor_id=donor_id,
            request_id=obj_in.request_id,
            donation_date=obj_in.donation_date,
            status=obj_in.status,
            donation_time=obj_in.donation_time,
            donation_location=obj_in.donation_location,
            eta=obj_in.eta,
            donor_completed=obj_in.donor_completed,
            patient_completed=obj_in.patient_completed
        )
        db.add(db_obj)
        await db.flush()

        # Log history
        history = DonationHistory(
            donation_id=db_obj.id,
            status=db_obj.status,
            changed_by_id=donor_id,
            notes="Donation offer created by donor"
        )
        db.add(history)
        await db.commit()

        # Refresh and load relationships
        return await self.get(db, db_obj.id)

    async def update(
        self, db: AsyncSession, *, db_obj: Donation, obj_in: DonationUpdate, changed_by_id: Optional[int] = None, notes: Optional[str] = None
    ) -> Donation:
        old_status = db_obj.status
        update_data = obj_in.model_dump(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        await db.flush()

        # Log history if status changes
        if old_status != db_obj.status:
            history = DonationHistory(
                donation_id=db_obj.id,
                status=db_obj.status,
                changed_by_id=changed_by_id,
                notes=notes or f"Status changed from {old_status} to {db_obj.status}"
            )
            db.add(history)

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
            .options(
                selectinload(Donation.request).selectinload(BloodRequest.histories),
                selectinload(Donation.donor).selectinload(User.donor_profile),
                selectinload(Donation.histories).selectinload(DonationHistory.changed_by)
            )
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
            .options(
                selectinload(Donation.request).selectinload(BloodRequest.histories),
                selectinload(Donation.donor).selectinload(User.donor_profile),
                selectinload(Donation.histories).selectinload(DonationHistory.changed_by)
            )
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
            .options(
                selectinload(Donation.donor).selectinload(User.donor_profile),
                selectinload(Donation.histories).selectinload(DonationHistory.changed_by)
            )
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

