# Skill: Refactor React Frontend into Clean Layers

Split a monolithic `App.tsx` into typed layers: types, API, hooks, and granular components with CSS Modules.

## Target structure

```
src/
├── main.tsx                    # entry — imports global.css, mounts App
├── App.tsx                     # ~14 lines — composes hook + layout
├── App.module.css              # .page layout only
├── types/
│   └── chat.ts                 # all shared types and discriminated unions
├── api/
│   └── ask.ts                  # async generator over NDJSON, zero React
├── hooks/
│   └── useChat.ts              # state + streaming logic
├── styles/
│   └── global.css              # CSS custom properties, body reset
└── components/
    ├── layout/
    │   ├── Header.tsx
    │   └── Header.module.css
    ├── chat/
    │   ├── MessageList.tsx     # owns scroll ref + useEffect
    │   ├── MessageRow.tsx      # user vs assistant branch
    │   ├── AssistantBubble.tsx
    │   ├── UserBubble.tsx
    │   ├── ThinkingBlock.tsx   # <details> collapse
    │   ├── LiveBubble.tsx      # progress + log + live content
    │   ├── EmptyState.tsx
    │   └── chat.module.css     # all chat-scoped styles
    └── composer/
        ├── Composer.tsx        # self-contained — owns its own value state
        └── Composer.module.css
```

## Layer rules

| Layer | Rule |
|---|---|
| `types/` | Pure TypeScript — no imports, no React |
| `api/` | Pure async — no React, no state; returns `AsyncGenerator<StreamEvent>` |
| `hooks/` | State + side effects; no JSX; no DOM refs |
| `components/` | JSX only; no raw fetch/state beyond what props supply |
| `styles/global.css` | CSS custom properties + body reset only |
| `*.module.css` | Component-scoped styles only; reference vars from global |

## `types/chat.ts` — discriminated union for stream events

```typescript
export type StreamEvent =
  | { type: "thinking"; text: string }
  | { type: "text"; text: string }
  | { type: "log"; level: string; text: string }
  | { type: "progress"; value: number; total: number; message: string }
  | { type: "usage"; input_tokens: number; output_tokens: number };
```

Using a discriminated union means TypeScript narrows the type inside each `if` branch automatically.

## `api/ask.ts` — async generator pattern

```typescript
export async function* streamAsk(
  messages: Pick<Message, "role" | "content">[],
): AsyncGenerator<StreamEvent> {
  const res = await fetch(`${API_BASE_URL}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split("\n")) {
        if (line.trim()) yield JSON.parse(line) as StreamEvent;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

- Call `reader.releaseLock()` in `finally` to avoid resource leaks
- `yield JSON.parse(line)` — parse each NDJSON line individually, not the whole chunk

## `hooks/useChat.ts` — pure logic, no DOM

```typescript
export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [live, setLive] = useState<StreamState>(INITIAL_STREAM);
  const [isStreaming, setIsStreaming] = useState(false);

  async function send(question: string) { ... }

  return { messages, live, isStreaming, send };
}
```

- No DOM refs in the hook — scroll behavior belongs in `MessageList`
- Use `for await...of` over the async generator from `api/ask.ts`
- Local variables (`thinking`, `content`, `usage`) accumulate during streaming; committed to state in `finally`

## CSS Modules — class composition pattern

For conditional classes avoid dynamic key lookups (`styles[role]` doesn't work with hashed names):

```typescript
// BAD — hashed class names break dynamic lookup
const cls = styles[`row--${message.role}`];

// GOOD — explicit conditional
const rowClass = [
  styles.row,
  message.role === "user" ? styles.rowUser : styles.rowAssistant,
].join(" ");
```

## `styles/global.css` — CSS custom properties

```css
:root {
  --color-bg: #f7f6f3;
  --color-surface: #fff;
  --color-border: #e8e5e0;
  --color-text: #1a1a1a;
  --color-ink: #1a1a1a;
  --color-disabled: #ccc;
  --radius-bubble: 16px;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

Import once in `main.tsx`. Reference in all `.module.css` files via `var(--color-bg)` etc.

## `Composer` — self-contained state

`Composer` owns its own `value` state and calls `onSend(q)` then self-clears. The parent never needs to own the input value:

```typescript
export function Composer({ onSend, disabled }: { onSend: (q: string) => void; disabled: boolean }) {
  const [value, setValue] = useState("");

  function submit() {
    const q = value.trim();
    if (!q || disabled) return;
    onSend(q);
    setValue("");
  }
  ...
}
```

## `App.tsx` — 14-line target

```typescript
export default function App() {
  const { messages, live, isStreaming, send } = useChat();
  return (
    <div className={styles.page}>
      <Header />
      <MessageList messages={messages} live={live} isStreaming={isStreaming} />
      <Composer onSend={send} disabled={isStreaming} />
    </div>
  );
}
```

## TypeScript check

Run `npx tsc --noEmit` before committing to catch import errors from the restructure.

## Key constraints

- Delete `App.css` — it is fully replaced by CSS Modules and `global.css`
- `main.tsx` imports `global.css`; no component imports `global.css`
- Scroll `useEffect` lives in `MessageList`, not in the hook
- CSS Modules hash class names at build time — never construct them dynamically from strings
