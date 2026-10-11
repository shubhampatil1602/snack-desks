import { headers } from "next/headers";

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

// Global in-memory storage for sliding window rate limiting
const globalForRateLimit = globalThis as unknown as {
  rateLimitMap?: Map<string, RateLimitRecord>;
};

const rateLimitMap = globalForRateLimit.rateLimitMap ?? new Map<string, RateLimitRecord>();
if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.rateLimitMap = rateLimitMap;
}

/**
 * Extracts client IP from incoming request headers
 */
export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    const realIp = headerList.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
    }
  } catch {
    // If called outside of request context
  }
  return "127.0.0.1";
}

/**
 * Enforces rate limiting per IP and action key
 * @param action - Unique identifier for the action (e.g. 'auth:signup')
 * @param max - Maximum allowed requests within window
 * @param windowMs - Time window in milliseconds (default: 60s)
 */
export async function checkRateLimit(
  action: string,
  max: number = 10,
  windowMs: number = 60_000,
): Promise<{ success: boolean; remaining: number; retryAfterSec?: number }> {
  const ip = await getClientIp();
  const key = `${action}:${ip}`;
  const now = Date.now();

  // Cleanup expired entries periodically if map grows large
  if (rateLimitMap.size > 2000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetAt <= now) {
        rateLimitMap.delete(k);
      }
    }
  }

  const existing = rateLimitMap.get(key);

  if (!existing || existing.resetAt <= now) {
    // New window
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { success: true, remaining: max - 1 };
  }

  if (existing.count >= max) {
    const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000);
    return {
      success: false,
      remaining: 0,
      retryAfterSec,
    };
  }

  existing.count += 1;
  return {
    success: true,
    remaining: max - existing.count,
  };
}

/**
 * Validates honeypot fields in forms.
 * Returns true if valid (honeypot field is empty), false if filled by a spam bot.
 */
export function validateHoneypot(value?: string | null): boolean {
  if (value && value.trim().length > 0) {
    return false; // Bot caught
  }
  return true;
}
