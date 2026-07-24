import styles from "./chat.module.css";
import { ThinkingBlock } from "./ThinkingBlock";
import type { StreamState } from "../../types/chat";

type Props = {
  stream: StreamState;
};

export function LiveBubble({ stream }: Props) {
  const lastLog = stream.logs[stream.logs.length - 1];

  return (
    <div className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.bubbleLive}`}>
      {stream.progress !== null && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${stream.progress}%` }} />
        </div>
      )}
      {lastLog && <p className={styles.streamLog}>{lastLog}</p>}
      {stream.thinking && <ThinkingBlock text={stream.thinking} open />}
      {stream.content ? (
        <p className={styles.bubbleText}>{stream.content}</p>
      ) : (
        <span className={styles.dots}>
          <span />
          <span />
          <span />
        </span>
      )}
    </div>
  );
}
