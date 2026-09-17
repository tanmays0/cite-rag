"use client";

import { motion, useReducedMotion } from "motion/react";

const stages = [
  {
    title: "Ingest",
    caption: "TXT / PDF corpus via offline CLI",
  },
  {
    title: "Chunk",
    caption: "~640 tokens · 12% overlap",
  },
  {
    title: "Embed",
    caption: "MiniLM 384-d in-process",
  },
  {
    title: "Retrieve",
    caption: "pgvector HNSW · cosine",
  },
  {
    title: "Generate",
    caption: "Groq via Vercel AI SDK",
  },
  {
    title: "Cite or refuse",
    caption: "Grounded markers — or explicit no",
  },
] as const;

export function PipelineDiagram() {
  const reduce = useReducedMotion();

  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stages.map((stage, i) => (
        <motion.li
          key={stage.title}
          className="relative rounded-xl border border-white/10 bg-ink-elevated/50 p-4 backdrop-blur-sm"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{
            duration: 0.4,
            delay: i * 0.06,
            ease: [0.22, 1, 0.36, 1],
          }}
          whileHover={reduce ? undefined : { borderColor: "rgba(200,240,74,0.35)" }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-marker">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-3 text-base font-medium text-paper">{stage.title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-mist">{stage.caption}</p>
          {i < stages.length - 1 ? (
            <span
              aria-hidden
              className="pointer-events-none absolute -right-2 top-1/2 hidden h-px w-4 -translate-y-1/2 bg-gradient-to-r from-marker/50 to-transparent xl:block"
            />
          ) : null}
        </motion.li>
      ))}
    </ol>
  );
}
