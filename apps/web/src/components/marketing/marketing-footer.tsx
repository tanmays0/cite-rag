import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/8 px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-xs text-mist">
          Built by{" "}
          <span className="text-paper">Tanmay Shinde</span>
          {" · "}
          citation-backed RAG
        </p>
        <div className="flex flex-wrap gap-4 font-mono text-xs text-mist">
          <Link
            href="https://cite-rag.vercel.app"
            className="transition hover:text-marker"
          >
            Live
          </Link>
          <Link
            href="https://github.com/tanmays0/cite-rag"
            className="transition hover:text-marker"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
