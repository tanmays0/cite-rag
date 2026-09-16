"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Citation } from "@cite-rag/rag";
import { CitationCard } from "@/components/chat/citation-card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function CitationPanel({
  citations,
  refused,
}: {
  citations: Citation[];
  refused?: boolean;
}) {
  const reduce = useReducedMotion();
  const [highlightRank, setHighlightRank] = useState<number | null>(null);

  const empty = (
    <p className="mt-4 text-sm leading-relaxed text-mist/70">
      {refused
        ? "No sources — the answer was refused."
        : "Sources show up here when the answer is grounded."}
    </p>
  );

  const list =
    citations.length === 0 ? (
      empty
    ) : (
      <ul className="mt-4 space-y-3">
        {citations.map((c) => (
          <li key={c.chunkId}>
            <CitationCard
              citation={c}
              active={highlightRank === c.rank}
              onSelect={() => setHighlightRank(c.rank)}
            />
          </li>
        ))}
      </ul>
    );

  return (
    <>
      <motion.aside
        className="panel hidden rounded-xl p-4 md:block"
        initial={reduce ? false : { opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        key={citations.map((c) => c.chunkId).join(",") || "empty"}
      >
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-mist">
          Citations
        </h2>
        {list}
      </motion.aside>

      <div className="mt-3 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" variant="secondary" className="w-full">
              {citations.length
                ? `Citations (${citations.length})`
                : "Citations"}
            </Button>
          </SheetTrigger>
          <SheetContent title="Citations">{list}</SheetContent>
        </Sheet>
      </div>
    </>
  );
}
