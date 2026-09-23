# cite-rag eval scorecard

**Generated:** 2026-09-23T00:29:54.855Z  
**Embedding:** Xenova/all-MiniLM-L6-v2  
**Chunking:** Fixed 512 / 12% (`C`)  
**Fixtures:** citations.txt, rag-intro.txt, rate-limits.txt  
**Dataset:** 30 questions (`evals/questions.jsonl`)  
**Top-k:** 5  
**Config hash:** `3ec05038db93`  
**Distance threshold:** 0.55


## Retrieval Quality

| Metric | Value |
| --- | --- |
| Hit@1 | 90.9% (20/22) |
| Hit@3 | 100.0% (22/22) |
| Hit@5 | 100.0% (22/22) |
| MRR | 0.955 |

## Grounding / Abstention Quality

| Metric | Value |
| --- | --- |
| OOD refusal correctness | 100.0% (8/8) |
| False refusal rate | 36.4% (8/22) |
| Citation presence (gate-pass) | 100.0% (14/14) |

## Reproduce

```bash
pnpm eval
# or full ablation:
pnpm eval:ablation
```
