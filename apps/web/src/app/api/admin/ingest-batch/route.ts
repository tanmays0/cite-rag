/**
 * Batch corpus seed for production (free local MiniLM by default).
 * Protected by INGEST_SECRET (or AUTH_SECRET fallback).
 *
 * POST /api/admin/ingest-batch
 * Headers: Authorization: Bearer <INGEST_SECRET>
 * Body: { "limit"?: number, "offset"?: number, "batchSize"?: number }
 */
import { chunkText } from "@cite-rag/rag";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { chunks, documents } from "@/db/schema";
import { embedTexts } from "@/lib/embeddings";

export const runtime = "nodejs";
export const maxDuration = 60;

const TOPICS = [
  "retrieval",
  "embeddings",
  "pgvector",
  "chunking",
  "citations",
  "grounding",
  "rate limits",
  "auth sessions",
  "document upload",
  "PDF parsing",
  "eval harness",
  "hit rate",
  "refusal",
  "Neon",
  "Groq",
  "OpenAI",
  "Next.js",
  "Docker Compose",
  "token bucket",
  "HNSW index",
  "cosine distance",
  "demo tenant",
  "corpus scale",
];

const SEEDS = [
  "Retrieval-Augmented Generation (RAG) combines a search step with a language model. Documents are split into chunks, each chunk is embedded into a vector, and those vectors are stored in a vector index such as pgvector. At query time the user question is embedded with the same model, the nearest chunks are retrieved, and the language model answers using only that context.",
  "Inline citations link each claim in an answer back to a retrieved chunk. A citation should include the source document title and a page or section when available. If retrieval scores are weak, the assistant must refuse rather than invent sources.",
  "Rate limiting protects chat and upload endpoints from abuse on free-tier demos. cite-rag uses an in-app token bucket. When a client exceeds the per-minute budget, the API returns HTTP 429 with Retry-After.",
];

function authorized(req: Request): boolean {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const secret = process.env.INGEST_SECRET || process.env.AUTH_SECRET;
  return Boolean(secret && token && token === secret);
}

function makeDoc(i: number): { title: string; text: string; sourceUri: string } {
  const topic = TOPICS[i % TOPICS.length]!;
  const seed = SEEDS[i % SEEDS.length]!;
  const title = `${topic} notes ${i + 1}`;
  const text = `# ${title}\n\nArticle ${i + 1} in the cite-rag synthetic corpus.\nTopic focus: ${topic}.\n\n${seed}\n\nUnique marker: SYNTH-${String(i + 1).padStart(4, "0")}\n`;
  return { title, text, sourceUri: `synthetic://doc-${String(i + 1).padStart(4, "0")}.txt` };
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    limit?: number;
    offset?: number;
    batchSize?: number;
  };
  const limit = Math.min(Math.max(Number(body.limit) || 1000, 1), 5000);
  const offset = Math.max(Number(body.offset) || 0, 0);
  const batchSize = Math.min(Math.max(Number(body.batchSize) || 15, 1), 25);
  const end = Math.min(offset + batchSize, limit);

  let ingested = 0;
  let skipped = 0;

  for (let i = offset; i < end; i++) {
    const doc = makeDoc(i);
    const existing = await db
      .select()
      .from(documents)
      .where(eq(documents.sourceUri, doc.sourceUri))
      .limit(1);
    if (existing[0]?.status === "ready") {
      skipped += 1;
      continue;
    }

    let documentId = existing[0]?.id;
    if (!documentId) {
      const [row] = await db
        .insert(documents)
        .values({
          title: doc.title,
          sourceType: "corpus",
          sourceUri: doc.sourceUri,
          mime: "text/plain",
          byteSize: Buffer.byteLength(doc.text),
          status: "pending",
        })
        .returning();
      documentId = row!.id;
    } else {
      await db.delete(chunks).where(eq(chunks.documentId, documentId));
    }

    const parts = chunkText(doc.text);
    if (!parts.length) {
      await db
        .update(documents)
        .set({ status: "failed" })
        .where(eq(documents.id, documentId));
      continue;
    }

    const embeddings = await embedTexts(parts.map((p) => p.content));
    for (let j = 0; j < parts.length; j++) {
      const part = parts[j]!;
      await db.insert(chunks).values({
        documentId,
        chunkIndex: part.chunkIndex,
        pageOrSection: part.pageOrSection,
        content: part.content,
        tokenCount: part.tokenCount,
        embedding: embeddings[j]!,
      });
    }
    await db
      .update(documents)
      .set({ status: "ready" })
      .where(eq(documents.id, documentId));
    ingested += 1;
  }

  const nextOffset = end;
  const done = nextOffset >= limit;
  return NextResponse.json({
    ingested,
    skipped,
    offset,
    nextOffset,
    limit,
    done,
  });
}
