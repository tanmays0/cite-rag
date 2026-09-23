# cite-rag chunking ablation

**Run ID:** `2026-09-23T00-29-47-761Z`  
**Generated:** 2026-09-23T00:29:54.852Z  
**Best chunk config (by MRR, then Hit@5, then Hit@1):** `C` — Fixed 512 / 12%

## Retrieval Quality (chunking)

| Configuration | Hit@1 | Hit@3 | Hit@5 | MRR | ID |
| --- | --- | --- | --- | --- | --- |
| Fixed 640 / 12% | 81.8% | 100.0% | 100.0% | 0.902 | A |
| Fixed 256 / 12% | 90.9% | 100.0% | 100.0% | 0.939 | B |
| Fixed 512 / 12% | 90.9% | 100.0% | 100.0% | 0.955 | C |
| Fixed 1024 / 12% | 90.9% | 100.0% | 100.0% | 0.955 | D |
| Fixed 640 / 0% | 90.9% | 100.0% | 100.0% | 0.955 | E |
| Fixed 640 / 25% | 81.8% | 100.0% | 100.0% | 0.894 | F |
| Semantic ~400–600 / 10% | 90.9% | 100.0% | 100.0% | 0.955 | G |

## Reranking

| Configuration | Hit@1 | Hit@3 | Hit@5 | MRR | Avg latency (ms) |
| --- | --- | --- | --- | --- | --- |
| Best vector (Fixed 512 / 12%) | 90.9% | 100.0% | 100.0% | 0.955 | 2 |
| Best + reranker | 90.9% | 100.0% | 100.0% | 0.955 | 166 |

Reranker model: `Xenova/ms-marco-MiniLM-L-6-v2` (vector top-20 → rerank top-5).


## Grounding / Abstention Quality

Measured on best vector config (`C`):

| Metric | Value |
| --- | --- |
| OOD refusal correctness | 100.0% (8/8) |
| False refusal rate | 36.4% (8/22) |
| Citation presence (gate-pass) | 100.0% (14/14) |

## Reproduce

```bash
pnpm eval:ablation
```

Artifacts: `evals/results/2026-09-23T00-29-47-761Z.json`, this file, and `evals/scorecard.md` (baseline).
