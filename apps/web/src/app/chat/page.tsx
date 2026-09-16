"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Citation } from "@cite-rag/rag";
import { MessageList, type ChatMessage } from "@/components/chat/message-list";
import { Composer } from "@/components/chat/composer";
import { CitationPanel } from "@/components/chat/citation-panel";

function decodeCitations(header: string | null): Citation[] {
  if (!header) return [];
  try {
    const json = Buffer.from(header, "base64url").toString("utf8");
    return JSON.parse(json) as Citation[];
  } catch {
    try {
      const b64 = header.replace(/-/g, "+").replace(/_/g, "/");
      const json = atob(b64);
      return JSON.parse(json) as Citation[];
    } catch {
      return [];
    }
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const assistantPreview = useMemo(
    () => messages.filter((m) => m.role === "assistant").at(-1),
    [messages],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    setInput("");
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const conv = res.headers.get("X-Conversation-Id");
      if (conv) setConversationId(conv);

      if (res.status === 429) {
        setError("Too many questions — wait a moment and try again.");
        setBusy(false);
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = (await res.json()) as {
          refused?: boolean;
          message?: string;
          error?: string;
          conversationId?: string;
          citations?: Citation[];
        };
        if (data.conversationId) setConversationId(data.conversationId);
        if (!res.ok) {
          setError(data.error || "Chat failed");
          setBusy(false);
          return;
        }
        const citations = data.citations || [];
        setActiveCitations(citations);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.message || "",
            refused: Boolean(data.refused),
            citations,
          },
        ]);
        setBusy(false);
        return;
      }

      const citations = decodeCitations(res.headers.get("X-Citations"));
      setActiveCitations(citations);

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", citations },
      ]);

      if (!res.body) {
        setError("Empty response");
        setBusy(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const piece = JSON.parse(line.slice(2)) as string;
              assembled += piece;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: assembled } : m,
                ),
              );
            } catch {
              // ignore partial
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-7xl gap-0 px-4 pb-8 md:grid-cols-[1fr_300px] md:gap-5 md:px-6">
      <section className="panel flex min-h-[70vh] flex-col rounded-xl">
        <div className="border-b border-white/10 px-5 py-4">
          <h1 className="brand-mark text-2xl text-paper">Chat</h1>
          <p className="mt-1 text-xs text-mist">
            Grounded answers with sources. Weak matches refuse.
          </p>
        </div>
        <MessageList
          messages={messages}
          busy={busy}
          emptyHint="Ask something in the index — or something that isn’t, and watch it refuse."
          error={error}
        />
        <Composer
          value={input}
          onChange={setInput}
          onSubmit={onSubmit}
          busy={busy}
        />
      </section>

      <CitationPanel
        citations={activeCitations}
        refused={assistantPreview?.refused}
      />
    </div>
  );
}
