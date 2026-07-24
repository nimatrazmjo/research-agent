from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from anthropic import AsyncAnthropic
from fastapi.responses import StreamingResponse

app = FastAPI()
client = AsyncAnthropic()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/ask")
async def ask(question: str):
    async def generate():
        async with client.messages.stream(
            model="claude-sonnet-5",
            max_tokens=4096,
            messages=[{"role": "user", "content": question}],
            thinking={"type": "adaptive", "display": "summarized"},
            output_config={"effort": "max"},
        ) as stream:
            async for event in stream:
                if event.type == "content_block_delta":
                    if event.delta.type == "thinking_delta":
                        yield json.dumps({"type": "thinking", "text": event.delta.thinking}) + "\n"
                    elif event.delta.type == "text_delta":
                        yield json.dumps({"type": "text", "text": event.delta.text}) + "\n"
            usage = stream.current_message_snapshot.usage
            yield json.dumps({"type": "usage",
                              "input_tokens": usage.input_tokens,
                              "output_tokens": usage.output_tokens
                              }) + "\n"
    return StreamingResponse(generate(), media_type="application/x-ndjson")
