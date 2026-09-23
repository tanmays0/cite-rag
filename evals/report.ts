import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { evalsRoot } from "./dataset.ts";
import { fmtMrr, pct } from "./metrics.ts";
import type { AblationReport, ConfigRunResult } from "./types.ts";

const SMOKE_DISCLAIMER =
  "Smoke test only — not representative of retrieval quality.";

function retrievalRow(r: ConfigRunResult): string {
  const ret = r.retrieval;
  return `| ${r.config.chunk.label} | ${pct(ret.hitAt1Rate)} | ${pct(ret.hitAt3Rate)} | ${pct(ret.hitAt5Rate)} | ${fmtMrr(ret.mrr)} | ${r.config.chunk.id} |`;
}

export function renderScorecard(result: ConfigRunResult): string {
  const smoke = result.config.embeddingMode === "hash-smoke";
  const ret = result.retrieval;
  const g = result.grounding;
  return `# cite-rag eval scorecard

**Generated:** ${new Date().toISOString()}  
**Embedding:** ${result.config.embeddingModelId}${smoke ? ` — ${SMOKE_DISCLAIMER}` : ""}  
**Chunking:** ${result.config.chunk.label} (\`${result.config.chunk.id}\`)  
**Fixtures:** ${result.config.fixtureFiles.join(", ")}  
**Dataset:** ${result.config.datasetQuestionCount} questions (\`${result.config.datasetPath}\`)  
**Top-k:** ${result.config.topK}  
**Config hash:** \`${result.config.configHash}\`  
**Distance threshold:** ${result.config.distanceThreshold}

${smoke ? `> **${SMOKE_DISCLAIMER}** Set \`EVAL_HASH_EMBEDDINGS=1\` only for CI without downloading MiniLM.\n` : ""}
## Retrieval Quality

| Metric | Value |
| --- | --- |
| Hit@1 | ${pct(ret.hitAt1Rate)} (${ret.hitAt1}/${ret.groundedCount}) |
| Hit@3 | ${pct(ret.hitAt3Rate)} (${ret.hitAt3}/${ret.groundedCount}) |
| Hit@5 | ${pct(ret.hitAt5Rate)} (${ret.hitAt5}/${ret.groundedCount}) |
| MRR | ${fmtMrr(ret.mrr)} |

## Grounding / Abstention Quality

| Metric | Value |
| --- | --- |
| OOD refusal correctness | ${pct(g.oodRefusalRate)} (${g.oodRefusedCorrectly}/${g.oodCount}) |
| False refusal rate | ${pct(g.falseRefusalRate)} (${g.falseRefusals}/${ret.groundedCount}) |
| Citation presence (gate-pass) | ${pct(g.citationPresenceRate)} (${g.citationPresent}/${g.groundedGatePass}) |

## Reproduce

\`\`\`bash
pnpm eval
# or full ablation:
pnpm eval:ablation
\`\`\`
`;
}

export function renderAblation(report: AblationReport): string {
  const rows = report.chunking.map(retrievalRow).join("\n");
  let rerankSection = "_Rerank comparison not run._\n";
  if (report.rerankComparison) {
    const v = report.rerankComparison.vectorOnly;
    const r = report.rerankComparison.withRerank;
    rerankSection = `| Configuration | Hit@1 | Hit@3 | Hit@5 | MRR | Avg latency (ms) |
| --- | --- | --- | --- | --- | --- |
| Best vector (${v.config.chunk.label}) | ${pct(v.retrieval.hitAt1Rate)} | ${pct(v.retrieval.hitAt3Rate)} | ${pct(v.retrieval.hitAt5Rate)} | ${fmtMrr(v.retrieval.mrr)} | ${v.avgLatencyMs.toFixed(0)} |
| Best + reranker | ${pct(r.retrieval.hitAt1Rate)} | ${pct(r.retrieval.hitAt3Rate)} | ${pct(r.retrieval.hitAt5Rate)} | ${fmtMrr(r.retrieval.mrr)} | ${r.avgLatencyMs.toFixed(0)} |

Reranker model: \`${r.config.rerank?.modelId ?? ""}\` (vector top-${r.config.candidateN} → rerank top-${r.config.topK}).
`;
  }

  const best = report.chunking.find(
    (c) => c.config.chunk.id === report.bestChunkConfigId,
  );
  const g = best?.grounding;

  return `# cite-rag chunking ablation

**Run ID:** \`${report.runId}\`  
**Generated:** ${report.generatedAt}  
**Best chunk config (by MRR, then Hit@5, then Hit@1):** \`${report.bestChunkConfigId}\` — ${best?.config.chunk.label ?? ""}

## Retrieval Quality (chunking)

| Configuration | Hit@1 | Hit@3 | Hit@5 | MRR | ID |
| --- | --- | --- | --- | --- | --- |
${rows}

## Reranking

${rerankSection}

## Grounding / Abstention Quality

Measured on best vector config (\`${report.bestChunkConfigId}\`):

| Metric | Value |
| --- | --- |
| OOD refusal correctness | ${g ? pct(g.oodRefusalRate) : "n/a"} (${g?.oodRefusedCorrectly ?? 0}/${g?.oodCount ?? 0}) |
| False refusal rate | ${g ? pct(g.falseRefusalRate) : "n/a"} (${g?.falseRefusals ?? 0}/${best?.retrieval.groundedCount ?? 0}) |
| Citation presence (gate-pass) | ${g ? pct(g.citationPresenceRate) : "n/a"} (${g?.citationPresent ?? 0}/${g?.groundedGatePass ?? 0}) |

## Reproduce

\`\`\`bash
pnpm eval:ablation
\`\`\`

Artifacts: \`evals/results/${report.runId}.json\`, this file, and \`evals/scorecard.md\` (baseline).
`;
}

export function writeArtifacts(
  report: AblationReport,
  baseline: ConfigRunResult,
): { jsonPath: string; ablationPath: string; scorecardPath: string } {
  const root = evalsRoot();
  const resultsDir = join(root, "results");
  mkdirSync(resultsDir, { recursive: true });
  const jsonPath = join(resultsDir, `${report.runId}.json`);
  const ablationPath = join(root, "ablation.md");
  const scorecardPath = join(root, "scorecard.md");

  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(ablationPath, renderAblation(report));
  writeFileSync(scorecardPath, renderScorecard(baseline));

  return { jsonPath, ablationPath, scorecardPath };
}

export function writeScorecardOnly(result: ConfigRunResult): string {
  const path = join(evalsRoot(), "scorecard.md");
  writeFileSync(path, renderScorecard(result));
  return path;
}
