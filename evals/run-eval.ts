/**
 * Baseline MiniLM retrieval eval on fixture corpus (config A).
 *
 * Usage: pnpm eval
 * Smoke: EVAL_HASH_EMBEDDINGS=1 pnpm eval
 */

import { BASELINE_CONFIG } from "./configs.ts";
import { resolveEmbeddingMode } from "./embed.ts";
import { writeScorecardOnly } from "./report.ts";
import { runConfigExperiment } from "./score.ts";
import { fmtMrr, pct } from "./metrics.ts";

async function main() {
  const mode = resolveEmbeddingMode();
  if (mode === "hash-smoke") {
    console.warn(
      "Smoke test only — not representative of retrieval quality. (EVAL_HASH_EMBEDDINGS=1)",
    );
  } else {
    console.log("Running MiniLM fixture benchmark (config A)...");
  }

  const result = await runConfigExperiment(BASELINE_CONFIG, { mode });
  const path = writeScorecardOnly(result);
  const r = result.retrieval;
  const g = result.grounding;

  console.log(`
Embedding: ${result.config.embeddingModelId}
Chunking:  ${result.config.chunk.label}
Hit@1=${pct(r.hitAt1Rate)} Hit@3=${pct(r.hitAt3Rate)} Hit@5=${pct(r.hitAt5Rate)} MRR=${fmtMrr(r.mrr)}
OOD refusal=${pct(g.oodRefusalRate)} false refusal=${pct(g.falseRefusalRate)} citations=${pct(g.citationPresenceRate)}
Wrote ${path}
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
