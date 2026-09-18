type Bucket = {
  tokens: number;
  updatedAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

function getBucket(key: string, limit: number, windowMs: number): Bucket {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing) {
    const fresh = { tokens: limit, updatedAt: now };
    buckets.set(key, fresh);
    return fresh;
  }
  const elapsed = now - existing.updatedAt;
  const refill = (elapsed / windowMs) * limit;
  existing.tokens = Math.min(limit, existing.tokens + refill);
  existing.updatedAt = now;
  return existing;
}

export function takeToken(
  key: string,
  limit: number,
  windowMs: number = 60_000,
): RateLimitResult {
  const bucket = getBucket(key, limit, windowMs);
  if (bucket.tokens < 1) {
    const retryAfterSeconds = Math.ceil(
      ((1 - bucket.tokens) / limit) * (windowMs / 1000),
    );
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }
  bucket.tokens -= 1;
  return {
    allowed: true,
    limit,
    remaining: Math.floor(bucket.tokens),
    retryAfterSeconds: 0,
  };
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
  };
  if (!result.allowed) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }
  return headers;
}

export function chatRateLimit(): number {
  return Number(process.env.CHAT_RATE_LIMIT_PER_MIN || 20);
}

export function ingestRateLimit(): number {
  return Number(process.env.INGEST_RATE_LIMIT_PER_MIN || 5);
}

/** Signups per IP per hour (default 5). */
export function registerRateLimit(): number {
  return Number(process.env.REGISTER_RATE_LIMIT_PER_HOUR || 5);
}

/** Guest provisions per IP per hour — stricter than signup (default 3). */
export function guestRateLimit(): number {
  return Number(process.env.GUEST_RATE_LIMIT_PER_HOUR || 3);
}

/** Credential login attempts per IP per hour (default 30). */
export function loginIpRateLimit(): number {
  return Number(process.env.LOGIN_RATE_LIMIT_PER_HOUR || 30);
}

/** Failed logins per email per hour before lockout (default 10). */
export function loginAccountFailLimit(): number {
  return Number(process.env.LOGIN_FAIL_LIMIT_PER_HOUR || 10);
}

/** Peek remaining tokens without consuming (for lockout checks). */
export function peekLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000,
): RateLimitResult {
  const bucket = getBucket(key, limit, windowMs);
  if (bucket.tokens < 1) {
    const retryAfterSeconds = Math.ceil(
      ((1 - bucket.tokens) / limit) * (windowMs / 1000),
    );
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }
  return {
    allowed: true,
    limit,
    remaining: Math.floor(bucket.tokens),
    retryAfterSeconds: 0,
  };
}

export const HOUR_MS = 60 * 60 * 1000;
