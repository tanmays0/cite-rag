import { describe, expect, it } from "vitest";
import {
  chunkText,
  chunkTextSemantic,
  estimateTokens,
  findChunkEnd,
  snapToWordStart,
  splitSemanticUnits,
} from "./chunk.js";
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

  it("does not split tokens mid-word at chunk boundaries", () => {
    const words = Array.from({ length: 400 }, (_, i) => `token${i}`);
    const text = words.join(" ");
    const chunks = chunkText(text, { targetTokens: 50, overlapRatio: 0.2 });
    expect(chunks.length).toBeGreaterThan(2);

    for (const chunk of chunks) {
      for (const part of chunk.content.split(/\s+/).filter(Boolean)) {
        expect(part).toMatch(/^token\d+$/);
      }
    }
  });

  it("snaps overlap starts to word boundaries", () => {
    const text = "alpha beta gamma delta epsilon zeta eta theta";
    expect(snapToWordStart(text, 0)).toBe(0);
    expect(snapToWordStart(text, 8)).toBe(6); // mid "beta" → start of beta
    expect(snapToWordStart(text, 6)).toBe(6); // already at word start
  });

  it("findChunkEnd prefers sentence or word breaks", () => {
    const text = "Short intro. " + "word ".repeat(200) + "Tail sentence ends here.";
    const end = findChunkEnd(text, 0, 120);
    expect(end).toBeLessThanOrEqual(120);
    expect(text[end - 1]).toMatch(/[\s.]/);
  });
});

describe("chunkTextSemantic", () => {
  it("packs paragraph units toward the token budget", () => {
    const paragraphs = Array.from(
      { length: 12 },
      (_, i) => `Paragraph ${i}. ` + "word ".repeat(80),
    ).join("\n\n");
    const chunks = chunkTextSemantic(paragraphs, {
      targetTokensMin: 200,
      targetTokensMax: 400,
      overlapRatio: 0.1,
    });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.content.length > 0)).toBe(true);
    expect(chunks[0]!.chunkIndex).toBe(0);
  });

  it("splitSemanticUnits prefers paragraphs then sentences", () => {
    const text = "First para.\n\nSecond para is longer. It has two sentences.";
    const units = splitSemanticUnits(text);
    expect(units.length).toBeGreaterThanOrEqual(2);
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
