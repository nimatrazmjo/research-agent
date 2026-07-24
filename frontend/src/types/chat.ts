export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  usage?: { input_tokens: number; output_tokens: number };
};

export type StreamState = {
  thinking: string;
  content: string;
  logs: string[];
  progress: number | null;
};

export type StreamEvent =
  | { type: "thinking"; text: string }
  | { type: "text"; text: string }
  | { type: "log"; level: string; text: string }
  | { type: "progress"; value: number; total: number; message: string }
  | { type: "usage"; input_tokens: number; output_tokens: number };
