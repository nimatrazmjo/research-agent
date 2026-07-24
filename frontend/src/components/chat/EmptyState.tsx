import styles from "./chat.module.css";

export function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyHeading}>How can I help you research?</p>
      <p className={styles.emptySub}>Ask anything. History clears when you refresh.</p>
    </div>
  );
}
