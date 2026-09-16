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
