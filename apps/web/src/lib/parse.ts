type PdfParseFn = (
  buffer: Buffer,
  options?: {
    pagerender?: (pageData: {
      getTextContent: (opts?: {
        normalizeWhitespace?: boolean;
        disableCombineTextItems?: boolean;
      }) => Promise<{
        items: Array<{ str: string; transform: number[] }>;
      }>;
    }) => Promise<string>;
    max?: number;
  },
) => Promise<{ text: string; numpages: number }>;

/** Extract text from one PDF.js page, inserting spaces when glyphs abut. */
async function renderPageText(pageData: {
  getTextContent: (opts?: {
    normalizeWhitespace?: boolean;
    disableCombineTextItems?: boolean;
  }) => Promise<{ items: Array<{ str: string; transform: number[] }> }>;
}): Promise<string> {
  const textContent = await pageData.getTextContent({
    normalizeWhitespace: true,
    disableCombineTextItems: false,
  });

  let lastY: number | undefined;
  let text = "";
  for (const item of textContent.items) {
    const str = item.str ?? "";
    if (!str) continue;
    const y = item.transform[5];
    if (lastY === undefined || y === lastY) {
      if (text && !/\s$/.test(text) && !/^\s/.test(str)) {
        text += " ";
      }
      text += str;
    } else {
      text += `\n${str}`;
    }
    lastY = y;
  }
  return text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

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
    const pdf = (mod as { default?: PdfParseFn }).default;
    if (!pdf) {
      throw new Error("pdf-parse failed to load");
    }

    const pages: Array<{ pageNumber: number; text: string }> = [];
    const data = await pdf(buffer, {
      pagerender: async (pageData) => {
        const pageText = await renderPageText(pageData);
        pages.push({ pageNumber: pages.length + 1, text: pageText });
        return pageText;
      },
    });

    const text =
      pages
        .map((p) => p.text)
        .filter(Boolean)
        .join("\n\n")
        .trim() || (data.text || "").trim();

    if (!text) {
      throw new Error(
        "No extractable text in PDF (scanned images are not supported in v1).",
      );
    }

    // Fall back to a single unlabeled blob only if pagerender collected nothing.
    if (!pages.length) {
      return { text };
    }

    return {
      text,
      pages: pages.filter((p) => p.text.trim().length > 0),
    };
  }
  throw new Error(`Unsupported mime type: ${mime}`);
}
