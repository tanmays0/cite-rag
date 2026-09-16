# Research: cite-rag

## Decision: Monolithic Next.js over FastAPI split

- **Rationale**: One deploy target (Vercel), shared types, matches LimitLab web polish path.
- **Alternatives considered**: FastAPI + separate UI — rejected for v1 complexity on free tiers.

## Decision: Neon + pgvector

- **Rationale**: Single Postgres for metadata + vectors; free tier includes pgvector; pooled connections for serverless.
- **Alternatives**: Pinecone / Chroma / Upstash Vector — extra vendor and cost for v1.

## Decision: OpenAI text-embedding-3-small + Groq LLM

- **Rationale**: Stable 1536-dim embeddings; Groq free tier for chat answers; env-configurable models.
- **Cost**: One-time corpus embed; query embeds cheap; chat on Groq free quota.

## Decision: Auth.js credentials + demo user

- **Rationale**: Enough to gate demo without SSO scope creep.
- **Alternatives**: Clerk / Supabase Auth — extra accounts; Magic link deferred.

## Decision: Offline CLI for 1000+ ingest

- **Rationale**: Vercel serverless timeouts cannot process bulk embed+insert.
- **Corpus**: Public Simple English Wikipedia articles or Project Gutenberg subsets as discrete docs.

## Decision: Cosine distance grounding gate

- **Rationale**: If best chunk distance exceeds threshold (or no rows), refuse without calling LLM with fake context (or call LLM only to phrase refusal with empty citations).
