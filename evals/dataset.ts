import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { EvalQuestion } from "./types.ts";

export function evalsRoot(): string {
  // When run via apps/web tsx, cwd is apps/web; from repo root cwd is root.
  const fromWeb = join(process.cwd(), "../../evals");
  const fromRoot = join(process.cwd(), "evals");
  try {
    readFileSync(join(fromWeb, "questions.jsonl"));
    return fromWeb;
  } catch {
    return fromRoot;
  }
}

export function repoRoot(): string {
  return join(evalsRoot(), "..");
}

export function loadQuestions(): EvalQuestion[] {
  const path = join(evalsRoot(), "questions.jsonl");
  const lines = readFileSync(path, "utf8").trim().split("\n").filter(Boolean);
  return lines.map((line, i) => {
    const raw = JSON.parse(line) as {
      question: string;
      expected_source_uri: string | null;
      type: "grounded" | "ood";
    };
    return {
      id: `q${String(i + 1).padStart(2, "0")}`,
      question: raw.question,
      expectedSourceUri: raw.expected_source_uri,
      type: raw.type,
    };
  });
}

export function questionsPath(): string {
  return join(evalsRoot(), "questions.jsonl");
}
