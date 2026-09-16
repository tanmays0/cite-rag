import { sql as dsql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { chunks, documents } from "@/db/schema";

export async function GET() {
  try {
    const [docRow] = await db
      .select({ count: dsql<number>`count(*)::int` })
      .from(documents);
    const [chunkRow] = await db
      .select({ count: dsql<number>`count(*)::int` })
      .from(chunks);

    return NextResponse.json({
      documentCount: docRow?.count ?? 0,
      chunkCount: chunkRow?.count ?? 0,
    });
  } catch {
    return NextResponse.json(
      { documentCount: 0, chunkCount: 0, error: "database_unavailable" },
      { status: 503 },
    );
  }
}
