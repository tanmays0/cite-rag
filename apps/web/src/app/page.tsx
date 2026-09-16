import Link from "next/link";
import { sql as dsql } from "drizzle-orm";
import { db } from "@/db";
import { chunks, documents } from "@/db/schema";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const [docRow] = await db
      .select({ count: dsql<number>`count(*)::int` })
      .from(documents);
    const [chunkRow] = await db
      .select({ count: dsql<number>`count(*)::int` })
      .from(chunks);
    return {
      documentCount: docRow?.count ?? 0,
      chunkCount: chunkRow?.count ?? 0,
    };
  } catch {
    return { documentCount: 0, chunkCount: 0 };
  }
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <section className="relative mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-6xl flex-col justify-center px-6 pb-20 pt-6">
      <div className="max-w-3xl">
        <h1 className="brand-mark animate-rise text-[clamp(3.5rem,12vw,6.5rem)] leading-[0.92] tracking-[-0.04em] text-paper">
          cite-rag
        </h1>
        <p className="animate-rise-delay mt-6 max-w-lg text-lg font-light leading-relaxed text-mist md:text-xl">
          Ask a real indexed corpus. Grounded answers show sources you can open —
          and when retrieval is weak, it says so.
        </p>
        <div className="animate-rise-delay mt-10 flex flex-wrap items-center gap-4">
          <Button asChild size="lg">
            <Link href="/login">Open the demo</Link>
          </Button>
        </div>
        <div className="mt-16 flex flex-wrap items-center gap-6 font-mono text-xs text-mist/70">
          <span className="inline-flex items-center gap-2">
            <span className="h-px w-8 animate-pulse-line bg-marker" />
            {stats.documentCount.toLocaleString()} docs indexed
          </span>
          <span>{stats.chunkCount.toLocaleString()} chunks</span>
        </div>
      </div>
    </section>
  );
}
