from datetime import datetime

from pydantic import BaseModel, Field


# --- Request ---

class CreateSessionRequest(BaseModel):
    guest_id: str
    persona: str = Field(description="페르소나 식별자 (예: friendly_pt, drill_sergeant)")


class ChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


# --- Response ---

class SessionResponse(BaseModel):
    id: int
    guest_id: str
    persona: str
    title: str | None
    created_at: datetime
    updated_at: datetime


class ChatMessageResponse(BaseModel):
    response: str


class PersonaResponse(BaseModel):
    name: str
    display_name: str
    description: str


class MessageHistoryItem(BaseModel):
    id: int
    role: str
    content: str | None
    created_at: datetime
