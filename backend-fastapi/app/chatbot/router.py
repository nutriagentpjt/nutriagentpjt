import json

from fastapi import APIRouter, Cookie, Depends, Header, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, verify_internal_call
from app.chatbot.dependencies import get_engine
from app.chatbot.engine import ConversationEngine
from app.chatbot.schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    CreateSessionRequest,
    MessageHistoryItem,
    PersonaResponse,
    SessionResponse,
)
from app.models.chat import ChatMessage

router = APIRouter(
    prefix="/api/v1/chat",
    tags=["chatbot"],
    dependencies=[Depends(verify_internal_call)],
)


@router.get("/personas", response_model=list[PersonaResponse])
async def list_personas(engine: ConversationEngine = Depends(get_engine)):
    """사용 가능한 페르소나 목록"""
    return engine.persona_manager.list_all()


@router.post("/sessions", response_model=SessionResponse)
async def create_session(
    req: CreateSessionRequest,
    db: AsyncSession = Depends(get_db),
    engine: ConversationEngine = Depends(get_engine),
):
    """새 대화 세션 생성"""
    try:
        session = await engine.create_session(req.guest_id, req.persona, db)
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Unknown persona: {req.persona}")
    return SessionResponse(
        id=session.id,
        guest_id=session.guest_id,
        persona=session.persona,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions(
    guest_id: str,
    db: AsyncSession = Depends(get_db),
    engine: ConversationEngine = Depends(get_engine),
):
    """사용자의 대화 세션 목록"""
    sessions = await engine.list_sessions(guest_id, db)
    return [
        SessionResponse(
            id=s.id,
            guest_id=s.guest_id,
            persona=s.persona,
            title=s.title,
            created_at=s.created_at,
            updated_at=s.updated_at,
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}/messages", response_model=list[MessageHistoryItem])
async def get_messages(
    session_id: int,
    x_guest_id: str = Header(..., alias="X-Guest-Id"),
    db: AsyncSession = Depends(get_db),
    engine: ConversationEngine = Depends(get_engine),
):
    """대화 이력 조회 (텍스트 메시지만)"""
    try:
        await engine.get_session(session_id, x_guest_id, db)
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(
        select(ChatMessage)
        .where(
            ChatMessage.session_id == session_id,
            ChatMessage.content.isnot(None),
        )
        .order_by(ChatMessage.created_at)
    )
    rows = result.scalars().all()
    return [
        MessageHistoryItem(id=r.id, role=r.role, content=r.content, created_at=r.created_at)
        for r in rows
    ]


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    session_id: int,
    req: ChatMessageRequest,
    x_guest_id: str = Header(..., alias="X-Guest-Id"),
    jsessionid: str | None = Cookie(None, alias="JSESSIONID"),
    db: AsyncSession = Depends(get_db),
    engine: ConversationEngine = Depends(get_engine),
):
    """메시지 전송 (일반 응답)"""
    try:
        response_text = await engine.chat(
            session_id, x_guest_id, req.message, db, jsessionid=jsessionid
        )
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied")
    return ChatMessageResponse(response=response_text)


@router.post("/sessions/{session_id}/messages/stream")
async def send_message_stream(
    session_id: int,
    req: ChatMessageRequest,
    x_guest_id: str = Header(..., alias="X-Guest-Id"),
    jsessionid: str | None = Cookie(None, alias="JSESSIONID"),
    db: AsyncSession = Depends(get_db),
    engine: ConversationEngine = Depends(get_engine),
):
    """메시지 전송 (SSE 스트리밍 응답)"""
    try:
        await engine.get_session(session_id, x_guest_id, db)
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied")

    async def event_generator():
        try:
            async for chunk in engine.chat_stream(
                session_id, x_guest_id, req.message, db, jsessionid=jsessionid
            ):
                yield f"data: {json.dumps({'type': 'content', 'text': chunk}, ensure_ascii=False)}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
