declare module "pdf-parse/lib/pdf-parse.js" {
  type PdfData = {
    text: string;
    numpages: number;
    info?: Record<string, unknown>;
  };
  function pdf(buffer: Buffer): Promise<PdfData>;
  export default pdf;
}
