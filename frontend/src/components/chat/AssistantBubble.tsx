import styles from "./chat.module.css";
import { ThinkingBlock } from "./ThinkingBlock";
import type { Message } from "../../types/chat";

type Props = Pick<Message, "content" | "thinking" | "usage">;

export function AssistantBubble({ content, thinking, usage }: Props) {
  return (
    <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
      {thinking && <ThinkingBlock text={thinking} />}
      <p className={styles.bubbleText}>{content}</p>
      {usage && (
        <p className={styles.bubbleMeta}>
          {usage.input_tokens} in &middot; {usage.output_tokens} out
        </p>
      )}
    </div>
  );
}
