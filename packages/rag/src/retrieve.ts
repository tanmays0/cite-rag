import type { Citation, GroundingResult, RetrievedChunk } from "./types.js";

export const DEFAULT_DISTANCE_THRESHOLD = 0.55;
export const DEFAULT_TOP_K = 6;

export function distanceToSimilarity(distance: number): number {
  return 1 / (1 + Math.max(0, distance));
}

export function toCitations(chunks: RetrievedChunk[]): Citation[] {
  return chunks.map((chunk, i) => ({
    rank: i + 1,
    chunkId: chunk.id,
    documentId: chunk.documentId,
    documentTitle: chunk.documentTitle,
    pageOrSection: chunk.pageOrSection,
    snippet: chunk.content.slice(0, 280),
    score: distanceToSimilarity(chunk.distance),
  }));
}

/**
 * Grounding gate: refuse when no chunks or best cosine distance is too high.
 */
export function applyGroundingGate(
  chunks: RetrievedChunk[],
  threshold: number = DEFAULT_DISTANCE_THRESHOLD,
): GroundingResult {
  if (!chunks.length) {
    return {
      grounded: false,
      reason: "No relevant passages were retrieved from the corpus.",
      chunks: [],
    };
  }
  const best = chunks[0]!;
  if (best.distance > threshold) {
    return {
      grounded: false,
      reason:
        "Retrieved passages are too weakly related to the question to answer safely.",
      chunks,
    };
  }
  return {
    grounded: true,
    chunks,
    citations: toCitations(chunks),
  };
}

export const REFUSAL_MESSAGE =
  "I don't know based on the documents I have. The corpus did not contain enough relevant context to answer confidently.";

export function buildCitedSystemPrompt(citations: Citation[]): string {
  const contextBlocks = citations
    .map(
      (c) =>
        `[${c.rank}] Title: ${c.documentTitle}${c.pageOrSection ? ` (${c.pageOrSection})` : ""}\n${c.snippet}`,
    )
    .join("\n\n");

  return `You are cite-rag, a careful document Q&A assistant.
Answer ONLY using the numbered context passages below.
Cite sources inline with markers like [1], [2] matching the passage numbers.
If the context is insufficient, say you don't know. Never invent sources.

Context:
${contextBlocks}`;
}
