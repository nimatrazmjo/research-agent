from anthropic import AsyncAnthropic
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.dependencies import get_client
from app.schemas import AskRequest
from app.services import stream_ask

router = APIRouter(tags=["ask"])


@router.post("/ask")
async def ask(
    request: AskRequest,
    client: AsyncAnthropic = Depends(get_client),
) -> StreamingResponse:
    return StreamingResponse(
        stream_ask(request.messages, client),
        media_type="application/x-ndjson",
    )
