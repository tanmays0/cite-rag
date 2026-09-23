import { createHash } from "node:crypto";
import {
  LOCAL_EMBEDDING_DIM,
  LOCAL_EMBEDDING_MODEL,
  embedLocalMany,
  embedLocalOne,
} from "../packages/rag/src/embed-local.ts";
import type { EmbeddingMode } from "./types.ts";

export function resolveEmbeddingMode(): EmbeddingMode {
  return process.env.EVAL_HASH_EMBEDDINGS === "1" ? "hash-smoke" : "minilm";
}

export function embeddingModelId(mode: EmbeddingMode): string {
  if (mode === "hash-smoke") return "deterministic-hash-smoke";
  return LOCAL_EMBEDDING_MODEL;
}

function hashEmbed(text: string): number[] {
  const out = Array.from({ length: LOCAL_EMBEDDING_DIM }, () => 0);
  for (let i = 0; i < text.length; i++) {
    out[i % LOCAL_EMBEDDING_DIM] += (text.charCodeAt(i) % 31) / 31;
  }
  const norm = Math.sqrt(out.reduce((s, v) => s + v * v, 0)) || 1;
  return out.map((v) => v / norm);
}

export async function embedTexts(
  texts: string[],
  mode: EmbeddingMode = resolveEmbeddingMode(),
): Promise<number[][]> {
  if (mode === "hash-smoke") return texts.map(hashEmbed);
  return embedLocalMany(texts);
}

export async function embedOne(
  text: string,
  mode: EmbeddingMode = resolveEmbeddingMode(),
): Promise<number[]> {
  if (mode === "hash-smoke") return hashEmbed(text);
  return embedLocalOne(text);
}

export function sha256Short(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex").slice(0, 12);
}

export function configHash(parts: Record<string, unknown>): string {
  return sha256Short(JSON.stringify(parts));
}
