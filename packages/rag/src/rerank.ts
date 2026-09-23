import { pipeline } from "@xenova/transformers";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { env } from "@xenova/transformers";

/** Small free cross-encoder suitable for offline eval reranking. */
export const DEFAULT_RERANK_MODEL =
  process.env.RERANK_MODEL || "Xenova/ms-marco-MiniLM-L-6-v2";

function resolveCacheDir(): string {
  if (process.env.TRANSFORMERS_CACHE) return process.env.TRANSFORMERS_CACHE;
  const vendored = join(process.cwd(), "models");
  if (existsSync(vendored)) return vendored;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return "/tmp/transformers-cache";
  }
  return join(process.cwd(), "models");
}

env.cacheDir = resolveCacheDir();
env.allowLocalModels = true;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ranker = (text: string) => Promise<any>;

let rankerPromise: Promise<Ranker> | null = null;

function getRanker(modelId: string = DEFAULT_RERANK_MODEL): Promise<Ranker> {
  if (!rankerPromise) {
    rankerPromise = pipeline("text-classification", modelId) as Promise<Ranker>;
  }
  return rankerPromise;
}

export type RerankCandidate = {
  id: string;
  content: string;
};

/**
 * Re-score candidates with a cross-encoder. Higher score = more relevant.
 * Falls back to original order if scoring fails for an item.
 */
export async function rerankCrossEncoder<T extends RerankCandidate>(
  query: string,
  candidates: T[],
  options?: { topK?: number; modelId?: string },
): Promise<Array<T & { rerankScore: number }>> {
  if (!candidates.length) return [];
  const topK = options?.topK ?? candidates.length;
  const modelId = options?.modelId ?? DEFAULT_RERANK_MODEL;
  const ranker = await getRanker(modelId);

  const scored: Array<T & { rerankScore: number }> = [];
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]!;
    const pair = `${query} [SEP] ${c.content}`;
    try {
      const raw = await ranker(pair);
      const list = Array.isArray(raw) ? raw : [raw];
      const positive =
        list.find(
          (x: { label: string }) => /1|pos|entail|relevant/i.test(x.label),
        ) ?? list[0];
      scored.push({
        ...c,
        rerankScore: Number(positive?.score ?? 0),
      });
    } catch {
      scored.push({ ...c, rerankScore: -i });
    }
  }

  scored.sort((a, b) => b.rerankScore - a.rerankScore);
  return scored.slice(0, topK);
}

/** Pure merge helper for tests: sort by score descending, keep topK. */
export function applyRerankScores<T extends { id: string }>(
  candidates: T[],
  scores: Map<string, number>,
  topK: number,
): T[] {
  return [...candidates]
    .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0))
    .slice(0, topK);
}
