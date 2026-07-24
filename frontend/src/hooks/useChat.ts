import { useState } from "react";
import { streamAsk } from "../api/ask";
import type { Message, StreamState } from "../types/chat";

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const INITIAL_STREAM: StreamState = {
  thinking: "",
  content: "",
  logs: [],
  progress: null,
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [live, setLive] = useState<StreamState>(INITIAL_STREAM);
  const [isStreaming, setIsStreaming] = useState(false);

  async function send(question: string): Promise<void> {
    if (!question.trim() || isStreaming) return;

    const userMsg: Message = { id: genId(), role: "user", content: question };
    const history = [...messages, userMsg];
    setMessages(history);
    setIsStreaming(true);
    setLive(INITIAL_STREAM);

    let thinking = "";
    let content = "";
    let usage: Message["usage"] | undefined;

    try {
      for await (const event of streamAsk(
        history.map((m) => ({ role: m.role, content: m.content })),
      )) {
        if (event.type === "thinking") {
          thinking += event.text;
          setLive((s) => ({ ...s, thinking }));
        } else if (event.type === "text") {
          content += event.text;
          setLive((s) => ({ ...s, content }));
        } else if (event.type === "log") {
          setLive((s) => ({ ...s, logs: [...s.logs, event.text] }));
        } else if (event.type === "progress") {
          const pct = event.total
            ? Math.round((event.value / event.total) * 100)
            : event.value;
          setLive((s) => ({ ...s, progress: pct }));
        } else if (event.type === "usage") {
          usage = {
            input_tokens: event.input_tokens,
            output_tokens: event.output_tokens,
          };
        }
      }
    } finally {
      setIsStreaming(false);
      setLive(INITIAL_STREAM);
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

  return { messages, live, isStreaming, send };
}
