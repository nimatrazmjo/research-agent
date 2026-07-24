from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: str


class AskRequest(BaseModel):
    messages: list[ChatMessage]
