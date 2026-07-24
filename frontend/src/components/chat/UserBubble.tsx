import styles from "./chat.module.css";

type Props = {
  content: string;
};

export function UserBubble({ content }: Props) {
  return (
    <div className={`${styles.bubble} ${styles.bubbleUser}`}>
      <p className={styles.bubbleText}>{content}</p>
    </div>
  );
}
