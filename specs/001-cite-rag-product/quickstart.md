# Quickstart

```bash
pnpm install
docker compose up -d db
cp .env.example .env.local
pnpm db:migrate
pnpm db:seed-demo
pnpm --filter @cite-rag/web dev
```

Sign in with the demo account, then open Chat.

Bulk corpus (optional, needs OPENAI_API_KEY):

```bash
pnpm corpus:ingest -- --limit 1000
```
