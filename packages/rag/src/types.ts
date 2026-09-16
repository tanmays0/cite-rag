export type ChunkInput = {
  text: string;
  pageOrSection?: string;
};

export type TextChunk = {
  content: string;
  chunkIndex: number;
  pageOrSection: string | null;
  tokenCount: number;
};

export type RetrievedChunk = {
  id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  chunkIndex: number;
  pageOrSection: string | null;
  /** Cosine distance from query (lower is better for pgvector <=> ). */
  distance: number;
};

export type Citation = {
  rank: number;
  chunkId: string;
  documentId: string;
  documentTitle: string;
  pageOrSection: string | null;
  snippet: string;
  score: number;
};

export type GroundingResult =
  | { grounded: true; chunks: RetrievedChunk[]; citations: Citation[] }
  | { grounded: false; reason: string; chunks: RetrievedChunk[] };
