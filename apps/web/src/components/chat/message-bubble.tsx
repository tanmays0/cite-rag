"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  refused?: boolean;
  citations?: unknown[];
};

export function MessageBubble({
  message,
  busy,
}: {
  message: ChatMessage;
  busy?: boolean;
}) {
  const reduce = useReducedMotion();
  const isUser = message.role === "user";

  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn(
        "max-w-[92%] rounded-lg px-4 py-3 text-sm leading-relaxed",
        isUser
          ? "ml-auto bg-marker/15 text-paper"
          : message.refused
            ? "border border-warn/40 bg-warn/10 text-paper"
            : "bg-white/[0.04] text-paper",
      )}
    >
      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-mist">
        {isUser ? "You" : "cite-rag"}
        {message.refused ? " · refused" : ""}
      </p>
      <p className="whitespace-pre-wrap">
        {message.content || (busy ? "…" : "")}
      </p>
    </motion.div>
  );
}
