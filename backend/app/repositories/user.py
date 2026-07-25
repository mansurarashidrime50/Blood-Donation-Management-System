from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Tuple
from app.models.user import User
from app.schemas.user import DonorRegister, PatientRegister, UserUpdate
from app.core.security import get_password_hash

class UserRepository:
    async def get(self, db: AsyncSession, id: int) -> Optional[User]:
        result = await db.execute(select(User).filter(User.id == id))
        return result.scalars().first()

    async def get_by_uuid(self, db: AsyncSession, uuid: str) -> Optional[User]:
        result = await db.execute(select(User).filter(User.uuid == uuid))
        return result.scalars().first()

    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).filter(User.email.ilike(email.strip())))
        return result.scalars().first()

    async def create_donor(self, db: AsyncSession, *, obj_in: DonorRegister) -> User:
        db_obj = User(
            full_name=obj_in.full_name,
            email=obj_in.email,
            password_hash=get_password_hash(obj_in.password),
            phone=obj_in.phone,
            role="DONOR",
            status="ACTIVE",
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
            availability=obj_in.availability,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def create_patient(self, db: AsyncSession, *, obj_in: PatientRegister) -> User:
        db_obj = User(
            full_name=obj_in.full_name,
            email=obj_in.email,
            password_hash=get_password_hash(obj_in.password),
            phone=obj_in.phone,
            role="PATIENT",
            status="ACTIVE",
            blood_group=obj_in.blood_group,
            division=obj_in.division,
            district=obj_in.district,
            area=obj_in.area,
            address=obj_in.address,
            gender=obj_in.gender,
            dob=obj_in.dob
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def create_admin(self, db: AsyncSession, *, email: str, password: str, full_name: str, phone: str) -> User:
        db_obj = User(
            full_name=full_name,
            email=email,
            password_hash=get_password_hash(password),
            phone=phone,
            role="ADMIN",
            status="ACTIVE"
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, *, db_obj: User, obj_in: UserUpdate) -> User:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_status(self, db: AsyncSession, *, db_obj: User, status: str) -> User:
        db_obj.status = status
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_profile_image(self, db: AsyncSession, *, db_obj: User, image_path: str) -> User:
        db_obj.profile_image = image_path
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, *, id: int) -> bool:
        result = await db.execute(select(User).filter(User.id == id))
        db_obj = result.scalars().first()
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
            return True
        return False

    async def search_donors(
        self,
        db: AsyncSession,
        *,
        blood_group: Optional[str] = None,
        division: Optional[str] = None,
        district: Optional[str] = None,
        availability: Optional[bool] = None,
        skip: int = 0,
        limit: int = 10
    ) -> Tuple[List[User], int]:
        filters = [User.role == "DONOR", User.status == "ACTIVE"]
        if blood_group:
            filters.append(User.blood_group.ilike(blood_group.strip()))
        if division:
            filters.append(User.division.ilike(f"%{division.strip()}%"))
        if district:
            filters.append(User.district.ilike(f"%{district.strip()}%"))
        if availability is not None:
            filters.append(User.availability == availability)

        # Count query
        count_query = select(func.count()).select_from(User).filter(and_(*filters))
        count_result = await db.execute(count_query)
        total_count = count_result.scalar() or 0

        # Data query
        query = select(User).filter(and_(*filters))
        query = query.offset(skip).limit(limit).order_by(User.id.desc())
        result = await db.execute(query)
        donors = result.scalars().all()
        return list(donors), total_count

    async def get_multi_users(
        self,
        db: AsyncSession,
        *,
        role: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 10
    ) -> Tuple[List[User], int]:
        filters = []
        if role:
            filters.append(User.role == role)
        if status:
            filters.append(User.status == status)
        if search:
            search_filter = or_(
                User.full_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.phone.ilike(f"%{search}%")
            )
            filters.append(search_filter)

        count_query = select(func.count()).select_from(User)
        if filters:
            count_query = count_query.filter(and_(*filters))
        count_result = await db.execute(count_query)
        total_count = count_result.scalar() or 0

        query = select(User)
        if filters:
            query = query.filter(and_(*filters))
        query = query.offset(skip).limit(limit).order_by(User.id.desc())
        result = await db.execute(query)
        users = result.scalars().all()
        return list(users), total_count

user_repository = UserRepository()
