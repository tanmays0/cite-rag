import type { TextChunk } from "./types.js";

/** Approximate token count: ~4 chars per token for English prose. */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.trim().length / 4));
}

/**
 * Split text into overlapping chunks (~512–800 tokens, ~12% overlap).
 */
export function chunkText(
  text: string,
  options?: {
    targetTokens?: number;
    overlapRatio?: number;
    pageOrSection?: string | null;
  },
): TextChunk[] {
  const targetTokens = options?.targetTokens ?? 640;
  const overlapRatio = options?.overlapRatio ?? 0.12;
  const pageOrSection = options?.pageOrSection ?? null;
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];

  const targetChars = targetTokens * 4;
  const overlapChars = Math.floor(targetChars * overlapRatio);
  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < cleaned.length) {
    let end = Math.min(cleaned.length, start + targetChars);
    if (end < cleaned.length) {
      const window = cleaned.slice(start, end);
      const breakAt = Math.max(
        window.lastIndexOf("\n\n"),
        window.lastIndexOf(". "),
        window.lastIndexOf("\n"),
      );
      if (breakAt > targetChars * 0.4) {
        end = start + breakAt + 1;
      }
    }
    const content = cleaned.slice(start, end).trim();
    if (content) {
      chunks.push({
        content,
        chunkIndex: index,
        pageOrSection,
        tokenCount: estimateTokens(content),
      });
      index += 1;
    }
    if (end >= cleaned.length) break;
    start = Math.max(0, end - overlapChars);
  }

  return chunks;
}

/** Chunk multi-page PDF text: pages joined with markers. */
export function chunkPages(
  pages: Array<{ pageNumber: number; text: string }>,
  options?: { targetTokens?: number; overlapRatio?: number },
): TextChunk[] {
  const out: TextChunk[] = [];
  for (const page of pages) {
    const parts = chunkText(page.text, {
      ...options,
      pageOrSection: `page ${page.pageNumber}`,
    });
    for (const part of parts) {
      out.push({ ...part, chunkIndex: out.length });
    }
  }
  return out;
}
