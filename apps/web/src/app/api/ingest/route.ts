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

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED = new Set(["application/pdf", "text/plain", "text/markdown"]);

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

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED.has(mime) && !file.name.endsWith(".txt") && !file.name.endsWith(".pdf")) {
    return NextResponse.json(
      { error: "Only PDF and TXT are supported" },
      { status: 415, headers: rateLimitHeaders(rl) },
    );
  }

  const resolvedMime =
    mime === "application/octet-stream"
      ? file.name.endsWith(".pdf")
        ? "application/pdf"
        : "text/plain"
      : mime;

  const buffer = Buffer.from(await file.arrayBuffer());
  const title = file.name.replace(/\.[^.]+$/, "") || "Upload";
  const sourceUri = `upload://${session.user.id}/${Date.now()}-${file.name}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(sourceUri, buffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: resolvedMime,
    });
  } else {
    const dir = join(process.cwd(), "../../data/uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, `${Date.now()}-${file.name}`), buffer);
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
