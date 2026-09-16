import { describe, expect, it } from "vitest";
import { chunkText, estimateTokens } from "./chunk.js";
import {
  DEFAULT_DISTANCE_THRESHOLD,
  applyGroundingGate,
  toCitations,
} from "./retrieve.js";
import type { RetrievedChunk } from "./types.js";

describe("chunkText", () => {
  it("returns empty for blank input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   ")).toEqual([]);
  });

  it("splits long text into overlapping chunks", () => {
    const paragraph = "Alpha beta gamma. ".repeat(200);
    const chunks = chunkText(paragraph, { targetTokens: 80, overlapRatio: 0.1 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]!.chunkIndex).toBe(0);
    expect(chunks[1]!.chunkIndex).toBe(1);
    expect(chunks.every((c) => c.content.length > 0)).toBe(true);
    expect(estimateTokens(chunks[0]!.content)).toBe(chunks[0]!.tokenCount);
  });
});

describe("applyGroundingGate", () => {
  const make = (distance: number): RetrievedChunk => ({
    id: "c1",
    documentId: "d1",
    documentTitle: "Doc",
    content: "Hello world passage about RAG.",
    chunkIndex: 0,
    pageOrSection: "page 1",
    distance,
  });

  it("refuses when no chunks", () => {
    const result = applyGroundingGate([]);
    expect(result.grounded).toBe(false);
  });

  it("refuses when best distance exceeds threshold", () => {
    const result = applyGroundingGate(
      [make(DEFAULT_DISTANCE_THRESHOLD + 0.1)],
      DEFAULT_DISTANCE_THRESHOLD,
    );
    expect(result.grounded).toBe(false);
  });

  it("grounds when distance is within threshold", () => {
    const result = applyGroundingGate(
      [make(0.2), make(0.3)],
      DEFAULT_DISTANCE_THRESHOLD,
    );
    expect(result.grounded).toBe(true);
    if (result.grounded) {
      expect(result.citations).toHaveLength(2);
      expect(toCitations(result.chunks)[0]!.rank).toBe(1);
    }
  });
});
