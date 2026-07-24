import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "./lib/api";
import "./App.css";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  usage?: { input_tokens: number; output_tokens: number };
};

type StreamState = {
  thinking: string;
  content: string;
  logs: string[];
  progress: number | null;
};

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [live, setLive] = useState<StreamState>({
    thinking: "",
    content: "",
    logs: [],
    progress: null,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, live.content, live.thinking]);

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  async function send() {
    const q = question.trim();
    if (!q || isStreaming) return;

    const userMsg: Message = { id: genId(), role: "user", content: q };
    const history = [...messages, userMsg];
    setMessages(history);
    setQuestion("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    setIsStreaming(true);
    setLive({ thinking: "", content: "", logs: [], progress: null });

    let thinking = "";
    let content = "";
    let usage: Message["usage"] | undefined;

    try {
      const res = await fetch(`${API_BASE_URL}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.trim()) continue;
          const data = JSON.parse(line);
          if (data.type === "thinking") {
            thinking += data.text;
            setLive((s) => ({ ...s, thinking }));
          } else if (data.type === "text") {
            content += data.text;
            setLive((s) => ({ ...s, content }));
          } else if (data.type === "log") {
            setLive((s) => ({ ...s, logs: [...s.logs, data.text] }));
          } else if (data.type === "progress") {
            const pct = data.total
              ? Math.round((data.value / data.total) * 100)
              : data.value;
            setLive((s) => ({ ...s, progress: pct }));
          } else if (data.type === "usage") {
            usage = {
              input_tokens: data.input_tokens,
              output_tokens: data.output_tokens,
            };
          }
        }
      }
    } finally {
      setIsStreaming(false);
      setLive({ thinking: "", content: "", logs: [], progress: null });
      if (content) {
        setMessages((prev) => [
          ...prev,
          {
            id: genId(),
            role: "assistant",
            content,
            thinking: thinking || undefined,
            usage,
          },
        ]);
      }
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="page">
      <header className="header">
        <span className="header-title">Research Agent</span>
      </header>

      <main className="messages">
        {messages.length === 0 && !isStreaming && (
          <div className="empty-state">
            <p className="empty-heading">How can I help you research?</p>
            <p className="empty-sub">Ask anything. History clears when you refresh.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`row row--${msg.role}`}>
            <div className={`bubble bubble--${msg.role}`}>
              {msg.role === "assistant" && msg.thinking && (
                <details className="thinking">
                  <summary>Thinking</summary>
                  <p>{msg.thinking}</p>
                </details>
              )}
              <p className="bubble-text">{msg.content}</p>
              {msg.usage && (
                <p className="bubble-meta">
                  {msg.usage.input_tokens} in &middot; {msg.usage.output_tokens} out
                </p>
              )}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="row row--assistant">
            <div className="bubble bubble--assistant bubble--live">
              {live.progress !== null && (
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${live.progress}%` }}
                  />
                </div>
              )}
              {live.logs.length > 0 && (
                <p className="stream-log">{live.logs[live.logs.length - 1]}</p>
              )}
              {live.thinking && (
                <details className="thinking" open>
                  <summary>Thinking</summary>
                  <p>{live.thinking}</p>
                </details>
              )}
              {live.content ? (
                <p className="bubble-text">{live.content}</p>
              ) : (
                <span className="dots">
                  <span />
                  <span />
                  <span />
                </span>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <footer className="composer-wrap">
        <div className="composer">
          <textarea
            ref={textareaRef}
            className="composer-input"
            placeholder="Ask a question…"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              resize();
            }}
            onKeyDown={onKeyDown}
            rows={1}
            disabled={isStreaming}
          />
          <button
            className="composer-send"
            onClick={send}
            disabled={!question.trim() || isStreaming}
          >
            {isStreaming ? "···" : "Send"}
          </button>
        </div>
      </footer>
    </div>
  );
}
