import "server-only";
import { headers } from "next/headers";
import { db } from "./db";
import { uaeDate } from "./pricing";
import { SPORT_BY_ID } from "./constants";
import { dayOf, firstTimeToday, visitorKey } from "./views";

// How buyers find a listing: which searches showed it, and where its views came from.
// Only per-listing daily totals are stored, never who searched.

export const SOURCES = ["search", "browse", "home", "similar", "saved", "messages", "other"] as const;
export type Source = (typeof SOURCES)[number];

/**
 * Search text as we count it: lower case, single spaces, at most 40 characters.
 * Searches that look like personal details (an email address or a long number such as a
 * phone number) are never recorded.
 */
export function normalizeTerm(q: string) {
  const t = q.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 40);
  if (t.length < 2 || t.includes("@") || /\d[\d\s-]{5,}\d/.test(t)) return null;
  return t;
}

/** A search showed these listings. Counts once per visitor, search and day, so refreshing doesn't add up. */
export async function recordImpressions(listingIds: string[], q: string) {
  const term = normalizeTerm(q);
  if (!term || !listingIds.length) return;
  const visitor = await visitorKey();
  if (!visitor || !firstTimeToday(`search:${term}`, visitor)) return;
  const day = dayOf(uaeDate());
  await db.$transaction(listingIds.map((listingId) => db.listingDiscovery.upsert({
    where: { listingId_day_source_term: { listingId, day, source: "search", term } },
    update: { impressions: { increment: 1 } },
    create: { listingId, day, source: "search", term, impressions: 1 },
  })));
}

/** Works out where a view came from, using the page the visitor was on (same-site only). */
async function sourceOfView(): Promise<{ source: Source; term: string }> {
  const h = await headers();
  const ref = h.get("referer");
  const host = h.get("x-forwarded-host") ?? h.get("host");
  let url: URL;
  try { url = new URL(ref ?? ""); } catch { return { source: "other", term: "" }; }
  if (url.host !== host) return { source: "other", term: "" };
  const p = url.pathname;
  if (p === "/browse") {
    const term = normalizeTerm(url.searchParams.get("q") ?? "");
    if (term) return { source: "search", term };
    const sport = url.searchParams.get("sport") ?? "";
    return { source: "browse", term: sport in SPORT_BY_ID ? sport : "" };
  }
  if (p === "/") return { source: "home", term: "" };
  if (p.startsWith("/listing/")) return { source: "similar", term: "" };
  if (p === "/saved") return { source: "saved", term: "" };
  if (p.startsWith("/messages")) return { source: "messages", term: "" };
  return { source: "other", term: "" };
}

/** Call after a view has been counted, to record where it came from. */
export async function recordViewSource(listingId: string) {
  const { source, term } = await sourceOfView();
  const day = dayOf(uaeDate());
  await db.listingDiscovery.upsert({
    where: { listingId_day_source_term: { listingId, day, source, term } },
    update: { views: { increment: 1 } },
    create: { listingId, day, source, term, views: 1 },
  });
}

/** The seller's view: top search terms and views by source over the last `days` days. */
export async function discoveryStats(listingId: string, days = 30) {
  const rows = await db.listingDiscovery.groupBy({
    by: ["source", "term"],
    where: { listingId, day: { gte: dayOf(uaeDate(new Date(), -(days - 1))) } },
    _sum: { impressions: true, views: true },
  });
  const allTerms = rows
    .filter((r) => r.source === "search")
    .map((r) => ({ term: r.term, impressions: r._sum.impressions ?? 0, views: r._sum.views ?? 0 }))
    .sort((a, b) => b.views - a.views || b.impressions - a.impressions || a.term.localeCompare(b.term));
  const terms = allTerms.slice(0, 8);
  const bySource = new Map<string, number>();
  for (const r of rows) bySource.set(r.source, (bySource.get(r.source) ?? 0) + (r._sum.views ?? 0));
  const sources = SOURCES.map((s) => ({ source: s, views: bySource.get(s) ?? 0 })).filter((s) => s.views > 0).sort((a, b) => b.views - a.views);
  return { terms, sources, searches: allTerms.reduce((a, t) => a + t.impressions, 0), moreTerms: Math.max(0, allTerms.length - terms.length) };
}
