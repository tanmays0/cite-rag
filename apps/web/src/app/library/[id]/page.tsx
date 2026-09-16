"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Detail = {
  document: {
    id: string;
    title: string;
    sourceType: string;
    mime: string;
    status: string;
    sourceUri: string;
  };
  chunks: Array<{
    id: string;
    chunkIndex: number;
    pageOrSection: string | null;
    preview: string;
    tokenCount: number;
  }>;
};

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/documents/${params.id}`);
      if (!res.ok) {
        setError("Document not found");
        return;
      }
      setData((await res.json()) as Detail);
    })();
  }, [params.id]);

  if (error) {
    return <p className="px-6 text-danger">{error}</p>;
  }
  if (!data) {
    return <p className="px-6 text-mist">Loading…</p>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-16">
      <Link
        href="/library"
        className="cursor-pointer text-sm text-mist hover:text-marker"
      >
        ← Library
      </Link>
      <h1 className="brand-mark mt-4 text-4xl text-paper">
        {data.document.title}
      </h1>
      <p className="mt-2 font-mono text-xs text-mist">
        {data.document.sourceType} · {data.document.mime} ·{" "}
        <span className="text-teal-mute">{data.document.status}</span>
      </p>
      <p className="mt-1 break-all font-mono text-[11px] text-mist/70">
        {data.document.sourceUri}
      </p>
      <h2 className="mt-10 font-mono text-xs uppercase tracking-[0.18em] text-mist">
        Chunks ({data.chunks.length})
      </h2>
      <ul className="mt-4 space-y-3">
        {data.chunks.map((c) => (
          <li
            key={c.id}
            id={`chunk-${c.chunkIndex}`}
            className="border-b border-white/10 px-1 py-4"
          >
            <p className="font-mono text-[11px] text-marker">
              #{c.chunkIndex}
              {c.pageOrSection ? ` · ${c.pageOrSection}` : ""} · {c.tokenCount}{" "}
              tok
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-paper/90">
              {c.preview}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
