# Deploy — cite-rag

| | |
| --- | --- |
| Live | https://cite-rag.vercel.app |
| Repo | https://github.com/tanmays0/cite-rag |
| Database | Supabase Postgres + pgvector (384-d) |
| Embeddings | Local MiniLM (default) |
| LLM | Groq `openai/gpt-oss-20b` |

```text
Vercel (apps/web) ──pooler──► Supabase Postgres + pgvector
       ├── Local MiniLM embeddings
       ├── Groq chat
       └── Vercel Blob (optional uploads)
```

## Production environment variables

| Name | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Supabase Transaction pooler (`:6543`) + `?sslmode=require` |
| `DIRECT_DATABASE_URL` | Yes | Session / direct (`:5432`) + `?sslmode=require` |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `AUTH_URL` | Yes | `https://cite-rag.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://cite-rag.vercel.app` |
| `CRON_SECRET` | Yes | Bearer token for `/api/cron/cleanup-guests` (Vercel Cron) |
| `GROQ_API_KEY` | Yes | Chat LLM |
| `EMBEDDING_PROVIDER` | No | Default `local` |
| `EMBEDDING_MODEL` | No | Default `Xenova/all-MiniLM-L6-v2` |
| `OPENAI_API_KEY` | No | Only if `EMBEDDING_PROVIDER=openai` |
| `LLM_MODEL` | No | Default `openai/gpt-oss-20b` |
| `RETRIEVAL_DISTANCE_THRESHOLD` | No | Default `0.55` |
| `CHAT_RATE_LIMIT_PER_MIN` | No | Default `20` |
| `INGEST_RATE_LIMIT_PER_MIN` | No | Default `5` |
| `REGISTER_RATE_LIMIT_PER_HOUR` | No | Default `5` (per IP) |
| `GUEST_RATE_LIMIT_PER_HOUR` | No | Default `3` (per IP; stricter than signup) |
| `LOGIN_RATE_LIMIT_PER_HOUR` | No | Default `30` (credential posts per IP) |
| `LOGIN_FAIL_LIMIT_PER_HOUR` | No | Default `10` (failed attempts per email) |
| `GUEST_TTL_HOURS` | No | Default `48` — guest account retention |
| `MAX_UPLOAD_BYTES` | No | Default `2097152` |
| `BLOB_READ_WRITE_TOKEN` | No | Vercel Blob |
| `DEMO_USER_EMAIL` | No | Optional local seed user (`pnpm db:seed-demo`) |
| `DEMO_USER_PASSWORD` | No | Optional local seed user password |

### Supabase connection strings

1. Project Settings → Database → Connection string  
2. **Session** (`5432`) → `DIRECT_DATABASE_URL`  
3. **Transaction** pooler (`6543`) → `DATABASE_URL`  
4. Replace password; append `?sslmode=require` if missing  

### Vercel

Set the variables above for **Production**, then redeploy. Health check:

```bash
curl -s https://cite-rag.vercel.app/api/health
# {"ok":true,"db":true,"embeddingsConfigured":true,"llmConfigured":true}
```

## Production ingest

```bash
cp .env.production.local.example .env.production.local
# set DATABASE_URL, DIRECT_DATABASE_URL, GROQ_API_KEY
set -a && source .env.production.local && set +a
pnpm db:migrate
pnpm corpus:ingest -- --source synthetic --limit 1000
curl -s https://cite-rag.vercel.app/api/corpus/stats
# documentCount >= 1000
```

Optional batch HTTP ingest (`AUTH_SECRET` / `INGEST_SECRET`):

```bash
SECRET='…'
OFFSET=0
while true; do
  RESP=$(curl -s -X POST https://cite-rag.vercel.app/api/admin/ingest-batch \
    -H "Authorization: Bearer $SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"limit\":1000,\"offset\":$OFFSET,\"batchSize\":15}")
  echo "$RESP"
  OFFSET=$(python3 -c "import json,sys; print(json.load(sys.stdin)['nextOffset'])" <<<"$RESP")
  DONE=$(python3 -c "import json,sys; print(json.load(sys.stdin)['done'])" <<<"$RESP")
  [ "$DONE" = "True" ] && break
done
```

Auth: **Sign up** / **Log in**, or landing **Try it now** (guest session, auto-purged).

Guest cleanup cron: `GET /api/cron/cleanup-guests` with `Authorization: Bearer $CRON_SECRET` (scheduled daily in `vercel.json`).

## Cost (hobby)

| Service | Tier |
| --- | --- |
| Vercel | Hobby |
| Supabase | Free (pgvector) |
| Groq | Free (chat) |
| Embeddings | Free local MiniLM |
| Vercel Blob | Optional |
