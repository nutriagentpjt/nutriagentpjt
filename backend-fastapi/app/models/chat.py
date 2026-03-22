from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    guest_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    persona: Mapped[str] = mapped_column(String, nullable=False, comment="페르소나 식별자")
    title: Mapped[str | None] = mapped_column(String, nullable=True, comment="대화 요약 제목")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String, nullable=False, comment="user | assistant")
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    tool_calls: Mapped[dict | None] = mapped_column(JSONB, nullable=True, comment="tool_use 요청 내역")
    tool_results: Mapped[dict | None] = mapped_column(JSONB, nullable=True, comment="tool 실행 결과")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
