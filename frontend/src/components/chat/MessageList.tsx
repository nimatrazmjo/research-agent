import { useEffect, useRef } from "react";
import styles from "./chat.module.css";
import { EmptyState } from "./EmptyState";
import { LiveBubble } from "./LiveBubble";
import { MessageRow } from "./MessageRow";
import type { Message, StreamState } from "../../types/chat";

type Props = {
  messages: Message[];
  live: StreamState;
  isStreaming: boolean;
};

export function MessageList({ messages, live, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, live.content, live.thinking]);

  return (
    <main className={styles.messages}>
      {messages.length === 0 && !isStreaming && <EmptyState />}

      {messages.map((msg) => (
        <MessageRow key={msg.id} message={msg} />
      ))}

      {isStreaming && (
        <div className={`${styles.row} ${styles.rowAssistant}`}>
          <LiveBubble stream={live} />
        </div>
      )}

      <div ref={bottomRef} />
    </main>
  );
}
