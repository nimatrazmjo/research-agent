# Skill: Refactor FastAPI into Clean Layers

Split a monolithic `main.py` into routers / schemas / services / constants / dependencies. The result is a thin app factory with one file per concern.

## Target structure

```
backend/app/
├── main.py          # app factory only (~20 lines)
├── config.py        # Settings via pydantic-settings
├── constants.py     # MODEL, MAX_TOKENS, system prompts
├── dependencies.py  # shared AsyncAnthropic client via Depends()
├── routers/
│   ├── __init__.py  # re-exports all routers
│   ├── health.py
│   ├── ask.py
│   └── plan.py
├── schemas/
│   ├── __init__.py  # re-exports all models
│   ├── chat.py
│   └── plan.py
└── services/
    ├── __init__.py  # re-exports all service functions
    ├── stream.py
    └── plan.py
```

## Layer responsibilities

| Layer | Rule |
|---|---|
| `main.py` | App factory only — `create_app()` registers middleware + routers |
| `constants.py` | Model name, token limits, static prompts — no logic |
| `config.py` | Env/secrets via `pydantic-settings`; required fields have no default |
| `dependencies.py` | Module-level singleton client; exposes `get_client()` for `Depends()` |
| `schemas/` | Pydantic models only — no business logic |
| `services/` | Pure async functions that call the Anthropic API — no FastAPI imports |
| `routers/` | Thin route handlers — call a service, return the response |

## `main.py` — app factory

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ask_router, health_router, plan_router

def create_app() -> FastAPI:
    app = FastAPI(title="Research Agent API")
    app.add_middleware(CORSMiddleware, allow_origins=[...], allow_methods=["*"], allow_headers=["*"])
    app.include_router(health_router, prefix="/api")
    app.include_router(ask_router, prefix="/api")
    app.include_router(plan_router, prefix="/api")
    return app

app = create_app()
```

## `config.py` — fail-fast settings

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
    anthropic_api_key: str   # required — no default; missing key fails at startup

settings = Settings()
```

## `dependencies.py` — singleton client

```python
from anthropic import AsyncAnthropic
from app.config import settings

_client = AsyncAnthropic(api_key=settings.anthropic_api_key)

def get_client() -> AsyncAnthropic:
    return _client
```

Router usage: `client: AsyncAnthropic = Depends(get_client)` — makes the client mockable in tests.

## `constants.py` — one place for magic values

```python
MODEL = "claude-sonnet-5"
MAX_TOKENS = 4096
PLAN_MAX_TOKENS = 1024

RESEARCH_SYSTEM_PROMPT = [
    {"type": "text", "text": "...", "cache_control": {"type": "ephemeral"}}
]
```

## Router pattern

```python
# routers/ask.py
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.dependencies import get_client
from app.schemas import AskRequest
from app.services import stream_ask

router = APIRouter(tags=["ask"])

@router.post("/ask")
async def ask(request: AskRequest, client: AsyncAnthropic = Depends(get_client)) -> StreamingResponse:
    return StreamingResponse(stream_ask(request.messages, client), media_type="application/x-ndjson")
```

## Service pattern

Services have no FastAPI imports — they are pure async functions:

```python
# services/stream.py
async def stream_ask(messages: list[ChatMessage], client: AsyncAnthropic) -> AsyncGenerator[str, None]:
    raw = [{"role": m.role, "content": m.content} for m in messages]
    async with client.messages.stream(model=MODEL, max_tokens=MAX_TOKENS, messages=raw, ...) as stream:
        async for event in stream:
            ...
            yield _ndjson({...})
```

## `__init__.py` re-export pattern

Each package re-exports its public surface so callers use clean imports:

```python
# schemas/__init__.py
from .chat import AskRequest, ChatMessage
from .plan import ResearchPlan
__all__ = ["AskRequest", "ChatMessage", "ResearchPlan"]

# routers/__init__.py
from .ask import router as ask_router
from .health import router as health_router
from .plan import router as plan_router
__all__ = ["ask_router", "health_router", "plan_router"]
```

## Key constraints

- The app runs inside Docker — verify changes by restarting the container (`docker compose restart backend`) not with the system Python
- `asyncio` import in `main.py` is unused and should be removed when refactoring
- Test startup with `curl http://localhost:8000/api/health` before committing
