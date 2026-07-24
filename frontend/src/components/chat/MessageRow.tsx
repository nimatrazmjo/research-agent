import styles from "./chat.module.css";
import { AssistantBubble } from "./AssistantBubble";
import { UserBubble } from "./UserBubble";
import type { Message } from "../../types/chat";

type Props = {
  message: Message;
};

export function MessageRow({ message }: Props) {
  const rowClass = [
    styles.row,
    message.role === "user" ? styles.rowUser : styles.rowAssistant,
  ].join(" ");

  return (
    <div className={rowClass}>
      {message.role === "user" ? (
        <UserBubble content={message.content} />
      ) : (
        <AssistantBubble
          content={message.content}
          thinking={message.thinking}
          usage={message.usage}
        />
      )}
    </div>
  );
}
