import { NextResponse } from "next/server";
import { clientIp } from "@/lib/client-ip";
import {
  HOUR_MS,
  guestRateLimit,
  rateLimitHeaders,
  takeToken,
} from "@/lib/rate-limit";
import { cleanupExpiredGuests, createGuestUser } from "@/lib/users";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Provision a throwaway guest user and return one-time credentials for Auth.js
 * credentials sign-in. Rate-limited per IP (stricter than signup).
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = guestRateLimit();
  const rl = takeToken(`guest:${ip}`, limit, HOUR_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Guest limit reached for this network. Sign up or try later." },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  // Opportunistic hygiene when cron is unavailable (e.g. local).
  void cleanupExpiredGuests().catch(() => undefined);

  try {
    const guest = await createGuestUser();
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
      { status: 500, headers: rateLimitHeaders(rl) },
    );
  }
}
