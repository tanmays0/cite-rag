import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  LOCAL_EMBEDDING_DIM,
  LOCAL_EMBEDDING_MODEL,
  embedLocalMany,
  embedLocalOne,
} from "@cite-rag/rag";

/** Default: free local MiniLM (384-d). Set EMBEDDING_PROVIDER=openai to use paid OpenAI. */
export function embeddingProvider(): "local" | "openai" {
  const raw = (process.env.EMBEDDING_PROVIDER || "local").toLowerCase();
  return raw === "openai" ? "openai" : "local";
}

export function embeddingDim(): number {
  if (embeddingProvider() === "openai") return 1536;
  return Number(process.env.EMBEDDING_DIM || LOCAL_EMBEDDING_DIM);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (embeddingProvider() === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY required when EMBEDDING_PROVIDER=openai");
    }
    const modelId = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
    const { embeddings } = await embedMany({
      model: openai.embedding(modelId),
      values: texts,
    });
    return embeddings;
  }
  // Force free local model id unless overridden to another Xenova checkpoint
  if (!process.env.EMBEDDING_MODEL) {
    process.env.EMBEDDING_MODEL = LOCAL_EMBEDDING_MODEL;
  }
  return embedLocalMany(texts);
}

export async function embedQuery(text: string): Promise<number[]> {
  if (embeddingProvider() === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY required when EMBEDDING_PROVIDER=openai");
    }
    const modelId = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
    const { embedding } = await embed({
      model: openai.embedding(modelId),
      value: text,
    });
    return embedding;
  }
  return embedLocalOne(text);
}
