"use client";

import { motion, useReducedMotion } from "motion/react";

const nodes = [
  {
    id: "web",
    label: "apps/web",
    detail: "Next.js UI · Auth.js · API routes",
  },
  {
    id: "rag",
    label: "packages/rag",
    detail: "chunk · retrieve · ground · cite",
  },
  {
    id: "data",
    label: "data/scripts",
    detail: "1,000+ doc ingest CLI",
  },
  {
    id: "db",
    label: "Postgres + pgvector",
    detail: "Supabase · 384-d HNSW",
  },
  {
    id: "llm",
    label: "Groq",
    detail: "openai/gpt-oss-20b",
  },
] as const;

export function ArchitectureDiagram() {
  const reduce = useReducedMotion();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-elevated/40 p-6 md:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_280px_at_20%_0%,rgba(200,240,74,0.07),transparent_60%)]"
      />
      <ul className="relative grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        {nodes.map((node, i) => (
          <motion.li
            key={node.id}
            className="rounded-xl border border-white/10 bg-ink/70 p-4"
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
          >
            <p className="font-mono text-[11px] font-medium text-marker">
              {node.label}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-mist">{node.detail}</p>
          </motion.li>
        ))}
      </ul>
      <p className="relative mt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-mist/60">
        Monorepo · designed seams · not a single-file demo
      </p>
    </div>
  );
}
