# cite-rag Constitution

## Core Principles

### I. Citation Honesty (NON-NEGOTIABLE)
Every answer that uses retrieved sources MUST show citations (source title + chunk/page or link).
When retrieval is weak or empty, the system MUST refuse with an explicit insufficient-context message.
Silent hallucination is forbidden: never invent sources or cite chunks that were not retrieved.

### II. Real Retrieval Over Prompt Theater
cite-rag is a production-style RAG product: load → chunk → embed → index → retrieve → answer.
Prompt-only demos are out of scope. Vector search and grounding gates are required.

### III. Free-Tier Deployability
Hobby-tier hosting (Vercel + Supabase/Neon + Groq; local MiniLM or capped OpenAI embeddings).
Bulk ingest of 1000+ docs MUST run as an offline CLI, never as a long-lived serverless HTTP job.
Document cost and reproduce steps in README / DEPLOY.md.

### IV. Evals as Proof
Published retrieval evals (hit-rate@k, citation presence, refusal correctness) live under `evals/`
with a scorecard in the repo. Claims about quality without numbers are incomplete.

### V. Product UX First
Ship a real chat UI with corpus browser, citation sidebar, auth, and rate limits — not a lab console alone.

## Constraints

- Stack locked for v1: Next.js App Router, Postgres + pgvector, local MiniLM (optional OpenAI) embeddings,
  Groq LLM, Auth.js credentials, Docker Compose for local full stack.
- Out of scope v1: fine-tuning, multi-tenant SSO, native mobile, custom vector DB.
- Secrets never committed. Git author is Tanmay Shinde only.

## Development Workflow

1. Spec Kit first: constitution → specify → plan → tasks → implement → converge.
2. Tests for chunking + retrieval smoke (Vitest); eval harness for labeled quiz set.
3. Public HTTPS demo required before calling the project done.

## Governance

This constitution supersedes informal preferences when they conflict.
Amendments require updating this file and noting the date.
All implementation plans and PRs must pass the Constitution Check gates.

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
