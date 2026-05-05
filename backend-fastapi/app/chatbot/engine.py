import asyncio
import json
import logging
from collections.abc import AsyncGenerator
from weakref import WeakValueDictionary

import boto3
from botocore.exceptions import ClientError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.chatbot.persona.base import PersonaConfig
from app.chatbot.persona.manager import PersonaManager
from app.chatbot.tools.registry import ToolRegistry
from app.core.config import settings
from app.core.database import async_session as make_session
from app.models.chat import ChatMessage, ChatSession

logger = logging.getLogger(__name__)

_THROTTLE_RETRIES = 5
_THROTTLE_BASE_DELAY = 2.0


async def _bedrock_call_with_backoff(fn, *args, **kwargs):
    """Throttling 시 exponential backoff으로 재시도"""
    delay = _THROTTLE_BASE_DELAY
    for attempt in range(_THROTTLE_RETRIES):
        try:
            return await asyncio.to_thread(fn, *args, **kwargs)
        except ClientError as e:
            if e.response["Error"]["Code"] != "ThrottlingException" or attempt == _THROTTLE_RETRIES - 1:
                raise
            logger.warning("Bedrock throttled, retry %d/%d in %.1fs", attempt + 1, _THROTTLE_RETRIES, delay)
            await asyncio.sleep(delay)
            delay *= 2


