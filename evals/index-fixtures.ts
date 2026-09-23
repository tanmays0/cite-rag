import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  chunkText,
  chunkTextSemantic,
} from "../packages/rag/src/chunk.ts";
import type { RetrievedChunk } from "../packages/rag/src/types.ts";
import type { ChunkExperimentConfig, EmbeddingMode } from "./types.ts";
import { embedOne, embedTexts, sha256Short } from "./embed.ts";
import { repoRoot } from "./dataset.ts";

export type IndexedChunk = {
  id: string;
  documentId: string;
  documentTitle: string;
  sourceUri: string;
  content: string;
  chunkIndex: number;
  pageOrSection: string | null;
  embedding: number[];
};

export type FixtureIndex = {
  chunks: IndexedChunk[];
  fixtureFiles: string[];
  fixtureContentHashes: Record<string, string>;
  chunkCount: number;
};

function cosineDistance(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
  const sim = dot / denom;
  // Match pgvector cosine distance: 1 - cosine_similarity for normalized vectors.
  return 1 - sim;
}

export function loadFixtureDocs(): Array<{
  file: string;
  sourceUri: string;
  title: string;
  text: string;
  hash: string;
}> {
  const dir = join(repoRoot(), "data/fixtures");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".txt"))
    .sort();
  return files.map((file) => {
    const text = readFileSync(join(dir, file), "utf8");
    return {
      file,
      sourceUri: `fixture://${file}`,
      title: file.replace(/\.txt$/, ""),
      text,
      hash: sha256Short(text),
    };
  });
}

export function chunkWithConfig(
  text: string,
  config: ChunkExperimentConfig,
): ReturnType<typeof chunkText> {
  if (config.strategy === "semantic") {
    return chunkTextSemantic(text, {
      targetTokensMin: config.targetTokensMin ?? 400,
      targetTokensMax: config.targetTokensMax ?? 600,
      overlapRatio: config.overlapRatio,
    });
  }
  return chunkText(text, {
    targetTokens: config.targetTokens ?? 640,
    overlapRatio: config.overlapRatio,
  });
}

export async function buildFixtureIndex(
  config: ChunkExperimentConfig,
  mode: EmbeddingMode,
): Promise<FixtureIndex> {
  const docs = loadFixtureDocs();
  const chunks: IndexedChunk[] = [];
  const fixtureContentHashes: Record<string, string> = {};
  const fixtureFiles: string[] = [];

  for (const doc of docs) {
    fixtureFiles.push(doc.file);
    fixtureContentHashes[doc.file] = doc.hash;
    const parts = chunkWithConfig(doc.text, config);
    const embeddings = await embedTexts(
      parts.map((p) => p.content),
      mode,
    );
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      const id = createHash("sha256")
        .update(`${doc.sourceUri}:${part.chunkIndex}:${part.content}`)
        .digest("hex")
        .slice(0, 16);
      chunks.push({
        id,
        documentId: sha256Short(doc.sourceUri),
        documentTitle: doc.title,
        sourceUri: doc.sourceUri,
        content: part.content,
        chunkIndex: part.chunkIndex,
        pageOrSection: part.pageOrSection,
        embedding: embeddings[i]!,
      });
    }
  }

  return {
    chunks,
    fixtureFiles,
    fixtureContentHashes,
    chunkCount: chunks.length,
  };
}

export async function retrieveFromIndex(
  index: FixtureIndex,
  query: string,
  topN: number,
  mode: EmbeddingMode,
): Promise<Array<RetrievedChunk & { sourceUri: string }>> {
  const q = await embedOne(query, mode);
  const ranked = index.chunks
    .map((c) => ({
      id: c.id,
      documentId: c.documentId,
      documentTitle: c.documentTitle,
      content: c.content,
      chunkIndex: c.chunkIndex,
      pageOrSection: c.pageOrSection,
      distance: cosineDistance(q, c.embedding),
      sourceUri: c.sourceUri,
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, topN);
  return ranked;
}
