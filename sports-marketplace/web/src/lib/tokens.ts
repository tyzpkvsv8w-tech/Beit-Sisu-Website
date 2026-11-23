import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

/** Creates a single-use token and returns the raw value to put in a link. Older unused ones are cancelled. */
export async function createEmailToken(userId: string, purpose: "reset" | "verify", ttlMs: number, email?: string) {
  const raw = randomBytes(32).toString("base64url");
  await db.emailToken.deleteMany({ where: { userId, purpose, usedAt: null } });
  await db.emailToken.create({ data: { id: hash(raw), userId, purpose, email, expiresAt: new Date(Date.now() + ttlMs) } });
  return raw;
}

/** The token if it's real, unused and unexpired (without using it up). */
export async function peekEmailToken(raw: string, purpose: "reset" | "verify") {
  if (!raw || raw.length > 100) return null;
  const t = await db.emailToken.findUnique({ where: { id: hash(raw) } });
  if (!t || t.purpose !== purpose || t.usedAt || t.expiresAt < new Date()) return null;
  return t;
}

/** Uses the token up. Only one caller can win, even if two requests race. */
export async function consumeEmailToken(raw: string, purpose: "reset" | "verify") {
  const t = await peekEmailToken(raw, purpose);
  if (!t) return null;
  const { count } = await db.emailToken.updateMany({ where: { id: t.id, usedAt: null }, data: { usedAt: new Date() } });
  return count === 1 ? t : null;
}
