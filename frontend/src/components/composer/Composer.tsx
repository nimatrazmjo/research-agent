import { useRef, useState } from "react";
import styles from "./Composer.module.css";

type Props = {
  onSend: (question: string) => void;
  disabled: boolean;
};

export function Composer({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  function submit() {
    const q = value.trim();
    if (!q || disabled) return;
    onSend(q);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <footer className={styles.wrap}>
      <div className={styles.composer}>
        <textarea
          ref={textareaRef}
          className={styles.input}
          placeholder="Ask a question…"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            resize();
          }}
          onKeyDown={onKeyDown}
          rows={1}
          disabled={disabled}
        />
        <button
          className={styles.send}
          onClick={submit}
          disabled={!value.trim() || disabled}
        >
          {disabled ? "···" : "Send"}
        </button>
      </div>
    </footer>
  );
}
