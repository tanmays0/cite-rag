import { chunkPages, chunkText, estimateTokens } from "./chunk.js";
import {
  LOCAL_EMBEDDING_DIM,
  LOCAL_EMBEDDING_MODEL,
  embedLocalMany,
  embedLocalOne,
} from "./embed-local.js";
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
  chunkPages,
  estimateTokens,
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
};

export type {
  Citation,
  ChunkInput,
  GroundingResult,
  RetrievedChunk,
  TextChunk,
};
