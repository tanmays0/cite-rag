# Quickstart

```bash
pnpm install
docker compose up -d db
cp .env.example .env.local
pnpm db:migrate
pnpm db:seed-demo
pnpm --filter @cite-rag/web dev
```

Sign up or log in, or use **Try it now** on the landing page for a guest session.

Bulk corpus (optional, needs OPENAI_API_KEY):

```bash
pnpm corpus:ingest -- --limit 1000
```
