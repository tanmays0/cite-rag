# Tasks: cite-rag Product

**Input**: Design documents from `/specs/001-cite-rag-product/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [ ] T001 Create pnpm workspace (`apps/web`, `packages/rag`) and root package.json
- [ ] T002 [P] Add Docker Compose with pgvector/pg16
- [ ] T003 [P] Add .env.example, .gitignore, README skeleton

## Phase 2: Foundational

- [ ] T004 Drizzle schema + migrations for users/documents/chunks/conversations/messages/citations
- [ ] T005 [P] Implement `@cite-rag/rag` chunker
- [ ] T006 [P] Implement embed + retrieve + grounding gate in packages/rag
- [ ] T007 Auth.js credentials + demo user seed
- [ ] T008 Rate limiter utility for chat/ingest
- [ ] T009 Vitest smoke tests for chunk + retrieve helpers

## Phase 3: US1 Citation chat (P1)

- [ ] T010 POST /api/chat retrieve → gate → Groq stream with citations
- [ ] T011 Chat page UI with message stream + citation sidebar
- [ ] T012 Landing + login pages with demo CTA

## Phase 4: US2 Library (P2)

- [ ] T013 GET documents + corpus stats APIs
- [ ] T014 POST /api/ingest PDF/TXT (capped)
- [ ] T015 Library UI browse + upload + doc detail

## Phase 5: US3 Auth polish (P2)

- [ ] T016 Middleware protect /chat /library
- [ ] T017 Demo one-click login button

## Phase 6: US4 Evals & scale (P3)

- [ ] T018 data/scripts ingest-corpus.ts (≥1000 docs)
- [ ] T019 evals/questions.jsonl + runner + scorecard.md
- [ ] T020 /evals page
- [ ] T021 DEPLOY.md + Vercel deploy + seed notes

## Phase 7: Polish

- [ ] T022 Empty/error/refusal states
- [ ] T023 Architecture diagram in README + live URL
