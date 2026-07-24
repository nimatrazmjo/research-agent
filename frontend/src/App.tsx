import { Composer } from "./components/composer/Composer";
import { Header } from "./components/layout/Header";
import { MessageList } from "./components/chat/MessageList";
import { useChat } from "./hooks/useChat";
import styles from "./App.module.css";

export default function App() {
  const { messages, live, isStreaming, send } = useChat();

  return (
    <div className={styles.page}>
      <Header />
      <MessageList messages={messages} live={live} isStreaming={isStreaming} />
      <Composer onSend={send} disabled={isStreaming} />
    </div>
  );
}
