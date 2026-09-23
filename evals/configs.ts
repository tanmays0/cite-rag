import type { ChunkExperimentConfig } from "./types.ts";

/** Ablation grid — only the intended chunking variable changes across rows. */
export const CHUNK_CONFIGS: ChunkExperimentConfig[] = [
  {
    id: "A",
    label: "Fixed 640 / 12%",
    strategy: "fixed",
    targetTokens: 640,
    overlapRatio: 0.12,
  },
  {
    id: "B",
    label: "Fixed 256 / 12%",
    strategy: "fixed",
    targetTokens: 256,
    overlapRatio: 0.12,
  },
  {
    id: "C",
    label: "Fixed 512 / 12%",
    strategy: "fixed",
    targetTokens: 512,
    overlapRatio: 0.12,
  },
  {
    id: "D",
    label: "Fixed 1024 / 12%",
    strategy: "fixed",
    targetTokens: 1024,
    overlapRatio: 0.12,
  },
  {
    id: "E",
    label: "Fixed 640 / 0%",
    strategy: "fixed",
    targetTokens: 640,
    overlapRatio: 0,
  },
  {
    id: "F",
    label: "Fixed 640 / 25%",
    strategy: "fixed",
    targetTokens: 640,
    overlapRatio: 0.25,
  },
  {
    id: "G",
    label: "Semantic ~400–600 / 10%",
    strategy: "semantic",
    targetTokensMin: 400,
    targetTokensMax: 600,
    overlapRatio: 0.1,
  },
];

export const BASELINE_CONFIG = CHUNK_CONFIGS[0]!;

export const EVAL_TOP_K = 5;
export const EVAL_CANDIDATE_N = 20;
export const RERANK_MODEL_ID = "Xenova/ms-marco-MiniLM-L-6-v2";

export function getChunkConfig(id: string): ChunkExperimentConfig {
  const found = CHUNK_CONFIGS.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown chunk config: ${id}`);
  return found;
}
