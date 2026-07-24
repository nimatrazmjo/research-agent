import { useRef, useState } from "react";
import { API_BASE_URL } from "./lib/api";
import "./App.css";

export default function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [thinking, setThinking] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [usage, setUsage] = useState<{ input_tokens: number; output_tokens: number } | null>(null);

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  async function ask() {
    const q = question.trim();
    if (!q || isStreaming) return;

    setAnswer("");
    setThinking("");
    setUsage(null);
    setIsStreaming(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ask?question=${encodeURIComponent(q)}`
      );
      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.trim()) continue;
          const data = JSON.parse(line);
          if (data.type === "thinking") {
            setThinking((prev) => prev + data.text);
          } else if (data.type === "text") {
            setAnswer((prev) => prev + data.text);
          } else if (data.type === "usage") {
            setUsage({
              input_tokens: data.input_tokens,
              output_tokens: data.output_tokens,
            });
          }
        }
      }
    } finally {
      setIsStreaming(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  }

  return (
    <div className="page">
      <div className="chat">
        {thinking && (
          <details className="thinking">
            <summary>Thinking</summary>
            <p>{thinking}</p>
          </details>
        )}
        {answer && (
          <div className="answer">
            <p>{answer}</p>
            {usage && (
              <p className="usage">Usage: {usage.input_tokens} input tokens, {usage.output_tokens} output tokens</p>
            )}
          </div>
        )}

        <div className="composer">
          <textarea
            ref={textareaRef}
            className="composer-input"
            placeholder="Ask a question..."
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              resize();
            }}
            onKeyDown={onKeyDown}
            rows={1}
          />
          <button
            className="composer-send"
            onClick={ask}
            disabled={!question.trim() || isStreaming}
          >
            {isStreaming ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
