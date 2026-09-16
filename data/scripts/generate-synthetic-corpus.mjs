#!/usr/bin/env node
/**
 * Generate ≥1000 public-domain-style corpus text files locally (no network).
 * Content is synthesized from fixture templates + unique titles (for offline demos).
 * Prefer Wikipedia ingest when network + OPENAI_API_KEY are available.
 *
 * Usage: node data/scripts/generate-synthetic-corpus.mjs --limit 1000
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../..");
const outDir = join(root, "data/corpus/synthetic");
const limit = Number(
  process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ||
    process.argv[process.argv.indexOf("--limit") + 1] ||
    1000,
);

const seeds = ["rag-intro.txt", "citations.txt", "rate-limits.txt"]
  .map((f) => join(root, "data/fixtures", f))
  .filter((p) => existsSync(p))
  .map((p) => readFileSync(p, "utf8"));

const topics = [
  "retrieval", "embeddings", "pgvector", "chunking", "citations", "grounding",
  "rate limits", "auth sessions", "document upload", "PDF parsing", "eval harness",
  "hit rate", "refusal", "Neon", "Groq", "OpenAI", "Next.js", "Docker Compose",
  "token bucket", "HNSW index", "cosine distance", "demo tenant", "corpus scale",
];

mkdirSync(outDir, { recursive: true });

for (let i = 0; i < limit; i++) {
  const topic = topics[i % topics.length];
  const seed = seeds[i % seeds.length] || "Document about RAG systems.";
  const title = `${topic} notes ${i + 1}`;
  const body = `# ${title}\n\nArticle ${i + 1} in the cite-rag synthetic corpus.\nTopic focus: ${topic}.\n\n${seed}\n\nUnique marker: SYNTH-${String(i + 1).padStart(4, "0")}\n`;
  const file = join(outDir, `doc-${String(i + 1).padStart(4, "0")}.txt`);
  writeFileSync(file, body);
}

writeFileSync(
  join(outDir, "README.txt"),
  `Generated ${limit} synthetic TXT docs for offline ingest.\nRun Wikipedia ingest for production-quality corpus when possible.\n`,
);
console.log(`Wrote ${limit} files to ${outDir}`);
