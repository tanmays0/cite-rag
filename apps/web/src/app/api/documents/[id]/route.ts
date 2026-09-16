import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { chunks, documents } from "@/db/schema";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const docs = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  const doc = docs[0];
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const chunkRows = await db
    .select({
      id: chunks.id,
      chunkIndex: chunks.chunkIndex,
      pageOrSection: chunks.pageOrSection,
      content: chunks.content,
      tokenCount: chunks.tokenCount,
    })
    .from(chunks)
    .where(eq(chunks.documentId, id))
    .orderBy(asc(chunks.chunkIndex))
    .limit(100);

  return NextResponse.json({
    document: {
      id: doc.id,
      title: doc.title,
      sourceType: doc.sourceType,
      mime: doc.mime,
      status: doc.status,
      sourceUri: doc.sourceUri,
      byteSize: doc.byteSize,
      createdAt: doc.createdAt,
    },
    chunks: chunkRows.map((c) => ({
      ...c,
      preview: c.content.slice(0, 400),
    })),
  });
}
