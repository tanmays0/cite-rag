import { and, desc, eq, ilike, or, sql as dsql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { documents } from "@/db/schema";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

  const visibility = or(
    eq(documents.sourceType, "corpus"),
    eq(documents.ownerUserId, session.user.id),
  );

  const whereClause = q
    ? and(visibility, ilike(documents.title, `%${q}%`))
    : visibility;

  const rows = await db
    .select({
      id: documents.id,
      title: documents.title,
      sourceType: documents.sourceType,
      mime: documents.mime,
      status: documents.status,
      byteSize: documents.byteSize,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(whereClause)
    .orderBy(desc(documents.createdAt))
    .limit(limit);

  const [{ count }] = await db
    .select({ count: dsql<number>`count(*)::int` })
    .from(documents)
    .where(visibility);

  return NextResponse.json({ documents: rows, total: count });
}
