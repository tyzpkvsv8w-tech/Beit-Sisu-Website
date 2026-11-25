import "server-only";
import { db } from "./db";

export const cardInclude = {
  photos: { orderBy: { position: "asc" as const }, take: 1, select: { key: true } },
  seller: { select: { name: true } },
  _count: { select: { photos: true } },
};

export async function savedIds(userId: string | undefined, listingIds: string[]) {
  if (!userId || !listingIds.length) return new Set<string>();
  const favs = await db.favorite.findMany({ where: { userId, listingId: { in: listingIds } }, select: { listingId: true } });
  return new Set(favs.map((f) => f.listingId));
}
