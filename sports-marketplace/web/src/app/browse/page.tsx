import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { CONDITIONS, SPORTS, SPORT_BY_ID, market } from "@/lib/constants";
import { pickAd, sponsoredListings } from "@/lib/ads";
import { cardInclude, savedIds } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import { AdCard } from "@/components/Ads";
import { FilterToggle } from "@/components/FilterToggle";
import { recordImpressions } from "@/lib/discovery";
import { fmt, getI18n } from "@/i18n";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.browse.metaTitle };
}
export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

export default async function Browse({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const mk = market();
  const { m } = await getI18n();
  const b = m.browse;
  const q = one(sp.q).trim().slice(0, 100);
  const sport = SPORT_BY_ID[one(sp.sport)] ? one(sp.sport) : "";
  const city = mk.cities.includes(one(sp.city)) ? one(sp.city) : "";
  const conds = many(sp.cond).filter((c) => (CONDITIONS as readonly string[]).includes(c));
  const min = /^\d+$/.test(one(sp.min)) ? +one(sp.min) : undefined;
  const max = /^\d+$/.test(one(sp.max)) ? +one(sp.max) : undefined;
  const sort = ["new", "low", "high"].includes(one(sp.sort)) ? one(sp.sort) : "new";
  const page = Math.max(1, parseInt(one(sp.page)) || 1);

  const where: Prisma.ListingWhereInput = {
    status: "ACTIVE",
    market: mk.code,
    ...(sport && { sport }),
    ...(city && { city }),
    ...(conds.length && { condition: { in: conds } }),
    ...((min !== undefined || max !== undefined) && { price: { gte: min, lte: max } }),
    ...(q && {
      OR: (["title", "brand", "description", "area"] as const).map((f) => ({ [f]: { contains: q, mode: "insensitive" as const } })),
    }),
  };
  const orderBy: Prisma.ListingOrderByWithRelationInput = sort === "low" ? { price: "asc" } : sort === "high" ? { price: "desc" } : { createdAt: "desc" };

  const user = await getUser();
  const [listings, total, sponsored, ad] = await Promise.all([
    db.listing.findMany({ where, orderBy, include: cardInclude, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
    db.listing.count({ where }),
    page === 1 ? sponsoredListings({ where, take: 2 }) : Promise.resolve([]),
    pickAd("INFEED", { sport: sport || undefined, city: city || undefined }),
  ]);
  const saved = await savedIds(user?.id, listings.map((l) => l.id));
  if (q) await recordImpressions([...new Set([...sponsored, ...listings].map((l) => l.id))], q);
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
  const title = sport ? m.sports[sport] : q ? `“${q}”` : b.allGear;

  return (
    <div className="wrap section">
      <form className="m-search" action="/browse" role="search">
        <input name="q" type="search" defaultValue={q} placeholder={m.common.searchPh} aria-label={m.common.searchLabel} />
        {sport && <input type="hidden" name="sport" value={sport} />}
      </form>
      <div className="pillbar" role="group" aria-label={b.sport}>
        <Link href={qs({ sport: undefined, page: undefined })} className={!sport ? "on" : ""}>{b.all}</Link>
        {SPORTS.map((s) => (
          <Link key={s.id} href={qs({ sport: s.id, page: undefined })} className={sport === s.id ? "on" : ""}>{s.em} {m.sports[s.id]}</Link>
        ))}
      </div>
      <div className="browse">
        <form className="filters" id="filters" action="/browse">
            <h3>{b.filters}</h3>
            <div className="field"><label htmlFor="fq">{b.keyword}</label><input id="fq" name="q" type="search" defaultValue={q} placeholder={b.keywordPh} /></div>
            <div className="field"><label htmlFor="fsport">{b.sport}</label>
              <select id="fsport" name="sport" defaultValue={sport}><option value="">{b.allSports}</option>{SPORTS.map((s) => <option key={s.id} value={s.id}>{m.sports[s.id]}</option>)}</select></div>
            <div className="field"><label htmlFor="fcity">{b.city}</label>
              <select id="fcity" name="city" defaultValue={city}><option value="">{fmt(b.allCity, { country: m.countries.aeShort })}</option>{mk.cities.map((c) => <option key={c} value={c}>{m.cities[c]}</option>)}</select></div>
            <div className="field"><span className="lbl">{fmt(b.price, { currency: mk.currency })}</span><div className="row2">
              <input id="fmin" name="min" type="number" min={0} inputMode="numeric" placeholder={b.min} defaultValue={min} aria-label={b.minLabel} />
              <input id="fmax" name="max" type="number" min={0} inputMode="numeric" placeholder={b.max} defaultValue={max} aria-label={b.maxLabel} /></div></div>
            <div className="field"><span className="lbl">{b.condition}</span><div className="conds">
              {CONDITIONS.map((c, i) => <label key={c}><input type="checkbox" id={`fc${i}`} name="cond" value={c} defaultChecked={conds.includes(c)} />{m.conditions[c]}</label>)}</div></div>
            <div className="field"><label htmlFor="fsort">{b.sort}</label>
              <select id="fsort" name="sort" defaultValue={sort}><option value="new">{b.newest}</option><option value="low">{b.low}</option><option value="high">{b.high}</option></select></div>
            <button className="btn btn-primary" type="submit">{b.show}</button>
            <Link className="btn btn-ghost" href="/browse">{b.clear}</Link>
        </form>
        <div style={{ minWidth: 0 }}>
          <div className="toolbar">
            <div><h1>{title}</h1><div className="count">{total === 1 ? m.common.listing1 : fmt(m.common.listings, { n: total })}{city ? fmt(b.inCity, { city: m.cities[city] }) : ""}</div></div>
            <FilterToggle />
          </div>
          {items.length ? <div className="grid">{items}</div> : (
            <div className="empty"><h3>{b.emptyTitle}</h3><p>{b.emptyText}</p><Link className="btn btn-primary" href="/sell">{m.common.postAdFree}</Link></div>
          )}
          {pages > 1 && (
            <nav className="pager" aria-label={b.pages}>
              {page > 1 && <Link className="btn btn-ghost" href={qs({ page: String(page - 1) })}>{b.prev}</Link>}
              <span className="note" style={{ alignSelf: "center" }}>{fmt(b.pageOf, { page, pages })}</span>
              {page < pages && <Link className="btn btn-ghost" href={qs({ page: String(page + 1) })}>{b.next}</Link>}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
