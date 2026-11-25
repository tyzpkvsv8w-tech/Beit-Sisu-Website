import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db } from "./db";
import { uaeDate } from "./pricing";

// Counting listing views.
// - Each visitor counts once per listing per day, so refreshing doesn't inflate the number.
//   Visitors are told apart by a short-lived hash of IP address and browser, kept in memory
//   only (never stored in the database) and forgotten after a day.
// - Search engines and link-preview robots don't count. The seller's own visits don't count
//   either (the listing page skips them).

const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|headless|lighthouse|curl|wget|python-requests/i;
const seen = new Map<string, number>();
const DAY = 24 * 3600 * 1000;

function alreadyCounted(key: string) {
  const now = Date.now();
  if (seen.size > 50_000) for (const [k, t] of seen) if (now - t > DAY) seen.delete(k);
  const t = seen.get(key);
  if (t && now - t < DAY) return true;
  seen.set(key, now);
  return false;
}

/** The UAE calendar day as the Date Postgres stores in a DATE column. */
const dayOf = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

export async function recordView(listingId: string) {
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  if (!ua || BOTS.test(ua) || h.get("purpose") === "prefetch" || h.get("next-router-prefetch")) return;
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const today = uaeDate();
  const visitor = createHash("sha256").update(`${ip}|${ua}`).digest("base64url").slice(0, 16);
  if (alreadyCounted(`${listingId}:${visitor}:${today}`)) return;
  await db.$transaction([
    db.listing.update({ where: { id: listingId }, data: { views: { increment: 1 } } }),
    db.listingViewDay.upsert({
      where: { listingId_day: { listingId, day: dayOf(today) } },
      update: { views: { increment: 1 } },
      create: { listingId, day: dayOf(today), views: 1 },
    }),
  ]);
}

export type ViewDay = { date: string; views: number };

/** Daily views for the last `days` days (oldest first, zeros filled in), plus 7-day totals. */
export async function viewStats(listingId: string, days = 14) {
  const from = uaeDate(new Date(), -(days - 1));
  const rows = await db.listingViewDay.findMany({ where: { listingId, day: { gte: dayOf(from) } } });
  const byDay = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), r.views]));
  const series: ViewDay[] = Array.from({ length: days }, (_, i) => {
    const date = uaeDate(new Date(), -(days - 1 - i));
    return { date, views: byDay.get(date) ?? 0 };
  });
  const last7 = series.slice(-7).reduce((a, d) => a + d.views, 0);
  const prev7 = series.slice(-14, -7).reduce((a, d) => a + d.views, 0);
  return { series, last7, prev7 };
}

/** Views in the last 7 days for several listings at once (for the "My ads" page). */
export async function weeklyViews(listingIds: string[]) {
  if (!listingIds.length) return new Map<string, number>();
  const rows = await db.listingViewDay.groupBy({
    by: ["listingId"],
    where: { listingId: { in: listingIds }, day: { gte: dayOf(uaeDate(new Date(), -6)) } },
    _sum: { views: true },
  });
  return new Map(rows.map((r) => [r.listingId, r._sum.views ?? 0]));
}
