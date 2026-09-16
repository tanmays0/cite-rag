# API Contracts

## POST /api/chat

Auth required. Rate limited.

Request:
```json
{ "messages": [{ "role": "user", "content": "..." }], "conversationId": "optional-uuid" }
```

Response: AI SDK data stream with text + citation metadata annotation when grounded; refusal JSON path when gate fails.

Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` on 429.

## GET /api/documents

Auth required. Query: `?q=&limit=&cursor=`

Response: `{ documents: [...], total: number }`

## GET /api/documents/:id

Auth required. Document metadata + chunk previews (no embeddings).

## POST /api/ingest

Auth required. Rate limited. multipart `file` (PDF|TXT, max 2MB).

Response: `{ documentId, status }` or 4xx error.

## GET /api/health

Public. `{ ok, db, embeddingsConfigured, llmConfigured }`

## GET /api/corpus/stats

Auth optional for landing teaser; preferred auth. `{ documentCount, chunkCount }`

## Auth

NextAuth credentials at `/api/auth/[...nextauth]` — email/password + demo seed.
