from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.models.chat import Conversation, Message

class ChatRepository:
    async def get_conversation(self, db: AsyncSession, conversation_id: int) -> Optional[Conversation]:
        result = await db.execute(
            select(Conversation)
            .filter(Conversation.id == conversation_id)
            .options(
                selectinload(Conversation.patient),
                selectinload(Conversation.donor),
                selectinload(Conversation.request),
                selectinload(Conversation.messages).selectinload(Message.sender)
            )
        )
        return result.scalars().first()

    async def get_or_create_conversation(
        self, db: AsyncSession, *, patient_id: int, donor_id: int, request_id: int
    ) -> Conversation:
        query = (
            select(Conversation)
            .filter(
                and_(
                    Conversation.patient_id == patient_id,
                    Conversation.donor_id == donor_id,
                    Conversation.request_id == request_id
                )
            )
            .options(
                selectinload(Conversation.patient),
                selectinload(Conversation.donor),
                selectinload(Conversation.request),
                selectinload(Conversation.messages).selectinload(Message.sender)
            )
        )
        result = await db.execute(query)
        db_obj = result.scalars().first()
        
        if not db_obj:
            db_obj = Conversation(
                patient_id=patient_id,
                donor_id=donor_id,
                request_id=request_id
            )
            db.add(db_obj)
            await db.commit()
            
            # Fetch with relationships loaded
            db_obj = await self.get_conversation(db, conversation_id=db_obj.id)
            
        return db_obj

    async def get_user_conversations(self, db: AsyncSession, *, user_id: int) -> List[Conversation]:
        query = (
            select(Conversation)
            .filter(or_(Conversation.patient_id == user_id, Conversation.donor_id == user_id))
            .options(
                selectinload(Conversation.patient),
                selectinload(Conversation.donor),
                selectinload(Conversation.request),
                selectinload(Conversation.messages).selectinload(Message.sender)
            )
            .order_by(Conversation.updated_at.desc())
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    async def create_message(
        self, db: AsyncSession, *, conversation_id: int, sender_id: int, content: str
    ) -> Message:
        db_obj = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content
        )
        db.add(db_obj)
        
        # Touch conversation updated_at
        convo_result = await db.execute(select(Conversation).filter(Conversation.id == conversation_id))
        convo = convo_result.scalars().first()
        if convo:
            from datetime import datetime, timezone
            convo.updated_at = datetime.now(timezone.utc)
            db.add(convo)
            
        await db.commit()
        
        # Fetch message with sender loaded
        result = await db.execute(
            select(Message)
            .filter(Message.id == db_obj.id)
            .options(selectinload(Message.sender))
        )
        return result.scalars().first()

chat_repository = ChatRepository()
