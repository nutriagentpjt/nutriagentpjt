from collections.abc import AsyncGenerator

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import async_session


async def get_db() -> AsyncGenerator[AsyncSession]:
    async with async_session() as session:
        yield session


async def verify_internal_call(
    x_internal_key: str = Header(..., alias="X-Internal-Key"),
) -> None:
    if not x_internal_key or x_internal_key != settings.INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid internal API key",
        )
