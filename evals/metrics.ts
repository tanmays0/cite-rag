import type {
  CaseEvidence,
  GroundingAggregates,
  RetrievalAggregates,
} from "./types.ts";

/** 1-based rank of first retrieved item whose source matches expected, or null. */
export function firstRelevantRank(
  retrievedSourceUris: string[],
  expectedSourceUri: string | null,
): number | null {
  if (!expectedSourceUri) return null;
  const idx = retrievedSourceUris.findIndex((u) => u === expectedSourceUri);
  return idx === -1 ? null : idx + 1;
}

export function hitAtK(rank: number | null, k: number): boolean {
  return rank !== null && rank <= k;
}

/** Reciprocal rank: 1/rank, or 0 if no hit. */
export function reciprocalRank(rank: number | null): number {
  if (rank === null || rank < 1) return 0;
  return 1 / rank;
}

export function aggregateRetrieval(cases: CaseEvidence[]): RetrievalAggregates {
  const grounded = cases.filter((c) => c.type === "grounded");
  const n = grounded.length;
  let hit1 = 0;
  let hit3 = 0;
  let hit5 = 0;
  let mrrSum = 0;
  for (const c of grounded) {
    if (c.hitAt1) hit1 += 1;
    if (c.hitAt3) hit3 += 1;
    if (c.hitAt5) hit5 += 1;
    mrrSum += reciprocalRank(c.firstRelevantRank);
  }
  return {
    groundedCount: n,
    hitAt1: hit1,
    hitAt3: hit3,
    hitAt5: hit5,
    mrr: n ? mrrSum / n : 0,
    hitAt1Rate: n ? hit1 / n : 0,
    hitAt3Rate: n ? hit3 / n : 0,
    hitAt5Rate: n ? hit5 / n : 0,
  };
}

export function aggregateGrounding(cases: CaseEvidence[]): GroundingAggregates {
  const grounded = cases.filter((c) => c.type === "grounded");
  const ood = cases.filter((c) => c.type === "ood");
  const oodRefused = ood.filter((c) => !c.gatePassed).length;
  const falseRefusals = grounded.filter((c) => !c.gatePassed).length;
  const gatePass = grounded.filter((c) => c.gatePassed);
  const citationPresent = gatePass.filter((c) => c.citationCount > 0).length;
  return {
    oodCount: ood.length,
    oodRefusedCorrectly: oodRefused,
    oodRefusalRate: ood.length ? oodRefused / ood.length : 0,
    falseRefusals,
    falseRefusalRate: grounded.length ? falseRefusals / grounded.length : 0,
    groundedGatePass: gatePass.length,
    citationPresent,
    citationPresenceRate: gatePass.length
      ? citationPresent / gatePass.length
      : 0,
  };
}

export function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function fmtMrr(mrr: number): string {
  return mrr.toFixed(3);
}
