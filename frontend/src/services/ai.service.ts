import { api } from "@/lib/api";

export type ChatRole = "user" | "assistant";

export type ChatTurn = {
  role: ChatRole;
  content: string;
};

export function sendChatMessage(messages: ChatTurn[]) {
  return api.post<{ reply: string }>("/api/ai/chat", { messages });
}
