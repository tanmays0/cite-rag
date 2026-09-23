/** Shared types for cite-rag retrieval evaluation. */

export type EvalQuestionType = "grounded" | "ood";

export type EvalQuestion = {
  id: string;
  question: string;
  expectedSourceUri: string | null;
  type: EvalQuestionType;
};

export type ChunkStrategy = "fixed" | "semantic";

export type ChunkExperimentConfig = {
  id: string;
  label: string;
  strategy: ChunkStrategy;
  /** Fixed chunk target tokens (fixed strategy). */
  targetTokens?: number;
  /** Semantic pack window. */
  targetTokensMin?: number;
  targetTokensMax?: number;
  overlapRatio: number;
};

export type EmbeddingMode = "minilm" | "hash-smoke";

export type RunConfig = {
  embeddingMode: EmbeddingMode;
  embeddingModelId: string;
  chunk: ChunkExperimentConfig;
  topK: number;
  candidateN: number;
  distanceThreshold: number;
  datasetPath: string;
  datasetQuestionCount: number;
  fixtureFiles: string[];
  fixtureContentHashes: Record<string, string>;
  configHash: string;
  rerank?: {
    enabled: boolean;
    modelId: string;
  };
};

export type CaseEvidence = {
  id: string;
  question: string;
  type: EvalQuestionType;
  expectedSourceUri: string | null;
  retrievedSourceUris: string[];
  retrievedChunkIds: string[];
  retrievedChunkIndexes: number[];
  distances: number[];
  firstRelevantRank: number | null;
  hitAt1: boolean;
  hitAt3: boolean;
  hitAt5: boolean;
  gatePassed: boolean;
  citationCount: number;
  snippetPreview?: string;
  latencyMs: number;
};

export type RetrievalAggregates = {
  groundedCount: number;
  hitAt1: number;
  hitAt3: number;
  hitAt5: number;
  mrr: number;
  hitAt1Rate: number;
  hitAt3Rate: number;
  hitAt5Rate: number;
};

export type GroundingAggregates = {
  oodCount: number;
  oodRefusedCorrectly: number;
  oodRefusalRate: number;
  falseRefusals: number;
  falseRefusalRate: number;
  groundedGatePass: number;
  citationPresent: number;
  citationPresenceRate: number;
};

export type ConfigRunResult = {
  config: RunConfig;
  indexChunkCount: number;
  retrieval: RetrievalAggregates;
  grounding: GroundingAggregates;
  avgLatencyMs: number;
  cases: CaseEvidence[];
};

export type AblationReport = {
  runId: string;
  generatedAt: string;
  chunking: ConfigRunResult[];
  bestChunkConfigId: string;
  rerankComparison: {
    vectorOnly: ConfigRunResult;
    withRerank: ConfigRunResult;
  } | null;
};
