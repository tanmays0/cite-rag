import { and, asc, eq } from "drizzle-orm";
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

  const visible =
    doc.sourceType === "corpus" ||
    doc.ownerUserId === session.user.id;
  if (!visible) {
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

  const canDelete =
    doc.sourceType === "upload" && doc.ownerUserId === session.user.id;

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
      canDelete,
    },
    chunks: chunkRows.map((c) => ({
      ...c,
      preview: previewAtWordBoundary(c.content, 400),
    })),
  });
}

export async function DELETE(
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

  if (doc.sourceType !== "upload" || doc.ownerUserId !== session.user.id) {
    return NextResponse.json(
      { error: "Only your uploaded documents can be deleted" },
      { status: 403 },
    );
  }

  await db
    .delete(documents)
    .where(
      and(
        eq(documents.id, id),
        eq(documents.ownerUserId, session.user.id),
        eq(documents.sourceType, "upload"),
      ),
    );

  return NextResponse.json({ ok: true });
}

/** Truncate for UI without cutting a word in half. */
function previewAtWordBoundary(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const breakAt = Math.max(
    slice.lastIndexOf("\n"),
    slice.lastIndexOf(" "),
  );
  const cut = breakAt > max * 0.6 ? breakAt : max;
  return `${slice.slice(0, cut).trimEnd()}…`;
}
