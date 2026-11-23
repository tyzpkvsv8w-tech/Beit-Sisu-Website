import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { CONDITIONS, SPORTS, SPORT_BY_ID, market } from "@/lib/constants";
import { pickAd, sponsoredListings } from "@/lib/ads";
import { cardInclude, savedIds } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import { AdCard } from "@/components/Ads";
import { FilterToggle } from "@/components/FilterToggle";

export const metadata: Metadata = { title: "Browse sports gear" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

export default async function Browse({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const m = market();
  const q = one(sp.q).trim().slice(0, 100);
  const sport = SPORT_BY_ID[one(sp.sport)] ? one(sp.sport) : "";
  const city = m.cities.includes(one(sp.city)) ? one(sp.city) : "";
  const conds = many(sp.cond).filter((c) => (CONDITIONS as readonly string[]).includes(c));
  const min = /^\d+$/.test(one(sp.min)) ? +one(sp.min) : undefined;
  const max = /^\d+$/.test(one(sp.max)) ? +one(sp.max) : undefined;
  const sort = ["new", "low", "high"].includes(one(sp.sort)) ? one(sp.sort) : "new";
  const page = Math.max(1, parseInt(one(sp.page)) || 1);

  const where: Prisma.ListingWhereInput = {
    status: "ACTIVE",
    market: m.code,
    ...(sport && { sport }),
    ...(city && { city }),
    ...(conds.length && { condition: { in: conds } }),
    ...((min !== undefined || max !== undefined) && { price: { gte: min, lte: max } }),
    ...(q && { OR: [{ title: { contains: q } }, { brand: { contains: q } }, { description: { contains: q } }, { area: { contains: q } }] }),
  };
  const orderBy: Prisma.ListingOrderByWithRelationInput = sort === "low" ? { price: "asc" } : sort === "high" ? { price: "desc" } : { createdAt: "desc" };

  const user = await getUser();
  const [listings, total, sponsored, ad] = await Promise.all([
    db.listing.findMany({ where, orderBy, include: cardInclude, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
    db.listing.count({ where }),
    page === 1 ? sponsoredListings({ sport: sport || undefined, take: 2 }) : Promise.resolve([]),
    pickAd("INFEED", { sport: sport || undefined, city: city || undefined }),
  ]);
  const saved = await savedIds(user?.id, listings.map((l) => l.id));
  const sponsoredIds = new Set(sponsored.map((s) => s.id));

  // Mix paid placements into results: a sponsored listing first, an ad card after 6, another sponsored after 11.
  const items: React.ReactNode[] = listings.filter((l) => !sponsoredIds.has(l.id)).map((l) => <ListingCard key={l.id} l={l} saved={saved.has(l.id)} />);
  if (items.length) {
    if (sponsored[0]) items.unshift(<ListingCard key={"s" + sponsored[0].id} l={sponsored[0]} />);
    if (ad && items.length > 6) items.splice(6, 0, <AdCard key="ad" ad={ad} />);
    if (sponsored[1] && items.length > 11) items.splice(11, 0, <ListingCard key={"s" + sponsored[1].id} l={sponsored[1]} />);
  }

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base: Record<string, string | undefined> = { q, sport, city, min: min?.toString(), max: max?.toString(), sort: sort === "new" ? undefined : sort };
    Object.entries({ ...base, ...patch }).forEach(([k, v]) => v && p.set(k, v));
    conds.forEach((c) => p.append("cond", c));
    const s = p.toString();
    return s ? `/browse?${s}` : "/browse";
  };
  const pages = Math.ceil(total / PAGE_SIZE);
  const title = sport ? SPORT_BY_ID[sport].name : q ? `“${q}”` : "All sports gear";

  return (
    <div className="wrap section">
      <form className="m-search" action="/browse" role="search">
        <input name="q" type="search" defaultValue={q} placeholder="Search rackets, bikes, golf clubs…" aria-label="Search listings" />
        {sport && <input type="hidden" name="sport" value={sport} />}
      </form>
      <div className="pillbar" role="group" aria-label="Sport">
        <Link href={qs({ sport: undefined, page: undefined })} className={!sport ? "on" : ""}>All</Link>
        {SPORTS.map((s) => (
          <Link key={s.id} href={qs({ sport: s.id, page: undefined })} className={sport === s.id ? "on" : ""}>{s.em} {s.name}</Link>
        ))}
      </div>
      <div className="browse">
        <form className="filters" id="filters" action="/browse">
            <h3>Filters</h3>
            <div className="field"><label htmlFor="fq">Keyword</label><input id="fq" name="q" type="search" defaultValue={q} placeholder="Brand, model, size…" /></div>
            <div className="field"><label htmlFor="fsport">Sport</label>
              <select id="fsport" name="sport" defaultValue={sport}><option value="">All sports</option>{SPORTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div className="field"><label htmlFor="fcity">Emirate / city</label>
              <select id="fcity" name="city" defaultValue={city}><option value="">All {m.short}</option>{m.cities.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="field"><span className="lbl">Price ({m.currency})</span><div className="row2">
              <input id="fmin" name="min" type="number" min={0} inputMode="numeric" placeholder="Min" defaultValue={min} aria-label="Minimum price" />
              <input id="fmax" name="max" type="number" min={0} inputMode="numeric" placeholder="Max" defaultValue={max} aria-label="Maximum price" /></div></div>
            <div className="field"><span className="lbl">Condition</span><div className="conds">
              {CONDITIONS.map((c, i) => <label key={c}><input type="checkbox" id={`fc${i}`} name="cond" value={c} defaultChecked={conds.includes(c)} />{c}</label>)}</div></div>
            <div className="field"><label htmlFor="fsort">Sort</label>
              <select id="fsort" name="sort" defaultValue={sort}><option value="new">Newest first</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div>
            <button className="btn btn-primary" type="submit">Show results</button>
            <Link className="btn btn-ghost" href="/browse">Clear filters</Link>
        </form>
        <div style={{ minWidth: 0 }}>
          <div className="toolbar">
            <div><h1>{title}</h1><div className="count">{total} {total === 1 ? "listing" : "listings"}{city ? ` in ${city}` : ""}</div></div>
            <FilterToggle />
          </div>
          {items.length ? <div className="grid">{items}</div> : (
            <div className="empty"><h3>Nothing here yet</h3><p>Try another sport or widen the price range. Or be the first to list one.</p><Link className="btn btn-primary" href="/sell">Post an ad, free</Link></div>
          )}
          {pages > 1 && (
            <nav className="pager" aria-label="Pages">
              {page > 1 && <Link className="btn btn-ghost" href={qs({ page: String(page - 1) })}>← Previous</Link>}
              <span className="note" style={{ alignSelf: "center" }}>Page {page} of {pages}</span>
              {page < pages && <Link className="btn btn-ghost" href={qs({ page: String(page + 1) })}>Next →</Link>}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
