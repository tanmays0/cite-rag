import { chunkPages, chunkText } from "@cite-rag/rag";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chunks, documents } from "@/db/schema";
import { embedTexts } from "./embeddings";
import { parseUpload } from "./parse";

export async function ingestBuffer(params: {
  buffer: Buffer;
  title: string;
  sourceUri: string;
  sourceType: "corpus" | "upload";
  mime: string;
  ownerUserId?: string | null;
}): Promise<{ documentId: string }> {
  const existing = await db
    .select()
    .from(documents)
    .where(eq(documents.sourceUri, params.sourceUri))
    .limit(1);

  let documentId = existing[0]?.id;
  if (!documentId) {
    const [doc] = await db
      .insert(documents)
      .values({
        title: params.title,
        sourceType: params.sourceType,
        sourceUri: params.sourceUri,
        mime: params.mime,
        byteSize: params.buffer.byteLength,
        status: "pending",
        ownerUserId: params.ownerUserId ?? null,
      })
      .returning();
    documentId = doc!.id;
  } else {
    await db.delete(chunks).where(eq(chunks.documentId, documentId));
    await db
      .update(documents)
      .set({
        title: params.title,
        mime: params.mime,
        byteSize: params.buffer.byteLength,
        status: "pending",
      })
      .where(eq(documents.id, documentId));
  }

  try {
    const parsed = await parseUpload(params.buffer, params.mime);
    const parts = parsed.pages?.length
      ? chunkPages(parsed.pages)
      : chunkText(parsed.text);

    if (!parts.length) {
      throw new Error("No text chunks produced from file");
    }

    const batchSize = 32;
    for (let i = 0; i < parts.length; i += batchSize) {
      const batch = parts.slice(i, i + batchSize);
      const embeddings = await embedTexts(batch.map((p) => p.content));
      for (let j = 0; j < batch.length; j++) {
        const part = batch[j]!;
        await db.insert(chunks).values({
          documentId,
          chunkIndex: part.chunkIndex,
          pageOrSection: part.pageOrSection,
          content: part.content,
          tokenCount: part.tokenCount,
          embedding: embeddings[j]!,
        });
      }
    }

    await db
      .update(documents)
      .set({ status: "ready" })
      .where(eq(documents.id, documentId));

    return { documentId };
  } catch (err) {
    await db
      .update(documents)
      .set({ status: "failed" })
      .where(eq(documents.id, documentId));
    throw err;
  }
}
