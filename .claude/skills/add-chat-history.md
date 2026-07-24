# Skill: Add Ephemeral Chat History

Implement multi-turn chat history that persists for the browser session and clears on refresh. No database or localStorage required.

## Architecture

- History lives in React `useState` — ephemeral by design, clears on refresh
- Each new request sends the full message history to the backend
- The backend passes history to Claude as the `messages` array
- Streaming result is shown as a live bubble, then committed to history on completion

## Backend

### Change endpoint from GET to POST (`backend/app/routers/ask.py`)

```python
@router.post("/ask")
async def ask(
    request: AskRequest,
    client: AsyncAnthropic = Depends(get_client),
) -> StreamingResponse:
    return StreamingResponse(
        stream_ask(request.messages, client),
        media_type="application/x-ndjson",
    )
```

### Add request schema (`backend/app/schemas/chat.py`)

```python
class ChatMessage(BaseModel):
    role: str
    content: str

class AskRequest(BaseModel):
    messages: list[ChatMessage]
```

### Pass history to Claude (`backend/app/services/stream.py`)

```python
async def stream_ask(messages: list[ChatMessage], client: AsyncAnthropic):
    raw = [{"role": m.role, "content": m.content} for m in messages]
    async with client.messages.stream(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=raw,   # full history
        ...
    ) as stream:
        ...
```

Only text content is forwarded for previous turns — thinking blocks are display-only and not echoed back.

## Frontend

### Types (`src/types/chat.ts`)

```typescript
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  usage?: { input_tokens: number; output_tokens: number };
};
```

### Hook pattern (`src/hooks/useChat.ts`)

```typescript
const [messages, setMessages] = useState<Message[]>([]);

async function send(question: string) {
  const userMsg = { id: genId(), role: "user", content: question };
  const history = [...messages, userMsg];  // include new message
  setMessages(history);                    // optimistic update

  // send full history to backend
  for await (const event of streamAsk(
    history.map((m) => ({ role: m.role, content: m.content }))
  )) { ... }

  // commit assistant reply to history after streaming
  setMessages((prev) => [
    ...prev,
    { id: genId(), role: "assistant", content, thinking, usage },
  ]);
}
```

### API call (`src/api/ask.ts`)

```typescript
export async function* streamAsk(messages: Pick<Message, "role" | "content">[]) {
  const res = await fetch(`${API_BASE_URL}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  // ... NDJSON reader
}
```

### Rendering

- Committed messages render as `<MessageRow>` (user bubble right, assistant bubble left)
- In-progress stream renders as `<LiveBubble>` with typing dots → progress → content
- On completion, `live` state is cleared and the result is appended to `messages`
- `<EmptyState>` shown when `messages.length === 0 && !isStreaming`

## Auto-scroll

Owned by `MessageList` — not the hook. The hook is pure logic with no DOM refs:

```typescript
// MessageList.tsx
const bottomRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages, live.content, live.thinking]);
```

## Key constraints

- CORS must allow the Vite dev port (5173/5174/5175) — add all three to `allow_origins`
- Previous assistant thinking blocks are not sent back to Claude in history (multi-turn thinking requires echoing the full content block, which is complex; send text only)
- `Composer` manages its own `value` state and calls `onSend(q)` then self-clears — parent never owns the input value
