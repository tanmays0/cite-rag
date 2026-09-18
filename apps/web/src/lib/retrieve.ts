import {
  DEFAULT_DISTANCE_THRESHOLD,
  DEFAULT_TOP_K,
  type RetrievedChunk,
} from "@cite-rag/rag";
import { sql } from "@/db";
import { embedQuery } from "./embeddings";

/**
 * Retrieve from shared corpus plus the caller's own uploads only.
 * Other users' uploads never enter the context window.
 */
export async function retrieveTopK(
  query: string,
  k: number = DEFAULT_TOP_K,
  ownerUserId?: string,
): Promise<RetrievedChunk[]> {
  const embedding = await embedQuery(query);
  const vectorLiteral = `[${embedding.join(",")}]`;

  const rows = ownerUserId
    ? await sql`
        SELECT
          c.id,
          c.document_id AS "documentId",
          d.title AS "documentTitle",
          c.content,
          c.chunk_index AS "chunkIndex",
          c.page_or_section AS "pageOrSection",
          (c.embedding <=> ${vectorLiteral}::vector) AS distance
        FROM chunks c
        INNER JOIN documents d ON d.id = c.document_id
        WHERE d.status = 'ready'
          AND (
            d.source_type = 'corpus'
            OR d.owner_user_id = ${ownerUserId}::uuid
          )
        ORDER BY c.embedding <=> ${vectorLiteral}::vector
        LIMIT ${k}
      `
    : await sql`
        SELECT
          c.id,
          c.document_id AS "documentId",
          d.title AS "documentTitle",
          c.content,
          c.chunk_index AS "chunkIndex",
          c.page_or_section AS "pageOrSection",
          (c.embedding <=> ${vectorLiteral}::vector) AS distance
        FROM chunks c
        INNER JOIN documents d ON d.id = c.document_id
        WHERE d.status = 'ready'
          AND d.source_type = 'corpus'
        ORDER BY c.embedding <=> ${vectorLiteral}::vector
        LIMIT ${k}
      `;

  return rows.map((row) => ({
    id: String(row.id),
    documentId: String(row.documentId),
    documentTitle: String(row.documentTitle),
    content: String(row.content),
    chunkIndex: Number(row.chunkIndex),
    pageOrSection: row.pageOrSection ? String(row.pageOrSection) : null,
    distance: Number(row.distance),
  }));
}

export function retrievalThreshold(): number {
  const raw = process.env.RETRIEVAL_DISTANCE_THRESHOLD;
  if (!raw) return DEFAULT_DISTANCE_THRESHOLD;
  const n = Number(raw);
  return Number.isFinite(n) ? n : DEFAULT_DISTANCE_THRESHOLD;
}
