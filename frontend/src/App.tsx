import { useEffect, useState } from "react";
import { API_BASE_URL } from "./lib/api";

export default function App() {
  const [status, setStatus] = useState<"loading" | "ok" | "unreachable">("loading");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
      .then((res) => res.ok ? setStatus("ok") : setStatus("unreachable"))
      .catch(() => setStatus("unreachable"));
  }, []);

  return (
    <div>
      {status === "loading" ? "Checking backend..." : `Backend: ${status}`}
    </div>
  );
}
