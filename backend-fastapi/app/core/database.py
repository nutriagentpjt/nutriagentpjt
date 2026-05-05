from sqlalchemy import URL
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(
    URL.create(
        drivername="postgresql+asyncpg",
        username=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        host=settings.POSTGRES_SERVER,
        port=settings.POSTGRES_PORT,
        database=settings.POSTGRES_DB,
    ),
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # 커넥션 재사용 전 유효성 검사
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False, autoflush=False)
