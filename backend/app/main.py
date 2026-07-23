from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
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
            max_tokens=1024,
            messages=[{"role": "user", "content": question}],
        ) as stream:
            async for text in stream.text_stream:
                yield text
    return StreamingResponse(generate(), media_type="text/plain")
