from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# Connection arguments for SQLite (specifically disabling same-thread checks for async)
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Async engine creation
engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

# Async session factory
SessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy database models.
    """
    pass
