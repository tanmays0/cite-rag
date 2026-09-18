import { basename } from "node:path";

const PDF_MAGIC = Buffer.from("%PDF");

export type UploadKind = "application/pdf" | "text/plain";

/**
 * Strip directories and control chars so filenames cannot traverse paths.
 * Returns a safe basename (never empty).
 */
export function sanitizeUploadFilename(name: string): string {
  const base = basename(name.replace(/\\/g, "/")).normalize("NFKC");
  const cleaned = base
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[^\w.\- ()[\]]+/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 180);
  return cleaned || "upload.bin";
}

export function sanitizeUploadTitle(filename: string): string {
  const safe = sanitizeUploadFilename(filename);
  const withoutExt = safe.replace(/\.[^.]+$/, "").trim();
  return withoutExt || "Upload";
}

/**
 * Detect allowed upload types from content (magic / heuristics), not extension alone.
 */
export function detectUploadMime(buffer: Buffer): UploadKind | null {
  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(PDF_MAGIC)) {
    return "application/pdf";
  }
  // Reject if buffer looks binary (high ratio of NUL / non-text bytes).
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
  let suspicious = 0;
  for (let i = 0; i < sample.length; i++) {
    const b = sample[i]!;
    if (b === 0) {
      suspicious += 4;
      continue;
    }
    // Allow tab/lf/cr and printable ASCII + high UTF-8 bytes
    if (b < 7 || (b > 13 && b < 32)) suspicious += 1;
  }
  if (sample.length > 0 && suspicious / sample.length > 0.1) {
    return null;
  }
  // Must decode as UTF-8 text for TXT uploads
  try {
    const text = buffer.toString("utf8");
    if (text.includes("\uFFFD") && suspicious > 0) return null;
    return "text/plain";
  } catch {
    return null;
  }
}
