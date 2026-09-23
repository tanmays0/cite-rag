/**
 * Full chunking ablation A–G + rerank on best config + OOD metrics.
 *
 * Usage: pnpm eval:ablation
 */

import { CHUNK_CONFIGS } from "./configs.ts";
import { resolveEmbeddingMode } from "./embed.ts";
import { fmtMrr, pct } from "./metrics.ts";
import { writeArtifacts } from "./report.ts";
import { pickBestConfig, runConfigExperiment } from "./score.ts";
import type { AblationReport, ConfigRunResult } from "./types.ts";

async function main() {
  const mode = resolveEmbeddingMode();
  if (mode === "hash-smoke") {
    console.warn(
      "Smoke test only — not representative of retrieval quality. (EVAL_HASH_EMBEDDINGS=1)",
    );
  }

  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  console.log(`Ablation run ${runId} (mode=${mode})`);

  const chunking: ConfigRunResult[] = [];
  for (const cfg of CHUNK_CONFIGS) {
    console.log(`\n=== Config ${cfg.id}: ${cfg.label} ===`);
    const result = await runConfigExperiment(cfg, { mode });
    chunking.push(result);
    const r = result.retrieval;
    console.log(
      `indexChunks=${result.indexChunkCount}; Hit@1=${pct(r.hitAt1Rate)} Hit@5=${pct(r.hitAt5Rate)} MRR=${fmtMrr(r.mrr)}`,
    );
  }

  const best = pickBestConfig(chunking);
  console.log(
    `\nBest chunk config: ${best.config.chunk.id} (${best.config.chunk.label}) MRR=${fmtMrr(best.retrieval.mrr)}`,
  );

  console.log(`\n=== Rerank on best (${best.config.chunk.id}) ===`);
  const withRerank = await runConfigExperiment(best.config.chunk, {
    mode,
    rerank: true,
  });
  console.log(
    `vector MRR=${fmtMrr(best.retrieval.mrr)} rerank MRR=${fmtMrr(withRerank.retrieval.mrr)} latency ${best.avgLatencyMs.toFixed(0)}ms → ${withRerank.avgLatencyMs.toFixed(0)}ms`,
  );

  const report: AblationReport = {
    runId,
    generatedAt: new Date().toISOString(),
    chunking,
    bestChunkConfigId: best.config.chunk.id,
    rerankComparison: {
      vectorOnly: best,
      withRerank,
    },
  };

  const paths = writeArtifacts(report, best);
  console.log(`\nWrote:\n  ${paths.jsonPath}\n  ${paths.ablationPath}\n  ${paths.scorecardPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
