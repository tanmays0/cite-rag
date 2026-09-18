import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { cleanupExpiredGuests, guestTtlHours } from "@/lib/users";

export const runtime = "nodejs";
export const maxDuration = 60;

function bearerMatches(secret: string, header: string | null): boolean {
  if (!header?.startsWith("Bearer ")) return false;
  const token = header.slice(7);
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Vercel Cron (or manual) guest hygiene.
 * Requires Authorization: Bearer $CRON_SECRET — rejects missing/wrong secrets.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (!bearerMatches(secret, req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ttl = guestTtlHours();
  const result = await cleanupExpiredGuests(ttl);
  return NextResponse.json({
    ok: true,
    ttlHours: ttl,
    ...result,
  });
}

export async function POST(req: Request) {
  return GET(req);
}
