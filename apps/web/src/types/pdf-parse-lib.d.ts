declare module "pdf-parse/lib/pdf-parse.js" {
  type PageData = {
    getTextContent: (opts?: {
      normalizeWhitespace?: boolean;
      disableCombineTextItems?: boolean;
    }) => Promise<{
      items: Array<{ str: string; transform: number[] }>;
    }>;
  };

  type PdfData = {
    text: string;
    numpages: number;
    numrender?: number;
    info?: unknown;
    metadata?: unknown;
    version?: string;
  };

  type PdfOptions = {
    pagerender?: (pageData: PageData) => Promise<string> | string;
    max?: number;
    version?: string;
  };

  function pdf(buffer: Buffer, options?: PdfOptions): Promise<PdfData>;
  export default pdf;
}
