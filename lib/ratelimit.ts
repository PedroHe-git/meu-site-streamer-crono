// lib/ratelimit.ts
const rateLimitMap = new Map<string, { count: number; expires: number }>();

export function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60 * 1000) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.expires) {
    rateLimitMap.set(ip, { count: 1, expires: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}