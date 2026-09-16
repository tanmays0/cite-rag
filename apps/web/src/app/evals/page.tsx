import { readFile } from "node:fs/promises";
import { join } from "node:path";

export default async function EvalsPage() {
  let scorecard = "Scorecard not found. Run `pnpm eval` after seeding the corpus.";
  try {
    const path = join(process.cwd(), "../../evals/scorecard.md");
    scorecard = await readFile(path, "utf8");
  } catch {
    try {
      scorecard = await readFile(join(process.cwd(), "evals/scorecard.md"), "utf8");
    } catch {
      // keep default
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist/60">
        Internal
      </p>
      <h1 className="brand-mark mt-2 text-3xl text-paper">Evals</h1>
      <p className="mt-2 text-sm text-mist">
        Retrieval metrics from the last local eval run.
      </p>
      <article className="prose-cite mt-8 whitespace-pre-wrap border-t border-white/10 pt-6 font-mono text-xs leading-relaxed text-mist/90">
        {scorecard}
      </article>
    </div>
  );
}
