/**
 * Retrieval eval harness for cite-rag fixtures + live DB.
 *
 * Metrics:
 * - hit-rate@k: grounded questions where expected source_uri appears in top-k
 * - refusal correctness: OOD questions should fail grounding gate
 * - citation presence: grounded gate produces citations when passing
 *
 * Usage: pnpm eval
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_TOP_K,
  applyGroundingGate,
} from "../packages/rag/src/retrieve.ts";
import {
  LOCAL_EMBEDDING_DIM,
  LOCAL_EMBEDDING_MODEL,
  embedLocalOne,
} from "../packages/rag/src/embed-local.ts";
import postgres from "postgres";

type EvalQ = {
  question: string;
  expected_source_uri: string | null;
  type: "grounded" | "ood";
};

async function embedQuery(text: string): Promise<number[]> {
  const provider = (process.env.EMBEDDING_PROVIDER || "local").toLowerCase();
  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY required when EMBEDDING_PROVIDER=openai");
    const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, input: text }),
    });
    if (!res.ok) throw new Error(`embed failed: ${res.status}`);
    const json = (await res.json()) as { data: Array<{ embedding: number[] }> };
    return json.data[0]!.embedding;
  }
  if (process.env.EVAL_HASH_EMBEDDINGS === "1") {
    const out = Array.from({ length: LOCAL_EMBEDDING_DIM }, () => 0);
    for (let i = 0; i < text.length; i++) {
      out[i % LOCAL_EMBEDDING_DIM] += (text.charCodeAt(i) % 31) / 31;
    }
    const norm = Math.sqrt(out.reduce((s, v) => s + v * v, 0)) || 1;
    return out.map((v) => v / norm);
  }
  return embedLocalOne(text);
}

async function main() {
  const url =
    process.env.DIRECT_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://citerag:citerag@localhost:5432/citerag";
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
  const sql = postgres(url, { max: 1, ssl: isLocal ? false : "require" });
  const questionsPath = join(process.cwd(), "../../evals/questions.jsonl");
  const lines = readFileSync(questionsPath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean);
  const questions = lines.map((l) => JSON.parse(l) as EvalQ);

  let grounded = 0;
  let groundedHits = 0;
  let ood = 0;
  let oodRefused = 0;
  let citationOk = 0;

  const k = DEFAULT_TOP_K;
  const details: string[] = [];

  for (const q of questions) {
    const embedding = await embedQuery(q.question);
    const vectorLiteral = `[${embedding.join(",")}]`;
    const rows = await sql`
      SELECT
        c.id,
        c.document_id AS "documentId",
        d.title AS "documentTitle",
        d.source_uri AS "sourceUri",
        c.content,
        c.chunk_index AS "chunkIndex",
        c.page_or_section AS "pageOrSection",
        (c.embedding <=> ${vectorLiteral}::vector) AS distance
      FROM chunks c
      INNER JOIN documents d ON d.id = c.document_id
      WHERE d.status = 'ready'
      ORDER BY c.embedding <=> ${vectorLiteral}::vector
      LIMIT ${k}
    `;

    const chunks = rows.map((row) => ({
      id: String(row.id),
      documentId: String(row.documentId),
      documentTitle: String(row.documentTitle),
      content: String(row.content),
      chunkIndex: Number(row.chunkIndex),
      pageOrSection: row.pageOrSection ? String(row.pageOrSection) : null,
      distance: Number(row.distance),
      sourceUri: String(row.sourceUri),
    }));

    const gate = applyGroundingGate(chunks);

    if (q.type === "grounded") {
      grounded += 1;
      const hit = chunks.some((c) => c.sourceUri === q.expected_source_uri);
      if (hit) groundedHits += 1;
      if (gate.grounded && gate.citations.length > 0) citationOk += 1;
      details.push(
        `- Q: ${q.question}\n  hit@${k}=${hit} grounded=${gate.grounded}`,
      );
    } else {
      ood += 1;
      if (!gate.grounded) oodRefused += 1;
      details.push(
        `- OOD: ${q.question}\n  refused=${!gate.grounded}`,
      );
    }
  }

  const hitRate = grounded ? groundedHits / grounded : 0;
  const refusalRate = ood ? oodRefused / ood : 0;
  const citationRate = grounded ? citationOk / grounded : 0;

  const report = `# cite-rag eval scorecard

**Generated**: ${new Date().toISOString()}
**Corpus**: fixture docs (+ any seeded corpus in DB)
**Top-k**: ${k}
**Embedding**: ${(process.env.EMBEDDING_PROVIDER || "local") === "openai" ? process.env.EMBEDDING_MODEL || "text-embedding-3-small" : process.env.EVAL_HASH_EMBEDDINGS === "1" ? "deterministic-hash fallback (dev only)" : LOCAL_EMBEDDING_MODEL}

## Metrics

| Metric | Value | Notes |
| --- | --- | --- |
| Retrieval hit-rate@${k} | ${(hitRate * 100).toFixed(1)}% (${groundedHits}/${grounded}) | Expected source_uri in top-${k} |
| Citation presence | ${(citationRate * 100).toFixed(1)}% (${citationOk}/${grounded}) | Gate passed with ≥1 citation |
| Refusal correctness (OOD) | ${(refusalRate * 100).toFixed(1)}% (${oodRefused}/${ood}) | Out-of-corpus should not ground |

## Interpretation

- With free local MiniLM embeddings + fixture seed, hit-rate@k on this quiz typically lands **≥80%**.
- Set \`EVAL_HASH_EMBEDDINGS=1\` only for CI smoke without downloading the model.
- Refusal correctness should stay high when the distance threshold is ~0.55.

## Per-question

${details.join("\n")}

## How to reproduce

\`\`\`bash
pnpm db:migrate && pnpm db:seed-demo
pnpm eval
\`\`\`
`;

  const outPath = join(process.cwd(), "../../evals/scorecard.md");
  writeFileSync(outPath, report);
  console.log(report);
  console.log(`Wrote ${outPath}`);
  await sql.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
