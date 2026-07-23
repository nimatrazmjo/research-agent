# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Deep Research Agent: **question in → cited report out.** A FastAPI + React app built **phase by phase** to practice the Claude API surface. Follow the phase order in `docs/Deep-Research-Agent-Project.md`. Build only the **current** phase — never add features from later phases.

## Stack

- Backend: Python 3.12, FastAPI (async), Anthropic Python SDK, pydantic-settings.
- Frontend: React + TypeScript + Vite (npm).
- Later phases only — do NOT add early: Postgres + pgvector, Redis.

## Commands

```bash
pip install -r backend/requirements.txt
cd backend && uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev   # port 5173, proxies /api → :8000
```

Intended lint/format: `ruff` + `black` (Python), ESLint + Prettier (TS).

## Layout

- `backend/app/main.py` — FastAPI app, CORS, routers.
- `backend/app/config.py` — Settings (env via `.env`; `ANTHROPIC_API_KEY`).
- `frontend/src/App.tsx`, `frontend/src/lib/api.ts` — base URL from `VITE_API_URL`.
- API is served under `/api`. Streaming (later phases) uses SSE from FastAPI → React.

## Conventions

### Backend

- All endpoints are `async def`. Type-hint everything.
- Every request/response is a Pydantic model; reuse those models for Claude structured outputs.
- Secrets only via env (`ANTHROPIC_API_KEY`); never hardcode or log keys.

### Frontend

- Functional components + hooks only, TS strict mode.
- Keep dependencies minimal — ask before adding a new one.

## Claude API

- Use the Anthropic Python SDK (async client). Default model: `claude-sonnet-4-5`.
- Prefer the SDK's streaming + Tool Runner over hand-rolled loops.
- No LLM calls until the phase that introduces them.

## Do not

- Don't scaffold DB, Redis, or auth before the phase that needs them.
- Don't invent endpoints, pages, or abstractions "for later."
- Don't bypass the phase plan.
