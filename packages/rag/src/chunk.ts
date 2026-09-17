import type { TextChunk } from "./types.js";

/** Approximate token count: ~4 chars per token for English prose. */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.trim().length / 4));
}

function isWs(ch: string | undefined): boolean {
  return ch !== undefined && /\s/.test(ch);
}

/** Move `pos` to the start of the current word (or keep if already on a boundary). */
export function snapToWordStart(text: string, pos: number): number {
  if (pos <= 0) return 0;
  if (pos >= text.length) return text.length;
  if (isWs(text[pos])) {
    while (pos < text.length && isWs(text[pos])) pos += 1;
    return pos;
  }
  if (isWs(text[pos - 1])) return pos;
  let back = pos;
  while (back > 0 && !isWs(text[back - 1])) back -= 1;
  return back;
}

/**
 * Choose a chunk end that prefers paragraph → sentence → newline → word breaks.
 * Falls back to a hard cut only when the window has no whitespace (e.g. dense tokens).
 */
export function findChunkEnd(
  text: string,
  start: number,
  targetChars: number,
): number {
  const hardEnd = Math.min(text.length, start + targetChars);
  if (hardEnd >= text.length) return text.length;

  const window = text.slice(start, hardEnd);
  const minRel = Math.floor(window.length * 0.4);

  const ranked: Array<{ at: number; consume: number }> = [
    { at: window.lastIndexOf("\n\n"), consume: 2 },
    { at: window.lastIndexOf(". "), consume: 2 },
    { at: window.lastIndexOf("? "), consume: 2 },
    { at: window.lastIndexOf("! "), consume: 2 },
    { at: window.lastIndexOf(".\n"), consume: 2 },
    { at: window.lastIndexOf("\n"), consume: 1 },
    { at: window.lastIndexOf(" "), consume: 1 },
  ];

  for (const { at, consume } of ranked) {
    if (at >= minRel) {
      return start + at + consume;
    }
  }

  // Prefer any whitespace over slicing a word in half.
  const anySpace = window.lastIndexOf(" ");
  const anyNl = window.lastIndexOf("\n");
  const soft = Math.max(anySpace, anyNl);
  if (soft > 0) {
    return start + soft + 1;
  }

  return hardEnd;
}

/**
 * Split text into overlapping chunks (~512–800 tokens, ~12% overlap).
 * Boundaries snap to word/sentence breaks so chunks don't start or end mid-token.
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
    const end = findChunkEnd(cleaned, start, targetChars);
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

    const rawNext = Math.max(0, end - overlapChars);
    let next = snapToWordStart(cleaned, rawNext);
    // Always make forward progress even on pathological input.
    if (next <= start) {
      next = Math.min(cleaned.length, end);
    }
    start = next;
  }

  return chunks;
}

/** Chunk multi-page PDF text with per-page labels. */
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
