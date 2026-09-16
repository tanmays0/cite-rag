# cite-rag eval scorecard

**Generated:** 2026-09-15T21:46:31.754Z  
**Corpus:** 1003 documents (1000 synthetic + 3 fixtures)  
**Top-k:** 6  
**Embedding (this run):** deterministic-hash fallback (CI / offline smoke)

## Metrics

| Metric | Value | Notes |
| --- | --- | --- |
| Retrieval hit-rate@6 | 0.0% (0/22) | Hash embeddings do not rank nearest neighbors meaningfully |
| Citation presence | 0.0% (0/22) | Requires grounded gate pass |
| Refusal correctness (OOD) | **100.0% (8/8)** | Out-of-corpus questions correctly refused |

## Reproduce

```bash
pnpm db:migrate && pnpm db:seed-demo
pnpm corpus:ingest -- --source synthetic --limit 1000
pnpm eval
```

For retrieval hit-rate, run eval against a MiniLM- or OpenAI-embedded corpus (`EMBEDDING_PROVIDER=local` or `openai`).
