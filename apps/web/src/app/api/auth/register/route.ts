import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp } from "@/lib/client-ip";
import { emailSchema, passwordSchema } from "@/lib/password";
import {
  HOUR_MS,
  rateLimitHeaders,
  registerRateLimit,
  takeToken,
} from "@/lib/rate-limit";
import { createRegisteredUser } from "@/lib/users";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/** Generic signup failure — avoids account enumeration via distinct 409s. */
const GENERIC_SIGNUP_ERROR =
  "Could not create account. If you already have one, log in instead.";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = registerRateLimit();
  const rl = takeToken(`register:${ip}`, limit, HOUR_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many signups from this network. Try again later." },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg =
      parsed.error.issues[0]?.message ||
      "Use a valid email and a stronger password (8+ chars, letter and number).";
    return NextResponse.json(
      { error: msg },
      { status: 400, headers: rateLimitHeaders(rl) },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  if (email.endsWith("@guest.invalid")) {
    return NextResponse.json(
      { error: GENERIC_SIGNUP_ERROR },
      { status: 400, headers: rateLimitHeaders(rl) },
    );
  }

  try {
    const user = await createRegisteredUser({
      email,
      password: parsed.data.password,
    });
    return NextResponse.json(
      { id: user.id, email: user.email },
      { status: 201, headers: rateLimitHeaders(rl) },
    );
  } catch {
    // Unique violation and other insert failures share one message (anti-enumeration).
    return NextResponse.json(
      { error: GENERIC_SIGNUP_ERROR },
      { status: 400, headers: rateLimitHeaders(rl) },
    );
  }
}
