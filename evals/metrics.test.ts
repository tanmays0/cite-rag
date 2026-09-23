import { describe, expect, it } from "vitest";
import { CHUNK_CONFIGS } from "./configs.ts";
import {
  aggregateGrounding,
  aggregateRetrieval,
  firstRelevantRank,
  hitAtK,
  reciprocalRank,
} from "./metrics.ts";
import type { CaseEvidence } from "./types.ts";

function caseEv(
  partial: Partial<CaseEvidence> & Pick<CaseEvidence, "id" | "type">,
): CaseEvidence {
  return {
    question: partial.question ?? "q",
    expectedSourceUri: partial.expectedSourceUri ?? "fixture://a.txt",
    retrievedSourceUris: partial.retrievedSourceUris ?? [],
    retrievedChunkIds: partial.retrievedChunkIds ?? [],
    retrievedChunkIndexes: partial.retrievedChunkIndexes ?? [],
    distances: partial.distances ?? [],
    firstRelevantRank: partial.firstRelevantRank ?? null,
    hitAt1: partial.hitAt1 ?? false,
    hitAt3: partial.hitAt3 ?? false,
    hitAt5: partial.hitAt5 ?? false,
    gatePassed: partial.gatePassed ?? false,
    citationCount: partial.citationCount ?? 0,
    latencyMs: partial.latencyMs ?? 0,
    ...partial,
  };
}

describe("retrieval metrics", () => {
  it("computes firstRelevantRank as 1-based", () => {
    expect(firstRelevantRank(["x", "y"], "y")).toBe(2);
    expect(firstRelevantRank(["x"], "z")).toBeNull();
  });

  it("hitAtK and reciprocalRank", () => {
    expect(hitAtK(1, 1)).toBe(true);
    expect(hitAtK(2, 1)).toBe(false);
    expect(hitAtK(3, 5)).toBe(true);
    expect(reciprocalRank(2)).toBeCloseTo(0.5);
    expect(reciprocalRank(null)).toBe(0);
  });

  it("aggregates Hit@k and MRR over grounded cases", () => {
    const cases = [
      caseEv({
        id: "1",
        type: "grounded",
        firstRelevantRank: 1,
        hitAt1: true,
        hitAt3: true,
        hitAt5: true,
      }),
      caseEv({
        id: "2",
        type: "grounded",
        firstRelevantRank: 3,
        hitAt1: false,
        hitAt3: true,
        hitAt5: true,
      }),
      caseEv({ id: "3", type: "ood", firstRelevantRank: null }),
    ];
    const agg = aggregateRetrieval(cases);
    expect(agg.groundedCount).toBe(2);
    expect(agg.hitAt1Rate).toBeCloseTo(0.5);
    expect(agg.hitAt3Rate).toBeCloseTo(1);
    expect(agg.mrr).toBeCloseTo((1 + 1 / 3) / 2);
  });
});

describe("grounding metrics", () => {
  it("separates OOD refusal from false refusal", () => {
    const cases = [
      caseEv({ id: "g1", type: "grounded", gatePassed: true, citationCount: 2 }),
      caseEv({ id: "g2", type: "grounded", gatePassed: false, citationCount: 0 }),
      caseEv({ id: "o1", type: "ood", gatePassed: false }),
      caseEv({ id: "o2", type: "ood", gatePassed: true }),
    ];
    const g = aggregateGrounding(cases);
    expect(g.oodRefusalRate).toBeCloseTo(0.5);
    expect(g.falseRefusalRate).toBeCloseTo(0.5);
    expect(g.citationPresenceRate).toBeCloseTo(1);
  });
});

describe("chunk configs", () => {
  it("defines A–G with expected strategies", () => {
    expect(CHUNK_CONFIGS.map((c) => c.id)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
    ]);
    expect(CHUNK_CONFIGS.find((c) => c.id === "G")?.strategy).toBe("semantic");
    expect(CHUNK_CONFIGS.find((c) => c.id === "A")?.targetTokens).toBe(640);
    expect(CHUNK_CONFIGS.find((c) => c.id === "E")?.overlapRatio).toBe(0);
  });
});
