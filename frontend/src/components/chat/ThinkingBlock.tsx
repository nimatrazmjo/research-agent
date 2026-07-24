import styles from "./chat.module.css";

type Props = {
  text: string;
  open?: boolean;
};

export function ThinkingBlock({ text, open = false }: Props) {
  return (
    <details className={styles.thinking} open={open}>
      <summary>Thinking</summary>
      <p>{text}</p>
    </details>
  );
}
