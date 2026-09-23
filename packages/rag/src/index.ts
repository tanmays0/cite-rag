import {
  chunkPages,
  chunkText,
  chunkTextSemantic,
  estimateTokens,
  splitSemanticUnits,
} from "./chunk.js";
import {
  LOCAL_EMBEDDING_DIM,
  LOCAL_EMBEDDING_MODEL,
  embedLocalMany,
  embedLocalOne,
} from "./embed-local.js";
import {
  DEFAULT_RERANK_MODEL,
  applyRerankScores,
  rerankCrossEncoder,
} from "./rerank.js";
import {
  DEFAULT_DISTANCE_THRESHOLD,
  DEFAULT_TOP_K,
  REFUSAL_MESSAGE,
  applyGroundingGate,
  buildCitedSystemPrompt,
  distanceToSimilarity,
  toCitations,
} from "./retrieve.js";
import type {
  Citation,
  ChunkInput,
  GroundingResult,
  RetrievedChunk,
  TextChunk,
} from "./types.js";

export {
  chunkText,
  chunkTextSemantic,
  chunkPages,
  estimateTokens,
  splitSemanticUnits,
  applyGroundingGate,
  buildCitedSystemPrompt,
  toCitations,
  distanceToSimilarity,
  REFUSAL_MESSAGE,
  DEFAULT_DISTANCE_THRESHOLD,
  DEFAULT_TOP_K,
  embedLocalMany,
  embedLocalOne,
  LOCAL_EMBEDDING_DIM,
  LOCAL_EMBEDDING_MODEL,
  rerankCrossEncoder,
  applyRerankScores,
  DEFAULT_RERANK_MODEL,
};

export type {
  Citation,
  ChunkInput,
  GroundingResult,
  RetrievedChunk,
  TextChunk,
};
