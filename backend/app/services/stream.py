import json
from collections.abc import AsyncGenerator

from anthropic import AsyncAnthropic

from app.constants import MAX_TOKENS, MODEL
from app.schemas import ChatMessage


def _ndjson(data: dict) -> str:
    return json.dumps(data) + "\n"


async def stream_ask(
    messages: list[ChatMessage],
    client: AsyncAnthropic,
) -> AsyncGenerator[str, None]:
    yield _ndjson({"type": "log", "level": "info", "text": "Sending request to Claude..."})
    yield _ndjson({"type": "progress", "value": 10, "total": 100, "message": "Waiting for response..."})

    raw = [{"role": m.role, "content": m.content} for m in messages]

    async with client.messages.stream(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=raw,
        thinking={"type": "adaptive", "display": "summarized"},
        output_config={"effort": "max"},
    ) as stream:
        async for event in stream:
            if event.type == "content_block_start":
                if event.content_block.type == "thinking":
                    yield _ndjson({"type": "log", "level": "info", "text": "Claude is thinking..."})
                    yield _ndjson({"type": "progress", "value": 30, "total": 100, "message": "Thinking..."})
                elif event.content_block.type == "text":
                    yield _ndjson({"type": "log", "level": "info", "text": "Generating response..."})
                    yield _ndjson({"type": "progress", "value": 70, "total": 100, "message": "Writing response..."})
            elif event.type == "content_block_delta":
                if event.delta.type == "thinking_delta":
                    yield _ndjson({"type": "thinking", "text": event.delta.thinking})
                elif event.delta.type == "text_delta":
                    yield _ndjson({"type": "text", "text": event.delta.text})

        usage = stream.current_message_snapshot.usage
        yield _ndjson({"type": "progress", "value": 100, "total": 100, "message": "Done"})
        yield _ndjson({"type": "log", "level": "info", "text": "Response complete."})
        yield _ndjson({
            "type": "usage",
            "input_tokens": usage.input_tokens,
            "output_tokens": usage.output_tokens,
        })
