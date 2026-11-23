import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const isProd = () => process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_SECRETS !== "1";

/**
 * The site's public address, used in links inside emails. Never taken from the
 * request's Host header, which an attacker could fake to steal reset links.
 */
export function appUrl() {
  const url = process.env.APP_URL?.replace(/\/$/, "");
  if (url) return url;
  if (isProd()) throw new Error("APP_URL must be set in production");
  return "http://localhost:3000";
}

function secret() {
  const s = process.env.APP_SECRET;
  if (s && s.length >= 32) return s;
  if (isProd()) throw new Error("APP_SECRET must be set (at least 32 characters) in production");
  return "dev-only-secret-not-for-production-use";
}

/** Signs a value so a link can carry it without a login, e.g. one-click unsubscribe. */
export function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function verifySignature(value: string, signature: string) {
  const expected = Buffer.from(sign(value));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
