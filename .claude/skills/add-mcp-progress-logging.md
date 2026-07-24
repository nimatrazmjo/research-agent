# Skill: Add Log & Progress Notifications

Add structured log and progress events to the MCP server, MCP client, FastAPI streaming endpoint, and React frontend.

## MCP Server (`backend/app/mcp/mcp-server.py`)

Inject `Context` into any tool and emit logs + progress at each step:

```python
from fastmcp import FastMCP, Context

@mcp.tool
async def my_tool(input: str, ctx: Context) -> str:
    await ctx.info("Starting work...")
    await ctx.report_progress(0, 3, "Starting")

    # ... step 1 ...
    await ctx.report_progress(1, 3, "Step 1 done")

    # ... step 2 ...
    await ctx.report_progress(2, 3, "Step 2 done")

    await ctx.info("Complete")
    await ctx.report_progress(3, 3, "Done")
    return result
```

- `ctx.info(msg)` — info-level log sent to client
- `ctx.report_progress(current, total, message)` — numeric progress notification
- `ctx` is injected automatically when the parameter is typed as `Context`

## MCP Client (`backend/app/mcp/mcp_client.py`)

Register custom handlers on `Client(transport, log_handler=..., progress_handler=...)`:

```python
async def log_handler(message) -> None:
    print(f"[{message.level.upper()}] {message.data}")

async def progress_handler(progress: float, total: float | None, message: str | None) -> None:
    if total:
        pct = int(progress / total * 100)
        bar = "#" * (pct // 5) + "-" * (20 - pct // 5)
        print(f"[PROGRESS] [{bar}] {pct}% {message or ''}")

async with Client(transport, log_handler=log_handler, progress_handler=progress_handler) as client:
    ...
```

- `log_handler` receives a `LoggingMessageNotificationParams` object with `.level` and `.data`
- `progress_handler` signature: `(progress: float, total: float | None, message: str | None) -> None`

## FastAPI Streaming (`backend/app/services/stream.py`)

Emit `log` and `progress` NDJSON events inside the async generator:

```python
def _ndjson(data: dict) -> str:
    return json.dumps(data) + "\n"

async def stream_ask(...):
    yield _ndjson({"type": "log", "level": "info", "text": "Sending request..."})
    yield _ndjson({"type": "progress", "value": 10, "total": 100, "message": "Waiting..."})

    async with client.messages.stream(...) as stream:
        async for event in stream:
            if event.type == "content_block_start":
                if event.content_block.type == "thinking":
                    yield _ndjson({"type": "log", "level": "info", "text": "Thinking..."})
                    yield _ndjson({"type": "progress", "value": 30, "total": 100, "message": "Thinking..."})
                elif event.content_block.type == "text":
                    yield _ndjson({"type": "progress", "value": 70, "total": 100, "message": "Writing..."})

        yield _ndjson({"type": "progress", "value": 100, "total": 100, "message": "Done"})
        yield _ndjson({"type": "log", "level": "info", "text": "Response complete."})
```

Event shapes sent over the wire:
- `{"type": "log", "level": "info", "text": "..."}`
- `{"type": "progress", "value": 70, "total": 100, "message": "..."}`

## Frontend (`src/hooks/useChat.ts` + `src/components/chat/LiveBubble.tsx`)

Handle `log` and `progress` event types in the stream consumer:

```typescript
} else if (event.type === "log") {
  setLive((s) => ({ ...s, logs: [...s.logs, event.text] }));
} else if (event.type === "progress") {
  const pct = event.total
    ? Math.round((event.value / event.total) * 100)
    : event.value;
  setLive((s) => ({ ...s, progress: pct }));
}
```

Render in `LiveBubble`:

```tsx
{stream.progress !== null && (
  <div className={styles.progressBar}>
    <div className={styles.progressFill} style={{ width: `${stream.progress}%` }} />
  </div>
)}
{lastLog && <p className={styles.streamLog}>{lastLog}</p>}
```

- Only the last log line is shown (avoids noise)
- `progress` is cleared to `null` in the `finally` block after streaming ends

## Key constraints

- `ctx.report_progress()` only sends an MCP notification if the client passed a `progressToken` in the request meta; otherwise it silently no-ops
- `effort: "max"` + `display: "summarized"` required for adaptive thinking to fire on `claude-sonnet-5`
- FastAPI `StreamingResponse` silently swallows generator exceptions — always test the raw NDJSON stream with `curl -sN` before debugging the UI
