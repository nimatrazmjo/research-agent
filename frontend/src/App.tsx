import { useEffect, useState } from "react";
import { API_BASE_URL } from "./lib/api";

export default function App() {
  const [status, setStatus] = useState<"loading" | "ok" | "unreachable">("loading");
  const [answer, setAnswer] = useState<string>("");


  async function ask() {
    setAnswer("");
    const response = await fetch(`${API_BASE_URL}/api/ask?question=What+is+2%2B2%3F`);
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      setAnswer((prev) => prev + decoder.decode(value));
    }

  }
  return (
    <div>
      <button onClick={ask}>Ask</button>
      <p>{status === "loading" ? "Checking backend..." : `Backend: ${status}`}</p>
      <p>{answer}</p>
    </div>
  );
}
