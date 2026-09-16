"use client";

import Link from "next/link";
import type { Citation } from "@cite-rag/rag";
import { cn } from "@/lib/utils";

export function CitationCard({
  citation,
  active,
  onSelect,
}: {
  citation: Citation;
  active?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 transition",
        active
          ? "border-marker/60 bg-marker/10"
          : "border-white/10 bg-white/[0.03] hover:border-white/20",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full cursor-pointer text-left"
      >
        <p className="font-mono text-[11px] text-marker">[{citation.rank}]</p>
        <p className="mt-1 text-sm font-medium text-paper">
          {citation.documentTitle}
        </p>
        {citation.pageOrSection ? (
          <p className="text-[11px] text-mist">{citation.pageOrSection}</p>
        ) : null}
        <p className="mt-2 text-xs leading-relaxed text-mist">
          {citation.snippet}
        </p>
      </button>
      <Link
        href={`/library/${citation.documentId}`}
        className="mt-2 inline-block cursor-pointer font-mono text-[11px] text-marker/90 underline-offset-2 hover:underline"
      >
        Open source
      </Link>
    </div>
  );
}
