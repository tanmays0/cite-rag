import { describe, expect, it } from "vitest";
import { applyRerankScores } from "./rerank.js";

describe("applyRerankScores", () => {
  it("orders by score descending and truncates to topK", () => {
    const candidates = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const scores = new Map([
      ["a", 0.2],
      ["b", 0.9],
      ["c", 0.5],
    ]);
    const out = applyRerankScores(candidates, scores, 2);
    expect(out.map((x) => x.id)).toEqual(["b", "c"]);
  });

  it("treats missing scores as zero", () => {
    const candidates = [{ id: "x" }, { id: "y" }];
    const scores = new Map([["y", 1]]);
    const out = applyRerankScores(candidates, scores, 2);
    expect(out[0]!.id).toBe("y");
  });
});
