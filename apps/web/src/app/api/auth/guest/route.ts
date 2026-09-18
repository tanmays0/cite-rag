import { NextResponse } from "next/server";
import { clientIp } from "@/lib/client-ip";
import {
  HOUR_MS,
  guestRateLimit,
  peekLimit,
  rateLimitHeaders,
  takeToken,
} from "@/lib/rate-limit";
import { cleanupExpiredGuests, createGuestUser } from "@/lib/users";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Provision a throwaway guest user and return one-time credentials for Auth.js
 * credentials sign-in. Rate-limited per IP (stricter than signup).
 * Quota is only consumed after a successful provision so outages do not lock IPs out.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = guestRateLimit();
  const key = `guest:${ip}`;
  const peek = peekLimit(key, limit, HOUR_MS);
  if (!peek.allowed) {
    return NextResponse.json(
      { error: "Guest limit reached for this network. Sign up or try later." },
      { status: 429, headers: rateLimitHeaders(peek) },
    );
  }

  // Opportunistic hygiene when cron is unavailable (e.g. local).
  void cleanupExpiredGuests().catch(() => undefined);

  try {
    const guest = await createGuestUser();
    const rl = takeToken(key, limit, HOUR_MS);
    return NextResponse.json(
      {
        email: guest.email,
        password: guest.password,
        isGuest: true,
      },
      { headers: rateLimitHeaders(rl) },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not start a guest session." },
      { status: 500 },
    );
  }
}
