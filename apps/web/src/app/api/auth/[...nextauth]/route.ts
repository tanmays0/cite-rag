import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/auth";
import { clientIp } from "@/lib/client-ip";
import {
  HOUR_MS,
  loginIpRateLimit,
  rateLimitHeaders,
  takeToken,
} from "@/lib/rate-limit";

export const { GET } = handlers;

/**
 * Rate-limit credential callbacks by IP before Auth.js runs authorize.
 * Path is /api/auth/callback/credentials.
 */
export async function POST(req: NextRequest) {
  const url = req.nextUrl;
  const isCredentialsCallback = url.pathname.includes("/callback/credentials");

  if (isCredentialsCallback) {
    const ip = clientIp(req);
    const limit = loginIpRateLimit();
    const rl = takeToken(`login:ip:${ip}`, limit, HOUR_MS);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Try again later." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }
  }

  return handlers.POST(req);
}
