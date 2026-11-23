import Link from "next/link";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { SPORTS, market } from "@/lib/constants";
import { num } from "@/lib/format";
import { pickAd, sponsoredListings } from "@/lib/ads";
import { cardInclude, savedIds } from "@/lib/queries";
import { fmt, getI18n } from "@/i18n";
import { ListingCard } from "@/components/ListingCard";
import { AdBanner } from "@/components/Ads";
import { tint } from "@/components/Thumb";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ bye?: string }> }) {
  const { bye } = await searchParams;
  const mk = market();
  const [{ m, locale }, user] = await Promise.all([getI18n(), getUser()]);
  const h = m.home;
  const [counts, recent, sponsored, banner, total] = await Promise.all([
    db.listing.groupBy({ by: ["sport"], where: { status: "ACTIVE", market: mk.code }, _count: true }),
    db.listing.findMany({
      where: { status: "ACTIVE", market: mk.code, OR: [{ sponsoredUntil: null }, { sponsoredUntil: { lt: new Date() } }] },
      orderBy: { createdAt: "desc" }, take: 8, include: cardInclude,
    }),
    sponsoredListings({ take: 4 }),
    pickAd("HOME_BANNER"),
    db.listing.count({ where: { status: "ACTIVE", market: mk.code } }),
  ]);
  const count = Object.fromEntries(counts.map((c) => [c.sport, c._count]));
  const saved = await savedIds(user?.id, recent.map((l) => l.id));

  return (
    <>
      {bye && <div className="wrap" style={{ paddingTop: 16 }}><div className="banner-ok" role="status">{m.account.accountDeleted}</div></div>}
      <section className="hero">
        <svg className="court" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="3">
            <rect x="620" y="40" width="540" height="320" /><line x1="890" y1="40" x2="890" y2="360" />
            <circle cx="890" cy="200" r="70" /><rect x="620" y="120" width="90" height="160" /><rect x="1070" y="120" width="90" height="160" />
          </g>
        </svg>
        <div className="wrap">
          <div className="eyebrow" style={{ color: "var(--volt)" }}>{mk.flag} {fmt(h.liveIn, { country: m.countries.ae })}</div>
          <h1>{h.heroA} <mark>{h.heroB}</mark></h1>
          <p>{h.heroP}</p>
          <form className="hero-search" action="/browse" role="search">
            <input name="q" type="search" placeholder={h.searchPh} aria-label={m.common.searchLabel} />
            <select name="city" aria-label={m.browse.city} defaultValue="">
              <option value="">{fmt(h.all, { country: m.countries.aeShort })}</option>
              {mk.cities.map((c) => <option key={c} value={c}>{m.cities[c]}</option>)}
            </select>
            <button className="btn btn-primary" type="submit">{m.common.search}</button>
          </form>
          <div className="hero-stats">
            <span><b>0%</b>{h.statCommission}</span>
            <span><b>{locale === "ar" ? "0 درهم" : "AED 0"}</b>{h.statPost}</span>
            <span><b>{num(total, locale)}</b>{h.statLive}</span>
          </div>
        </div>
      </section>

      <section className="section"><div className="wrap">
        <div className="section-head"><h2>{h.shopBySport}</h2><Link href="/browse">{h.seeAllListings}</Link></div>
        <div className="sports">
          {SPORTS.map((s) => (
            <Link key={s.id} className="sport" href={`/browse?sport=${s.id}`}>
              <span className="glyph" style={{ background: tint(s.id, 60) }} aria-hidden="true">{s.em}</span>
              <span className="nm">{m.sports[s.id]}</span><span className="ct">{fmt(m.common.listings, { n: count[s.id] ?? 0 })}</span>
            </Link>
          ))}
        </div>
      </div></section>

      <div className="wrap"><AdBanner ad={banner} /></div>

      {sponsored.length > 0 && (
        <section className="section"><div className="wrap">
          <div className="section-head"><h2>{h.fromShops}</h2><span className="note">{h.fromShopsNote}</span></div>
          <div className="grid">{sponsored.map((l) => <ListingCard key={l.id} l={l} />)}</div>
        </div></section>
      )}

      <section className="section"><div className="wrap">
        <div className="section-head"><h2>{h.fresh}</h2><Link href="/browse">{m.common.browseAll}</Link></div>
        {recent.length ? (
          <div className="grid">{recent.map((l) => <ListingCard key={l.id} l={l} saved={saved.has(l.id)} />)}</div>
        ) : (
          <div className="empty"><h3>{h.noListings}</h3><p>{h.beFirst}</p><Link className="btn btn-primary" href="/sell">{m.common.postAdFree}</Link></div>
        )}
      </div></section>

      <section className="section"><div className="wrap">
        <div className="section-head"><h2>{h.howTitle}</h2></div>
        <div className="steps">{h.steps.map((s) => <div key={s.h}><h3>{s.h}</h3><p>{s.p}</p></div>)}</div>
      </div></section>
    </>
  );
}
