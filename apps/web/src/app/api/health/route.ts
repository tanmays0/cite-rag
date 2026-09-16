import { NextResponse } from "next/server";
import { sql } from "@/db";

export async function GET() {
  let dbOk = false;
  try {
    await sql`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return NextResponse.json({
    ok: dbOk,
    db: dbOk,
    embeddingsConfigured:
      (process.env.EMBEDDING_PROVIDER || "local").toLowerCase() !== "openai" ||
      Boolean(process.env.OPENAI_API_KEY),
    embeddingProvider: process.env.EMBEDDING_PROVIDER || "local",
    llmConfigured: Boolean(process.env.GROQ_API_KEY),
  });
}
