import type { Request, Response } from "express";

import { chat, type ChatMessage } from "../services/ai.service.js";
import { ApiError } from "../utils/api-error.js";
import type { AuthedRequest } from "../middleware/auth.middleware.js";

export async function postChat(req: Request, res: Response) {
  const { userId } = req as AuthedRequest;
  if (!userId) {
    throw new ApiError(401, "Authentication required.");
  }

  const { messages } = req.body as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  // Validate messages array content
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ApiError(400, "At least one message is required.");
  }
  if (messages.length > 20) {
    throw new ApiError(400, "Too many messages. Maximum 20 allowed.");
  }
  for (const msg of messages) {
    if (msg.role !== "user" && msg.role !== "assistant") {
      throw new ApiError(400, "Invalid message role. Must be 'user' or 'assistant'.");
    }
    if (typeof msg.content !== "string" || msg.content.trim().length === 0) {
      throw new ApiError(400, "Message content is required.");
    }
    if (msg.role === "user" && msg.content.length > 2000) {
      throw new ApiError(400, "Message too long. Maximum 2000 characters.");
    }
  }

  const typedMessages: ChatMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const reply = await chat(typedMessages, userId);

  res.json({ success: true, data: { reply } });
}
