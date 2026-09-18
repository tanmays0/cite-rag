# Feature Specification: cite-rag Product

**Feature Branch**: `001-cite-rag-product`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "Production-style RAG document Q&A: upload/ingest 1000+ docs, chunk+embed, retrieve with citations, chat UI, auth, Docker, evals, live deployed demo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Citation-backed chat (Priority: P1)

A signed-in user asks a question about the corpus. The system retrieves relevant chunks, streams an answer with inline citation markers, and shows a citation sidebar. If retrieval is weak, the system refuses without fabricating sources.

**Why this priority**: Core product value — grounded answers with visible sources.

**Independent Test**: Login → ask a grounded question → see citations; ask an out-of-domain question → see refusal.

**Acceptance Scenarios**:

1. **Given** a seeded corpus and authenticated session, **When** the user asks a question answered by the corpus, **Then** the answer includes citation markers and the sidebar lists source title + snippet.
2. **Given** authenticated session, **When** the user asks something unrelated to the corpus, **Then** the UI shows an insufficient-context refusal with zero fake citations.

---

### User Story 2 - Corpus library & upload (Priority: P2)

A signed-in user browses the 1000+ document corpus, opens a document to see chunks, and optionally uploads a small PDF or TXT that is ingested into their library.

**Why this priority**: Proves real ingest pipeline and scale beyond a toy FAQ.

**Independent Test**: Open `/library`, see doc count ≥1000 (or demo seed), upload a TXT, see it appear after ingest.

**Acceptance Scenarios**:

1. **Given** authenticated session, **When** user opens Library, **Then** they see corpus stats and a browsable document list.
2. **Given** authenticated session, **When** user uploads a valid TXT/PDF under size limit, **Then** the file is chunked, embedded, indexed, and queryable.
3. **Given** rate-limit exhaustion, **When** user uploads again, **Then** they receive 429 with Retry-After style headers.

---

### User Story 3 - Auth & gated demo (Priority: P2)

Visitors can sign up with email/password, log in, or use a one-click guest session. Chat and upload require a session.


**Why this priority**: Shows the app is not an uncapped public free-for-all.

**Independent Test**: Unauthenticated `/chat` redirects to login; demo login succeeds.

**Acceptance Scenarios**:

1. **Given** no session, **When** visiting `/chat` or `/library`, **Then** redirect to `/login`.
2. **Given** a guest CTA, **When** clicking Try it now, **Then** an isolated guest session is created and chat is available.
3. **Given** a new visitor, **When** signing up with email/password, **Then** a persistent account is created with an isolated library.

---

### User Story 4 - Evals & reproducibility (Priority: P3)

An engineer can read published eval scores and reproduce the local stack via Docker Compose + README ingest instructions.

**Why this priority**: Measurable quality and reproducible setup.

**Independent Test**: Open `/evals` or `evals/scorecard.md`; run Compose; run ingest script docs.

**Acceptance Scenarios**:

1. **Given** the repo, **When** reading `evals/scorecard.md`, **Then** hit-rate@k, citation presence, and refusal metrics are present.
2. **Given** Docker available, **When** following README Compose steps, **Then** local app starts against pgvector.

### Edge Cases

- Empty corpus / cold Neon wake → health endpoint and friendly empty states.
- Corrupt PDF / scanned image PDF → soft fail with clear error.
- Oversized upload → reject before processing.
- Embedding/LLM API failures → user-visible error, no partial fake citations.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST ingest TXT and PDF into chunks with embeddings stored in pgvector.
- **FR-002**: System MUST retrieve top-k chunks for a query and apply a grounding score gate.
- **FR-003**: System MUST stream LLM answers with inline citations mapped to retrieved chunks.
- **FR-004**: System MUST refuse when retrieval is insufficient.
- **FR-005**: System MUST support ≥1000 documents via offline corpus ingest CLI.
- **FR-006**: System MUST authenticate users (credentials signup/login + guest sessions) and rate-limit chat/upload/guest/signup.
- **FR-007**: System MUST expose chat UI, library UI, landing, login, and evals scorecard.
- **FR-008**: System MUST provide Docker Compose for local full stack.
- **FR-009**: System MUST publish retrieval eval scorecard under `evals/`.
- **FR-010**: System MUST deploy a public HTTPS demo on free-tier hosting.

### Key Entities

- **User**: email + password hash; owns uploads and conversations.
- **Document**: title, source type (corpus|upload), mime, status, optional owner.
- **Chunk**: text, index, page/section, embedding vector(1536).
- **Conversation / Message / Citation**: chat history with ranked chunk citations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: ≥1000 documents ingested and documented in README.
- **SC-002**: Grounded answers show ≥1 citation when sources used.
- **SC-003**: Out-of-corpus questions refuse without fabricated citations.
- **SC-004**: Eval scorecard published with hit-rate@k and refusal metrics.
- **SC-005**: Public HTTPS demo URL live; Docker Compose boots locally.
- **SC-006**: Recruiter demo path (login → grounded Q → citations → OOD refuse) completable in <3 minutes.
