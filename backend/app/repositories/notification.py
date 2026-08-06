from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Tuple
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationUpdate

class NotificationRepository:
    async def get(self, db: AsyncSession, id: int) -> Optional[Notification]:
        result = await db.execute(select(Notification).filter(Notification.id == id))
        return result.scalars().first()

    async def create(self, db: AsyncSession, *, obj_in: NotificationCreate) -> Notification:
        db_obj = Notification(
            user_id=obj_in.user_id,
            title=obj_in.title,
            content=obj_in.content,
            type=obj_in.type,
            is_read=obj_in.is_read,
            link=obj_in.link
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_multi_by_user(
        self, db: AsyncSession, *, user_id: Optional[int], skip: int = 0, limit: int = 20
    ) -> Tuple[List[Notification], int]:
        filters = []
        if user_id is not None:
            # Notifications target a specific user or are broadcast (user_id is Null)
            filters.append(Notification.user_id == user_id)
        else:
            # Admin notifications have user_id = Null
            filters.append(Notification.user_id.is_(None))

        count_query = select(func.count()).select_from(Notification).filter(and_(*filters))
        count_result = await db.execute(count_query)
        total_count = count_result.scalar() or 0

        query = (
            select(Notification)
            .filter(and_(*filters))
            .offset(skip)
            .limit(limit)
            .order_by(Notification.id.desc())
        )
        result = await db.execute(query)
        notifications = result.scalars().all()
        return list(notifications), total_count

    async def get_unread_count(self, db: AsyncSession, *, user_id: Optional[int]) -> int:
        filters = [Notification.is_read == False]
        if user_id is not None:
            filters.append(Notification.user_id == user_id)
        else:
            filters.append(Notification.user_id.is_(None))

        query = select(func.count()).select_from(Notification).filter(and_(*filters))
        result = await db.execute(query)
        return result.scalar() or 0

    async def mark_as_read(self, db: AsyncSession, *, id: int, user_id: Optional[int]) -> Optional[Notification]:
        result = await db.execute(
            select(Notification).filter(
                and_(
                    Notification.id == id,
                    Notification.user_id == user_id if user_id is not None else Notification.user_id.is_(None)
                )
            )
        )
        db_obj = result.scalars().first()
        if db_obj:
            db_obj.is_read = True
            db.add(db_obj)
            await db.commit()
            await db.refresh(db_obj)
        return db_obj

    async def mark_all_as_read(self, db: AsyncSession, *, user_id: Optional[int]) -> int:
        filters = [Notification.is_read == False]
        if user_id is not None:
            filters.append(Notification.user_id == user_id)
        else:
            filters.append(Notification.user_id.is_(None))

        result = await db.execute(select(Notification).filter(and_(*filters)))
        notifications = result.scalars().all()
        for item in notifications:
            item.is_read = True
            db.add(item)
        await db.commit()
        return len(notifications)

notification_repository = NotificationRepository()
