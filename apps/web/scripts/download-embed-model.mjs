/**
 * Download free MiniLM weights into apps/web/models so Vercel
 * does not fetch them on every cold start (which blows the 60s budget).
 */
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline, env } from "@xenova/transformers";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = join(root, "models");
mkdirSync(cacheDir, { recursive: true });
env.cacheDir = cacheDir;
env.allowLocalModels = true;

const model = process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2";
console.log(`Downloading ${model} → ${cacheDir}`);
const extractor = await pipeline("feature-extraction", model);
const sample = await extractor("warmup", { pooling: "mean", normalize: true });
console.log(`Ready. dims=${sample.data.length}`);
