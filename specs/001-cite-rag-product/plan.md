# Implementation Plan: cite-rag Product

**Branch**: `001-cite-rag-product` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-cite-rag-product/spec.md`

## Summary

Build a monolithic Next.js RAG product: Neon pgvector for vectors, OpenAI embeddings, Groq for answers, Auth.js credentials, citation chat UI, offline 1000+ corpus ingest, evals, Docker Compose, Vercel deploy.

## Technical Context

**Language/Version**: TypeScript 5.x / Node 20+

**Primary Dependencies**: Next.js 15 App Router, AI SDK, Auth.js v5, Drizzle ORM, Tailwind CSS v4, Vitest

**Storage**: Neon Postgres + pgvector (1536-dim); Vercel Blob for uploads; local volume in Docker

**Testing**: Vitest (chunk + retrieve smoke); eval harness under `evals/`

**Target Platform**: Web (Vercel serverless Node runtime) + local Docker

**Project Type**: Monorepo web app (`apps/web` + `packages/rag`)

**Performance Goals**: Chat TTFT acceptable on free tiers; ingest offline only

**Constraints**: Vercel timeouts → no bulk HTTP ingest; free-tier cost caps documented

**Scale/Scope**: ≥1000 docs; single demo tenant; production-style chat UI

## Constitution Check

- Citation honesty: grounding gate + refuse path — PASS (designed)
- Real retrieval: chunk/embed/pgvector — PASS
- Free-tier deploy: Vercel + Neon + Groq — PASS
- Evals as proof: `evals/scorecard.md` — PASS
- Product UX: chat + library + auth — PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-cite-rag-product/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
apps/web/                 # Next.js UI + API routes
packages/rag/             # chunk, embed, retrieve, cite, eval
data/scripts/             # corpus download + ingest CLI
data/fixtures/            # tiny TXT samples for CI
evals/                    # questions.jsonl + scorecard.md
docker-compose.yml
README.md
DEPLOY.md
```

## Complexity Tracking

No unjustified complexity. Single Next.js deploy path (no FastAPI split) by design.
