import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

async function main() {
  // Prefer pooled URL for Supabase (direct host is often IPv6-only / ENOTFOUND).
  const url =
    process.env.DATABASE_URL ||
    process.env.DIRECT_DATABASE_URL ||
    "postgresql://citerag:citerag@localhost:5432/citerag";

  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
  const sql = postgres(url, {
    max: 1,
    prepare: false,
    ssl: isLocal ? false : "require",
  });

  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL,
      password_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_email_uidx ON users (email)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_guest boolean NOT NULL DEFAULT false`;
  await sql`CREATE INDEX IF NOT EXISTS users_guest_created_idx ON users (is_guest, created_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      title text NOT NULL,
      source_type text NOT NULL,
      source_uri text NOT NULL,
      mime text NOT NULL,
      byte_size integer NOT NULL DEFAULT 0,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS documents_source_uri_uidx ON documents (source_uri)`;

  await sql`
    CREATE TABLE IF NOT EXISTS chunks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      chunk_index integer NOT NULL,
      page_or_section text,
      content text NOT NULL,
      token_count integer NOT NULL DEFAULT 0,
      embedding vector(384) NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS chunks_document_id_idx ON chunks (document_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role text NOT NULL,
      content text NOT NULL,
      refused boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS message_citations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      chunk_id uuid NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
      rank integer NOT NULL,
      score real NOT NULL
    )
  `;

  // Free local MiniLM is 384-d; recreate column if an older 1536-d schema exists.
  await sql.unsafe(`
    DO $$
    DECLARE
      dim integer;
    BEGIN
      SELECT atttypmod INTO dim
      FROM pg_attribute a
      JOIN pg_class c ON a.attrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'public' AND c.relname = 'chunks' AND a.attname = 'embedding'
        AND a.attnum > 0 AND NOT a.attisdropped;

      IF dim IS DISTINCT FROM 384 THEN
        DROP INDEX IF EXISTS chunks_embedding_hnsw_idx;
        TRUNCATE TABLE message_citations, messages, conversations, chunks;
        UPDATE documents SET status = 'pending';
        ALTER TABLE chunks ALTER COLUMN embedding TYPE vector(384)
          USING (array_fill(0::float4, ARRAY[384])::vector(384));
      END IF;
    END $$;
  `);

  await sql.unsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'chunks_embedding_hnsw_idx'
      ) THEN
        CREATE INDEX chunks_embedding_hnsw_idx
          ON chunks USING hnsw (embedding vector_cosine_ops);
      END IF;
    END $$;
  `);

  const drizzleDir = join(process.cwd(), "drizzle");
  try {
    const files = readdirSync(drizzleDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files) {
      const body = readFileSync(join(drizzleDir, file), "utf8");
      await sql.unsafe(body);
    }
  } catch {
    // no drizzle folder yet
  }

  console.log("Migrations applied.");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
