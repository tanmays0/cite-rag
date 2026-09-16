export async function parseUpload(
  buffer: Buffer,
  mime: string,
): Promise<{ text: string; pages?: Array<{ pageNumber: number; text: string }> }> {
  if (mime === "text/plain" || mime === "text/markdown") {
    return { text: buffer.toString("utf8") };
  }
  if (mime === "application/pdf") {
    // Import the implementation entry to avoid pdf-parse's test-file side effect on default export.
    const mod = await import("pdf-parse/lib/pdf-parse.js");
    const pdf = (mod as { default?: (b: Buffer) => Promise<{ text: string; numpages: number }> })
      .default;
    if (!pdf) {
      throw new Error("pdf-parse failed to load");
    }
    const data = await pdf(buffer);
    const text = (data.text || "").trim();
    if (!text) {
      throw new Error(
        "No extractable text in PDF (scanned images are not supported in v1).",
      );
    }
    return {
      text,
      pages: [{ pageNumber: data.numpages || 1, text }],
    };
  }
  throw new Error(`Unsupported mime type: ${mime}`);
}
