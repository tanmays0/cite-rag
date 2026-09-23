import {
  DEFAULT_DISTANCE_THRESHOLD,
  applyGroundingGate,
} from "../packages/rag/src/retrieve.ts";
import { rerankCrossEncoder } from "../packages/rag/src/rerank.ts";
import type { RetrievedChunk } from "../packages/rag/src/types.ts";
import {
  EVAL_CANDIDATE_N,
  EVAL_TOP_K,
  RERANK_MODEL_ID,
} from "./configs.ts";
import { configHash, embeddingModelId, resolveEmbeddingMode } from "./embed.ts";
import {
  buildFixtureIndex,
  retrieveFromIndex,
  type FixtureIndex,
} from "./index-fixtures.ts";
import {
  aggregateGrounding,
  aggregateRetrieval,
  firstRelevantRank,
  hitAtK,
} from "./metrics.ts";
import { loadQuestions, questionsPath } from "./dataset.ts";
import type {
  CaseEvidence,
  ChunkExperimentConfig,
  ConfigRunResult,
  EmbeddingMode,
  EvalQuestion,
  RunConfig,
} from "./types.ts";

export async function scoreQuestions(
  questions: EvalQuestion[],
  index: FixtureIndex,
  opts: {
    mode: EmbeddingMode;
    chunk: ChunkExperimentConfig;
    topK?: number;
    candidateN?: number;
    distanceThreshold?: number;
    rerank?: boolean;
    rerankModelId?: string;
  },
): Promise<ConfigRunResult> {
  const topK = opts.topK ?? EVAL_TOP_K;
  const candidateN = opts.candidateN ?? EVAL_CANDIDATE_N;
  const threshold = opts.distanceThreshold ?? DEFAULT_DISTANCE_THRESHOLD;
  const mode = opts.mode;
  const cases: CaseEvidence[] = [];
  let latencySum = 0;

  for (const q of questions) {
    const t0 = Date.now();
    let retrieved = await retrieveFromIndex(
      index,
      q.question,
      opts.rerank ? candidateN : topK,
      mode,
    );

    if (opts.rerank && retrieved.length) {
      const reranked = await rerankCrossEncoder(
        q.question,
        retrieved.map((r) => ({
          id: r.id,
          content: r.content,
          row: r,
        })),
        { topK, modelId: opts.rerankModelId ?? RERANK_MODEL_ID },
      );
      retrieved = reranked.map((r, i) => {
        const base = r.row as RetrievedChunk & { sourceUri: string };
        // Keep distance from vector stage for gate; order is reranked.
        return { ...base, distance: i === 0 ? base.distance : base.distance };
      });
      // Re-assign synthetic distances so gate uses best reranked as rank-0;
      // preserve original best distance on first item for gating fidelity.
      const bestDist = Math.min(...retrieved.map((r) => r.distance));
      retrieved = retrieved.map((r, i) =>
        i === 0 ? { ...r, distance: bestDist } : r,
      );
    }

    const latencyMs = Date.now() - t0;
    latencySum += latencyMs;

    const forGate: RetrievedChunk[] = retrieved.map(
      ({ sourceUri: _s, ...rest }) => rest,
    );
    const gate = applyGroundingGate(forGate, threshold);
    const uris = retrieved.map((r) => r.sourceUri);
    const rank = firstRelevantRank(uris, q.expectedSourceUri);
    const citationCount = gate.grounded ? gate.citations.length : 0;

    cases.push({
      id: q.id,
      question: q.question,
      type: q.type,
      expectedSourceUri: q.expectedSourceUri,
      retrievedSourceUris: uris,
      retrievedChunkIds: retrieved.map((r) => r.id),
      retrievedChunkIndexes: retrieved.map((r) => r.chunkIndex),
      distances: retrieved.map((r) => r.distance),
      firstRelevantRank: rank,
      hitAt1: hitAtK(rank, 1),
      hitAt3: hitAtK(rank, 3),
      hitAt5: hitAtK(rank, 5),
      gatePassed: gate.grounded,
      citationCount,
      snippetPreview: retrieved[0]?.content.slice(0, 120),
      latencyMs,
    });
  }

  const runConfig: RunConfig = {
    embeddingMode: mode,
    embeddingModelId: embeddingModelId(mode),
    chunk: opts.chunk,
    topK,
    candidateN: opts.rerank ? candidateN : topK,
    distanceThreshold: threshold,
    datasetPath: "evals/questions.jsonl",
    datasetQuestionCount: questions.length,
    fixtureFiles: index.fixtureFiles,
    fixtureContentHashes: index.fixtureContentHashes,
    configHash: configHash({
      chunk: opts.chunk,
      mode,
      topK,
      candidateN: opts.rerank ? candidateN : topK,
      threshold,
      fixtures: index.fixtureContentHashes,
      rerank: opts.rerank ?? false,
    }),
    rerank: opts.rerank
      ? { enabled: true, modelId: opts.rerankModelId ?? RERANK_MODEL_ID }
      : { enabled: false, modelId: "" },
  };

  return {
    config: runConfig,
    indexChunkCount: index.chunkCount,
    retrieval: aggregateRetrieval(cases),
    grounding: aggregateGrounding(cases),
    avgLatencyMs: questions.length ? latencySum / questions.length : 0,
    cases,
  };
}

export async function runConfigExperiment(
  chunk: ChunkExperimentConfig,
  options?: { rerank?: boolean; mode?: EmbeddingMode },
): Promise<ConfigRunResult> {
  const mode = options?.mode ?? resolveEmbeddingMode();
  const index = await buildFixtureIndex(chunk, mode);
  const questions = loadQuestions();
  return scoreQuestions(questions, index, {
    mode,
    chunk,
    rerank: options?.rerank ?? false,
  });
}

/** Pick best by MRR, then Hit@5, then Hit@1. */
export function pickBestConfig(results: ConfigRunResult[]): ConfigRunResult {
  if (!results.length) throw new Error("No results to pick from");
  return [...results].sort((a, b) => {
    if (b.retrieval.mrr !== a.retrieval.mrr) {
      return b.retrieval.mrr - a.retrieval.mrr;
    }
    if (b.retrieval.hitAt5Rate !== a.retrieval.hitAt5Rate) {
      return b.retrieval.hitAt5Rate - a.retrieval.hitAt5Rate;
    }
    return b.retrieval.hitAt1Rate - a.retrieval.hitAt1Rate;
  })[0]!;
}
