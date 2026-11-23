import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { DEFAULT_MARKET } from "./constants";

type Placement = "HOME_BANNER" | "SPORT_TAKEOVER" | "INFEED" | "LISTING_SIDE";

/**
 * Picks a live campaign for a slot. A sport-targeted campaign beats a general one,
 * so a sport takeover wins on that sport's pages. Counts an impression.
 */
export async function pickAd(placement: Placement, opts: { sport?: string; city?: string } = {}) {
  const now = new Date();
  const placements: Placement[] = opts.sport && placement !== "HOME_BANNER" ? [placement, "SPORT_TAKEOVER"] : [placement];
  const candidates = await db.adCampaign.findMany({
    where: {
      placement: { in: placements },
      market: DEFAULT_MARKET,
      active: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
      AND: [
        { OR: [{ sport: null }, ...(opts.sport ? [{ sport: opts.sport }] : [])] },
        { OR: [{ city: null }, ...(opts.city ? [{ city: opts.city }] : [])] },
      ],
    },
  });
  if (!candidates.length) return null;
  const targeted = candidates.filter((c) => opts.sport && c.sport === opts.sport);
  const pool = targeted.length ? targeted : candidates.filter((c) => c.placement === placement);
  if (!pool.length) return null;
  const ad = pool[Math.floor(Math.random() * pool.length)];
  await db.adCampaign.update({ where: { id: ad.id }, data: { impressions: { increment: 1 } } });
  return ad;
}

/** Sponsored listings that also match the visitor's search, so paid slots stay relevant. */
export async function sponsoredListings(opts: { where?: Prisma.ListingWhereInput; take: number }) {
  return db.listing.findMany({
    where: {
      ...opts.where,
      status: "ACTIVE",
      market: DEFAULT_MARKET,
      sponsoredUntil: { gte: new Date() },
    },
    include: { photos: { orderBy: { position: "asc" }, take: 1 }, seller: { select: { name: true } } },
    take: opts.take,
  });
}
