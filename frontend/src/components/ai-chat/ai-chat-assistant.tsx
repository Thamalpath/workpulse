"use client";

import { useMemo, useRef, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Bot, Loader2, Send } from "lucide-react";

import chatSrc from "@/assets/Chatbot.lottie";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { sendChatMessage, type ChatTurn } from "@/services/ai.service";
import { ChatMarkdown } from "@/components/ai-chat/chat-markdown";

type ChatMessage = ChatTurn & {
  id: string;
  error?: boolean;
};

const QUICK_PROMPTS = [
  "Summarize the team's recent work and blockers",
  "Which reports still need approval?",
  "How many hours were logged this week?",
];

export function AiChatAssistant({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const idCounter = useRef(0);

  const userName = useMemo(() => user?.name?.split(" ")[0] ?? "there", [user]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  async function handleSend(preset?: string) {
    const text = (preset ?? input).trim();
    if (!text || isTyping) return;
    setError(null);

    const userMsg: ChatMessage = {
      id: `u-${++idCounter.current}`,
      role: "user",
      content: text,
    };
    const history: ChatMessage[] = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setIsTyping(true);
    scrollToBottom();

    try {
      const historyTurns: ChatTurn[] = history
        .slice(-10)
        .map(({ role, content }) => ({ role, content }));
      const { reply } = await sendChatMessage(historyTurns);
      const assistantMsg: ChatMessage = {
        id: `a-${++idCounter.current}`,
        role: "assistant",
        content: reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: `a-${++idCounter.current}`,
        role: "assistant",
        content:
          "Sorry, I couldn't reach the AI assistant just now. Please try again in a moment.",
        error: true,
      };
      setMessages((prev) => [...prev, errMsg]);
      setError(
        "The AI assistant is currently unavailable. Please try again later.",
      );
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-[#4263A3]/10">
              <DotLottieReact
                src={chatSrc}
                autoplay
                loop
                useFrameInterpolation
                style={{ width: 40, height: 40 }}
              />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-base">
                AI Chat Assistant
              </SheetTitle>
              <SheetDescription className="mt-0.5 flex items-center gap-1.5 text-xs">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                Ask me anything about your team&apos;s reports
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div
          ref={scrollRef}
          className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Bot className="size-10 text-[#4263A3]/60" />
              <div>
                <p className="text-sm font-medium text-[#18202F]">
                  Hi {userName}, I&apos;m your report assistant 👋
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  I can summarize team activity, flag blockers, and answer
                  questions about WorkPulse. Ask me anything!
                </p>
              </div>
              <div className="flex w-full flex-col gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    disabled={isTyping}
                    className="rounded-lg border border-[#E1E6ED] bg-white px-3 py-2 text-left text-xs text-[#4263A3] transition-colors hover:border-[#4263A3]/40 hover:bg-[#4263A3]/5 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex max-w-[85%] items-start gap-2",
                message.role === "user"
                  ? "justify-end self-end flex-row-reverse"
                  : "self-start",
              )}
            >
              {message.role === "assistant" && (
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#4263A3]/10">
                  <Bot className="size-4 text-[#4263A3]" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2.5 text-sm",
                  message.role === "user"
                    ? "bg-[#4263A3] text-white"
                    : message.error
                      ? "border border-red-200 bg-red-50/60 text-[#C85C5C]"
                      : "border border-[#E1E6ED] bg-white text-[#18202F] shadow-xs",
                )}
              >
                {message.role === "assistant" && !message.error ? (
                  <ChatMarkdown content={message.content} />
                ) : (
                  <p
                    className={cn(
                      "leading-relaxed",
                      message.role === "user" && "whitespace-pre-wrap",
                    )}
                  >
                    {message.content}
                  </p>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex self-start">
              <div className="flex items-center gap-1.5 rounded-2xl border border-[#E1E6ED] bg-white px-3.5 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-[#4263A3]" />
                Assistant is thinking…
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-3">
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about team activity, blockers, reports…"
              rows={1}
              className="min-h-10 max-h-32 resize-none py-2.5 text-sm"
            />
            <Button
              type="submit"
              size="icon"
              className="size-10 shrink-0"
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
