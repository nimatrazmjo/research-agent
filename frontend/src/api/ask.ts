import { API_BASE_URL } from "../lib/api";
import type { Message, StreamEvent } from "../types/chat";

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
