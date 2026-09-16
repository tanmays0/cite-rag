"use client";

import { MessageBubble, type ChatMessage } from "@/components/chat/message-bubble";

export type { ChatMessage };

export function MessageList({
  messages,
  busy,
  emptyHint,
  error,
}: {
  messages: ChatMessage[];
  busy: boolean;
  emptyHint: string;
  error: string | null;
}) {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
      {messages.length === 0 ? (
        <p className="max-w-md text-sm leading-relaxed text-mist/80">{emptyHint}</p>
      ) : null}
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          busy={busy && m.role === "assistant" && !m.content}
        />
      ))}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
