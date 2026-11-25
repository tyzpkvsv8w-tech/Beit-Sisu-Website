import "server-only";
import { db } from "./db";

/** True if either person has blocked the other. */
export async function blockedBetween(a: string, b: string) {
  const n = await db.block.count({ where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] } });
  return n > 0;
}

/** Everyone the user has blocked or been blocked by (their chats are hidden). */
export async function blockedIds(userId: string) {
  const rows = await db.block.findMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } });
  return new Set(rows.map((r) => (r.blockerId === userId ? r.blockedId : r.blockerId)));
}
