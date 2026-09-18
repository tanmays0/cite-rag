import { put } from "@vercel/blob";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ingestBuffer } from "@/lib/ingest";
import {
  ingestRateLimit,
  rateLimitHeaders,
  takeToken,
} from "@/lib/rate-limit";
import {
  detectUploadMime,
  sanitizeUploadFilename,
  sanitizeUploadTitle,
} from "@/lib/upload-validation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = ingestRateLimit();
  const rl = takeToken(`ingest:${session.user.id}`, limit);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Upload rate limit exceeded" },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const maxBytes = Number(process.env.MAX_UPLOAD_BYTES || 2_097_152);
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File exceeds ${maxBytes} bytes` },
      { status: 413, headers: rateLimitHeaders(rl) },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > maxBytes) {
    return NextResponse.json(
      { error: `File exceeds ${maxBytes} bytes` },
      { status: 413, headers: rateLimitHeaders(rl) },
    );
  }

  const resolvedMime = detectUploadMime(buffer);
  if (!resolvedMime) {
    return NextResponse.json(
      { error: "Only PDF and plain-text uploads are supported" },
      { status: 415, headers: rateLimitHeaders(rl) },
    );
  }

  const safeName = sanitizeUploadFilename(file.name);
  const title = sanitizeUploadTitle(safeName);
  const sourceUri = `upload://${session.user.id}/${Date.now()}-${safeName}`;

  // Raw-file persistence is optional — embeddings land in Postgres either way.
  // On Vercel the filesystem is read-only; without Blob, skip disk write.
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await put(sourceUri, buffer, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: resolvedMime,
      });
    } else if (!process.env.VERCEL) {
      const dir = join(process.cwd(), "../../data/uploads");
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, `${Date.now()}-${safeName}`), buffer);
    }
  } catch (err) {
    console.warn("[ingest] optional raw-file store skipped:", err);
  }

  try {
    const { documentId } = await ingestBuffer({
      buffer,
      title,
      sourceUri,
      sourceType: "upload",
      mime: resolvedMime,
      ownerUserId: session.user.id,
    });
    return NextResponse.json(
      { documentId, status: "ready" },
      { headers: rateLimitHeaders(rl) },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingest failed";
    return NextResponse.json(
      { error: message },
      { status: 422, headers: rateLimitHeaders(rl) },
    );
  }
}
