import { pipeline, env, type FeatureExtractionPipeline } from "@xenova/transformers";
import { existsSync } from "node:fs";
import { join } from "node:path";

/** Free local model — 384-d, no API key / no paid credits. */
export const LOCAL_EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2";
export const LOCAL_EMBEDDING_DIM = 384;

function resolveCacheDir(): string {
  if (process.env.TRANSFORMERS_CACHE) return process.env.TRANSFORMERS_CACHE;
  // Vercel serverless: prefer vendored models/, else writable /tmp
  const vendored = join(process.cwd(), "models");
  if (existsSync(vendored)) return vendored;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return "/tmp/transformers-cache";
  }
  return join(process.cwd(), "models");
}

env.cacheDir = resolveCacheDir();
env.allowLocalModels = true;

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", LOCAL_EMBEDDING_MODEL);
  }
  return extractorPromise;
}

export async function embedLocalMany(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const extractor = await getExtractor();
  const out: number[][] = [];
  for (const text of texts) {
    const result = await extractor(text, { pooling: "mean", normalize: true });
    out.push(Array.from(result.data as Float32Array));
  }
  return out;
}

export async function embedLocalOne(text: string): Promise<number[]> {
  const [vec] = await embedLocalMany([text]);
  return vec!;
}
