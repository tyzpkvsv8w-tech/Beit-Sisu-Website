import "server-only";

// Simple in-memory limiter. Good enough for one server; use Redis or similar
// when running more than one instance.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/** For logins: only failed attempts count, and a success clears the slate. */
export const failures = {
  blocked(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    hits.set(key, recent);
    return recent.length >= limit;
  },
  record(key: string) {
    hits.set(key, [...(hits.get(key) ?? []), Date.now()]);
  },
  clear(key: string) {
    hits.delete(key);
  },
};