class ConversationEngine:
    def __init__(self, persona_manager: PersonaManager, tool_registry: ToolRegistry) -> None:
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
        )
        self.persona_manager = persona_manager
        self.tool_registry = tool_registry
        self._session_locks: WeakValueDictionary[int, asyncio.Lock] = WeakValueDictionary()

    def _get_session_lock(self, session_id: int) -> asyncio.Lock:
        lock = self._session_locks.get(session_id)
        if lock is None:
            lock = asyncio.Lock()
            self._session_locks[session_id] = lock
        return lock

    async def create_session(
        self, guest_id: str, persona_name: str, db: AsyncSession
    ) -> ChatSession:
        persona = self.persona_manager.get(persona_name)
        session = ChatSession(guest_id=guest_id, persona=persona.name)
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session

    async def get_session(
        self, session_id: int, guest_id: str, db: AsyncSession
    ) -> ChatSession:
        session = await db.get(ChatSession, session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        if session.guest_id != guest_id:
            raise PermissionError("Access denied")
        return session

    async def list_sessions(self, guest_id: str, db: AsyncSession) -> list[ChatSession]:
        result = await db.execute(
            select(ChatSession)
            .where(ChatSession.guest_id == guest_id)
            .order_by(ChatSession.updated_at.desc())
        )
        return list(result.scalars().all())

    async def _load_messages(self, session_id: int, db: AsyncSession) -> list[dict]:
        """DB에서 대화 이력을 Bedrock messages 형식으로 로드"""
        result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
        )
        rows = result.scalars().all()

        messages = []
        for row in rows:
            content = []
            if row.content:
                content.append({"text": row.content})
            if row.tool_calls:
                content.extend(row.tool_calls)
            if row.tool_results:
                content.extend(row.tool_results)
            if content:
                messages.append({"role": row.role, "content": content})
        return messages

    async def _save_message(
        self,
        session_id: int,
        role: str,
        content: str | None,
        tool_calls: list | None,
        tool_results: list | None,
        db: AsyncSession,
    ) -> None:
        msg = ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            tool_calls=tool_calls,
            tool_results=tool_results,
        )
        db.add(msg)
        await db.flush()  # autoflush=False이므로 명시적 flush (INSERT 오류를 즉시 감지)

    def _extract_text(self, message: dict) -> str:
        """assistant 메시지에서 텍스트 블록만 추출"""
        parts = []
        for block in message.get("content", []):
            if "text" in block:
                parts.append(block["text"])
        return "\n".join(parts)

    async def chat(
        self,
        session_id: int,
        guest_id: str,
        user_input: str,
        db: AsyncSession,
        jsessionid: str | None = None,
    ) -> str:
        session = await self.get_session(session_id, guest_id, db)
        persona = self.persona_manager.get(session.persona)

        async with self._get_session_lock(session_id):
            return await self._chat_locked(
                session_id, session, persona, user_input, db, jsessionid
            )

    async def _chat_locked(
        self,
        session_id: int,
        session: ChatSession,
        persona: PersonaConfig,
        user_input: str,
        db: AsyncSession,
        jsessionid: str | None = None,
    ) -> str:
        # DB에서 이전 대화 이력 로드
        messages = await self._load_messages(session_id, db)

        # 새 사용자 메시지 추가
        messages.append({"role": "user", "content": [{"text": user_input}]})
        await self._save_message(session_id, "user", user_input, None, None, db)

        system_prompt = self._build_system_prompt(persona)
        context = {"guest_id": session.guest_id, "db": db, "jsessionid": jsessionid or ""}

        # Bedrock 호출 + Tool Use 루프
        bedrock_tools = self.tool_registry.get_bedrock_tools()
        tool_config = {"tools": bedrock_tools} if bedrock_tools else None

        while True:
            kwargs = {
                "modelId": settings.BEDROCK_MODEL_ID,
                "system": [{"text": system_prompt}],
                "messages": messages,
                "inferenceConfig": {"maxTokens": 1024},
            }
            if tool_config:
                kwargs["toolConfig"] = tool_config

            response = await _bedrock_call_with_backoff(self.client.converse, **kwargs)

            assistant_msg = response["output"]["message"]
            messages.append(assistant_msg)

            # tool_use가 없으면 최종 응답
            if response["stopReason"] != "tool_use":
                text = self._extract_text(assistant_msg)
                tool_calls = [b for b in assistant_msg["content"] if "toolUse" in b] or None
                await self._save_message(session_id, "assistant", text, tool_calls, None, db)
                await db.commit()
                return text

            # tool_use 처리
            tool_call_blocks = [b for b in assistant_msg["content"] if "toolUse" in b]
            text_parts = self._extract_text(assistant_msg) or None

            # assistant 메시지 저장 (tool 호출 포함)
            await self._save_message(
                session_id, "assistant", text_parts, tool_call_blocks, None, db
            )

            tool_results = []
            for block in tool_call_blocks:
                tool_use = block["toolUse"]
                tool = self.tool_registry.get(tool_use["name"])
                try:
                    async with make_session() as tool_db:
                        tool_context = {**context, "db": tool_db}
                        result = await tool.execute(tool_use["input"], tool_context)
                        await tool_db.commit()
                    tool_results.append({
                        "toolResult": {
                            "toolUseId": tool_use["toolUseId"],
                            "content": [{"json": result}],
                        }
                    })
                except Exception as e:
                    logger.exception("Tool execution failed: %s", tool_use["name"])
                    tool_results.append({
                        "toolResult": {
                            "toolUseId": tool_use["toolUseId"],
                            "content": [{"text": f"오류 발생: {e}"}],
                            "status": "error",
                        }
                    })

            # tool 결과를 user 메시지로 전송
            messages.append({"role": "user", "content": tool_results})
            await self._save_message(session_id, "user", None, None, tool_results, db)

            # Bedrock rate limit 방지 대기
            await asyncio.sleep(1)

    async def chat_stream(
        self,
        session_id: int,
        guest_id: str,
        user_input: str,
        db: AsyncSession,
        jsessionid: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """SSE 스트리밍 응답"""
        session = await self.get_session(session_id, guest_id, db)
        persona = self.persona_manager.get(session.persona)

        async with self._get_session_lock(session_id):
            async for chunk in self._chat_stream_locked(
                session_id, session, persona, user_input, db, jsessionid
            ):
                yield chunk

    async def _chat_stream_locked(
        self,
        session_id: int,
        session: ChatSession,
        persona: PersonaConfig,
        user_input: str,
        db: AsyncSession,
        jsessionid: str | None = None,
    ) -> AsyncGenerator[str, None]:
        messages = await self._load_messages(session_id, db)
        messages.append({"role": "user", "content": [{"text": user_input}]})
        await self._save_message(session_id, "user", user_input, None, None, db)

        system_prompt = self._build_system_prompt(persona)
        context = {"guest_id": session.guest_id, "db": db, "jsessionid": jsessionid or ""}
        bedrock_tools = self.tool_registry.get_bedrock_tools()
        tool_config = {"tools": bedrock_tools} if bedrock_tools else None

        while True:
            kwargs = {
                "modelId": settings.BEDROCK_MODEL_ID,
                "system": [{"text": system_prompt}],
                "messages": messages,
                "inferenceConfig": {"maxTokens": 1024},
            }
            if tool_config:
                kwargs["toolConfig"] = tool_config

            response = await _bedrock_call_with_backoff(self.client.converse_stream, **kwargs)

            # 스트리밍 응답 처리
            full_text = ""
            tool_call_blocks = []
            current_tool_use = None

            stream_iter = response["stream"].__iter__()
            while True:
                event = await asyncio.to_thread(
                    next, stream_iter, None
                )
                if event is None:
                    break

                if "contentBlockStart" in event:
                    start = event["contentBlockStart"].get("start", {})
                    if "toolUse" in start:
                        current_tool_use = {
                            "toolUse": {
                                "toolUseId": start["toolUse"]["toolUseId"],
                                "name": start["toolUse"]["name"],
                                "input": "",
                            }
                        }

                elif "contentBlockDelta" in event:
                    delta = event["contentBlockDelta"]["delta"]
                    if "text" in delta:
                        full_text += delta["text"]
                        yield delta["text"]
                    elif "toolUse" in delta and current_tool_use:
                        current_tool_use["toolUse"]["input"] += delta["toolUse"].get("input", "")

                elif "contentBlockStop" in event:
                    if current_tool_use:
                        # input을 JSON 파싱
                        raw_input = current_tool_use["toolUse"]["input"]
                        current_tool_use["toolUse"]["input"] = (
                            json.loads(raw_input) if raw_input else {}
                        )
                        tool_call_blocks.append(current_tool_use)
                        current_tool_use = None

            # tool_use가 없으면 종료
            if not tool_call_blocks:
                await self._save_message(session_id, "assistant", full_text, None, None, db)
                await db.commit()
                return

            # assistant 메시지 재구성
            assistant_content = []
            if full_text:
                assistant_content.append({"text": full_text})
            assistant_content.extend(tool_call_blocks)
            messages.append({"role": "assistant", "content": assistant_content})

            await self._save_message(
                session_id, "assistant", full_text or None, tool_call_blocks, None, db
            )

            # tool 실행 (독립 세션으로 메인 트랜잭션과 분리)
            tool_results = []
            for block in tool_call_blocks:
                tool_use = block["toolUse"]
                tool = self.tool_registry.get(tool_use["name"])
                try:
                    async with make_session() as tool_db:
                        tool_context = {**context, "db": tool_db}
                        result = await tool.execute(tool_use["input"], tool_context)
                        await tool_db.commit()
                    tool_results.append({
                        "toolResult": {
                            "toolUseId": tool_use["toolUseId"],
                            "content": [{"json": result}],
                        }
                    })
                except Exception as e:
                    logger.exception("Tool execution failed: %s", tool_use["name"])
                    tool_results.append({
                        "toolResult": {
                            "toolUseId": tool_use["toolUseId"],
                            "content": [{"text": f"오류 발생: {e}"}],
                            "status": "error",
                        }
                    })

            messages.append({"role": "user", "content": tool_results})
            await self._save_message(session_id, "user", None, None, tool_results, db)

            # Bedrock rate limit 방지 대기
            await asyncio.sleep(1)

            # tool 결과 반영 후 다시 스트리밍 (루프 계속)

    def _build_system_prompt(self, persona: PersonaConfig) -> str:
        common = (
            "너는 NutriAgent의 식단·운동 관리 AI 어시스턴트야. "
            "사용자의 건강 목표 달성을 돕는 퍼스널 트레이너 역할을 해.\n"
            "식단 추천, 영양 분석, 운동 조언, 건강 습관 코칭이 주된 역할이야. "
            "대화 중 주제가 크게 벗어나면 자연스럽게 건강·식단 주제로 돌아와줘.\n\n"
        )
        base = common + persona.system_prompt
        rules = [
            "\n## 공통 규칙",
            "- 사용자의 건강 데이터나 식단 정보가 필요하면 반드시 적절한 도구를 사용해 조회하세요.",
            "- 도구 실행 결과를 자연스러운 대화체로 변환해서 전달하세요.",
            "- JSON이나 기술적인 형식을 그대로 사용자에게 보여주지 마세요.",
            f"- 응답은 {persona.max_length}자 이내로 작성하세요.",
        ]
        if persona.use_emoji and persona.emoji_set:
            rules.append(f"- 다음 이모지만 사용하세요: {', '.join(persona.emoji_set)}")
        elif not persona.use_emoji:
            rules.append("- 이모지를 사용하지 마세요.")
        return base + "\n".join(rules)
