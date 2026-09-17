import type { Metadata } from "next";
import Link from "next/link";
import { sql as dsql } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { ArchitectureDiagram } from "@/components/marketing/architecture-diagram";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MetricCard } from "@/components/marketing/metric-card";
import { PipelineDiagram } from "@/components/marketing/pipeline-diagram";
import { TechBadge } from "@/components/marketing/tech-badge";
import { TryDemoButton } from "@/components/marketing/try-demo-button";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "cite-rag — citation-backed RAG that refuses to hallucinate",
  description:
    "Production RAG over 1,000+ docs: MiniLM embeddings, pgvector retrieval, Groq generation, and grounded citations — or an explicit refusal when confidence is low.",
  openGraph: {
    title: "cite-rag — citation-backed RAG that refuses to hallucinate",
    description:
      "Ingest → chunk → embed → retrieve → cite or refuse. Next.js 15, pgvector, Transformers.js, Groq.",
    url: "https://cite-rag.vercel.app",
    siteName: "cite-rag",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "cite-rag — citation-backed RAG that refuses to hallucinate",
    description:
      "Production RAG with openable citations and honest OOD refusal.",
  },
  alternates: {
    canonical: "https://cite-rag.vercel.app",
  },
};

const techStack = [
  "Next.js 15",
  "React 19",
  "TypeScript",
  "Tailwind CSS 4",
  "Supabase / pgvector",
  "Groq",
  "Drizzle ORM",
  "Auth.js",
  "Vercel AI SDK",
  "Transformers.js",
] as const;

async function getDocumentCount() {
  try {
    const [docRow] = await db
      .select({ count: dsql<number>`count(*)::int` })
      .from(documents);
    return docRow?.count ?? 0;
  } catch {
    return 0;
  }
}

export default async function MarketingPage() {
  const documentCount = await getDocumentCount();
  const docsLabel =
    documentCount >= 1000
      ? `${documentCount.toLocaleString()} docs indexed`
      : "1,000+ docs indexed";
  const chunksLabel = "1003/1003 chunks verified";

  return (
    <>
      {/* Hero */}
      <section className="relative mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-6xl flex-col justify-center px-6 pb-16 pt-4">
        <p className="animate-rise font-mono text-[11px] uppercase tracking-[0.18em] text-marker">
          Production citation-backed RAG
        </p>
        <h1 className="brand-mark animate-rise mt-4 max-w-4xl text-[clamp(2.6rem,9vw,4.75rem)] leading-[0.95] tracking-[-0.03em] text-paper">
          Citation-backed RAG that refuses to hallucinate
        </h1>
        <p className="animate-rise-delay mt-6 max-w-xl text-base font-light leading-relaxed text-mist md:text-lg">
          Ask a real indexed corpus. Every grounded answer shows sources you can
          open. When retrieval is weak, cite-rag says it does not know.
        </p>

        <div className="animate-rise-delay mt-8 flex flex-wrap gap-2">
          {["Next.js 15", "pgvector", "MiniLM 384-d", "Groq", "Auth.js"].map(
            (label) => (
              <TechBadge key={label} label={label} />
            ),
          )}
        </div>

        <div className="animate-rise-delay mt-10 flex flex-wrap items-center gap-3">
          <TryDemoButton />
          <Button asChild size="lg" variant="secondary">
            <Link
              href="https://github.com/tanmays0/cite-rag"
              rel="noopener noreferrer"
              target="_blank"
            >
              View on GitHub
            </Link>
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-16 md:py-24"
      >
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-3xl tracking-tight text-paper md:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-mist md:text-base">
            A fixed pipeline with a grounding gate — not prompt theater.
          </p>
        </div>
        <PipelineDiagram />
      </section>

      {/* Proof strip — numbers from live DB + evals/scorecard.md */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-3xl tracking-tight text-paper md:text-4xl">
            Proof
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-mist md:text-base">
            Live corpus counts and published eval refusal correctness.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Corpus"
            value={docsLabel}
            hint="Live document count from production index"
            delay={0}
          />
          <MetricCard
            label="Chunks"
            value={chunksLabel}
            hint="Scorecard corpus: 1003 documents / 1003 chunks"
            delay={0.05}
          />
          <MetricCard
            label="OOD refusal"
            value="100% (8/8)"
            hint="evals/scorecard.md — out-of-corpus correctly refused"
            delay={0.1}
          />
          <MetricCard
            label="Embeddings"
            value="384-dim"
            hint="Transformers.js all-MiniLM-L6-v2"
            delay={0.15}
          />
        </div>
      </section>

      {/* Architecture */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-3xl tracking-tight text-paper md:text-4xl">
            Architecture
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-mist md:text-base">
            Monorepo seams — UI, RAG library, ingest CLI, vectors, and LLM.
          </p>
        </div>
        <ArchitectureDiagram />
      </section>

      {/* Tech stack */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-3xl tracking-tight text-paper md:text-4xl">
            Tech stack
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-mist md:text-base">
            The same stack that runs in production on Vercel + Supabase.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {techStack.map((label) => (
            <TechBadge key={label} label={label} />
          ))}
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
