/**
 * Offline corpus ingest for cite-rag.
 *
 * Modes:
 *   --source wiki       Fetch Simple English Wikipedia (default, needs network)
 *   --source synthetic  Ingest data/corpus/synthetic/*.txt (run generate-synthetic-corpus.mjs first)
 *
 * Usage:
 *   pnpm corpus:ingest -- --limit 1000
 *   pnpm corpus:ingest -- --source synthetic --limit 1000
 *   pnpm corpus:ingest -- --limit 50 --skip-embed
 */

import { createHash } from "node:crypto";
import { mkdir, writeFile, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import { chunkText } from "../../packages/rag/src/chunk.ts";
import {
  LOCAL_EMBEDDING_DIM,
  embedLocalMany,
} from "../../packages/rag/src/embed-local.ts";

const LIMIT = Number(
  process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ||
    process.argv[process.argv.indexOf("--limit") + 1] ||
    1000,
);
const SKIP_EMBED = process.argv.includes("--skip-embed");
const SOURCE =
  process.argv.find((a) => a.startsWith("--source="))?.split("=")[1] ||
  (process.argv.includes("--source")
    ? process.argv[process.argv.indexOf("--source") + 1]
    : "wiki");
const CACHE_DIR = join(process.cwd(), "../../data/corpus");

type CorpusDoc = { title: string; text: string; sourceUri: string };

async function fetchRandomPages(n: number): Promise<CorpusDoc[]> {
  const out: CorpusDoc[] = [];
  const seen = new Set<number>();
  while (out.length < n) {
    const batch = Math.min(50, n - out.length);
    const listUrl =
      `https://simple.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
      `&list=random&rnnamespace=0&rnlimit=${batch}`;
    const listRes = await fetch(listUrl, {
      headers: { "User-Agent": "cite-rag-ingest/0.1 (portfolio demo)" },
    });
    if (!listRes.ok) throw new Error(`Wiki list failed: ${listRes.status}`);
    const listJson = (await listRes.json()) as {
      query: { random: Array<{ id: number; title: string }> };
    };
    const ids = listJson.query.random
      .map((r) => r.id)
      .filter((id) => !seen.has(id));
    ids.forEach((id) => seen.add(id));
    if (!ids.length) continue;

    const extractUrl =
      `https://simple.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
      `&prop=extracts&explaintext=1&exintro=0&redirects=1` +
      `&pageids=${ids.join("|")}`;
    const exRes = await fetch(extractUrl, {
      headers: { "User-Agent": "cite-rag-ingest/0.1 (portfolio demo)" },
    });
    if (!exRes.ok) throw new Error(`Wiki extract failed: ${exRes.status}`);
    const exJson = (await exRes.json()) as {
      query: { pages: Record<string, { pageid: number; title: string; extract?: string }> };
    };
    for (const page of Object.values(exJson.query.pages)) {
      const extract = (page.extract || "").trim();
      if (extract.length < 120) continue;
      out.push({
        title: page.title,
        text: extract,
        sourceUri: `simplewiki://${page.pageid}`,
      });
      if (out.length >= n) break;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return out.slice(0, n);
}

async function loadSynthetic(n: number): Promise<CorpusDoc[]> {
  const dir = join(CACHE_DIR, "synthetic");
  const files = (await readdir(dir))
    .filter((f) => f.endsWith(".txt") && f !== "README.txt")
    .sort()
    .slice(0, n);
  const docs: CorpusDoc[] = [];
  for (const file of files) {
    const text = await readFile(join(dir, file), "utf8");
    const titleLine = text.split("\n").find((l) => l.startsWith("# "));
    docs.push({
      title: titleLine?.replace(/^#\s+/, "") || file,
      text,
      sourceUri: `synthetic://${file}`,
    });
  }
  return docs;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  // Default: free local MiniLM (no API key). Optional paid OpenAI via EMBEDDING_PROVIDER=openai.
  const provider = (process.env.EMBEDDING_PROVIDER || "local").toLowerCase();
  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY required when EMBEDDING_PROVIDER=openai");
    const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, input: texts }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI embeddings failed: ${res.status} ${body}`);
    }
    const json = (await res.json()) as {
      data: Array<{ embedding: number[]; index: number }>;
    };
    return json.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  }
  return embedLocalMany(texts);
}

async function main() {
  // Prefer pooled URL for Supabase (direct host is often IPv6-only / ENOTFOUND).
  const url =
    process.env.DATABASE_URL ||
    process.env.DIRECT_DATABASE_URL ||
    "postgresql://citerag:citerag@localhost:5432/citerag";
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
  const sql = postgres(url, {
    max: 1,
    prepare: false, // required for Supabase transaction pooler
    ssl: isLocal ? false : "require",
    connect_timeout: 30,
  });

  await mkdir(CACHE_DIR, { recursive: true });
  console.log(`Loading corpus source=${SOURCE} limit=${LIMIT}…`);
  const pages =
    SOURCE === "synthetic"
      ? await loadSynthetic(LIMIT)
      : await fetchRandomPages(LIMIT);
  console.log(`Loaded ${pages.length} documents.`);
  await writeFile(
    join(CACHE_DIR, "manifest.json"),
    JSON.stringify(
      pages.map((p) => ({
        sourceUri: p.sourceUri,
        title: p.title,
        chars: p.text.length,
      })),
      null,
      2,
    ),
  );

  let ingested = 0;
  let skipped = 0;

  for (const page of pages) {
    const sourceUri = page.sourceUri;
    const existing = await sql`
      SELECT id, status FROM documents WHERE source_uri = ${sourceUri} LIMIT 1
    `;
    if (existing[0]?.status === "ready") {
      skipped += 1;
      continue;
    }

    let docId = existing[0]?.id as string | undefined;
    if (!docId) {
      const inserted = await sql`
        INSERT INTO documents (title, source_type, source_uri, mime, byte_size, status)
        VALUES (
          ${page.title},
          'corpus',
          ${sourceUri},
          'text/plain',
          ${Buffer.byteLength(page.text)},
          'pending'
        )
        RETURNING id
      `;
      docId = inserted[0]!.id as string;
    } else {
      await sql`DELETE FROM chunks WHERE document_id = ${docId}`;
    }

    const parts = chunkText(page.text);
    if (!parts.length) {
      await sql`UPDATE documents SET status = 'failed' WHERE id = ${docId}`;
      continue;
    }

    if (SKIP_EMBED) {
      const dim = Number(process.env.EMBEDDING_DIM || LOCAL_EMBEDDING_DIM);
      const zero = `[${Array.from({ length: dim }, () => 0).join(",")}]`;
      for (const part of parts) {
        await sql`
          INSERT INTO chunks (document_id, chunk_index, page_or_section, content, token_count, embedding)
          VALUES (
            ${docId},
            ${part.chunkIndex},
            ${part.pageOrSection},
            ${part.content},
            ${part.tokenCount},
            ${zero}::vector
          )
        `;
      }
    } else {
      const batchSize = 32;
      for (let i = 0; i < parts.length; i += batchSize) {
        const batch = parts.slice(i, i + batchSize);
        const embeddings = await embedBatch(batch.map((p) => p.content));
        for (let j = 0; j < batch.length; j++) {
          const part = batch[j]!;
          const vec = `[${embeddings[j]!.join(",")}]`;
          await sql`
            INSERT INTO chunks (document_id, chunk_index, page_or_section, content, token_count, embedding)
            VALUES (
              ${docId},
              ${part.chunkIndex},
              ${part.pageOrSection},
              ${part.content},
              ${part.tokenCount},
              ${vec}::vector
            )
          `;
        }
      }
    }

    await sql`UPDATE documents SET status = 'ready' WHERE id = ${docId}`;
    ingested += 1;
    if (ingested % 25 === 0) {
      console.log(`Progress: ingested=${ingested} skipped=${skipped}`);
    }
  }

  const hash = createHash("sha256")
    .update(pages.map((p) => p.sourceUri).join(","))
    .digest("hex")
    .slice(0, 12);
  console.log(
    `Done. ingested=${ingested} skipped=${skipped} total=${pages.length} run=${hash}`,
  );
  console.log(
    "Reproduce wiki (free local embeddings): pnpm corpus:ingest -- --limit 1000",
  );
  console.log(
    "Reproduce synthetic: node data/scripts/generate-synthetic-corpus.mjs --limit 1000 && pnpm corpus:ingest -- --source synthetic --limit 1000",
  );
  await sql.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
