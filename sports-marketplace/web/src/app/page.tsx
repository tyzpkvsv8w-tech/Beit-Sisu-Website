import Link from "next/link";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { SPORTS, market } from "@/lib/constants";
import { pickAd, sponsoredListings } from "@/lib/ads";
import { cardInclude, savedIds } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import { AdBanner } from "@/components/Ads";
import { tint } from "@/components/Thumb";

export const dynamic = "force-dynamic";

export default async function Home() {
  const m = market();
  const user = await getUser();
  const [counts, recent, sponsored, banner, total] = await Promise.all([
    db.listing.groupBy({ by: ["sport"], where: { status: "ACTIVE", market: m.code }, _count: true }),
    db.listing.findMany({ where: { status: "ACTIVE", market: m.code, OR: [{ sponsoredUntil: null }, { sponsoredUntil: { lt: new Date() } }] }, orderBy: { createdAt: "desc" }, take: 8, include: cardInclude }),
    sponsoredListings({ take: 4 }),
    pickAd("HOME_BANNER"),
    db.listing.count({ where: { status: "ACTIVE", market: m.code } }),
  ]);
  const count = Object.fromEntries(counts.map((c) => [c.sport, c._count]));
  const saved = await savedIds(user?.id, recent.map((l) => l.id));

  return (
    <>
      <section className="hero">
        <svg className="court" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="3">
            <rect x="620" y="40" width="540" height="320" /><line x1="890" y1="40" x2="890" y2="360" />
            <circle cx="890" cy="200" r="70" /><rect x="620" y="120" width="90" height="160" /><rect x="1070" y="120" width="90" height="160" />
          </g>
        </svg>
        <div className="wrap">
          <div className="eyebrow" style={{ color: "var(--volt)" }}>{m.flag} Now live in the {m.name}</div>
          <h1>Your old gear, <mark>someone&apos;s next season</mark></h1>
          <p>Buy and sell second-hand sports equipment near you. Posting is free, buying is free, and there are no commission fees. Ever.</p>
          <form className="hero-search" action="/browse" role="search">
            <input name="q" type="search" placeholder="What are you looking for? e.g. padel racket" aria-label="Search" />
            <select name="city" aria-label="Location" defaultValue="">
              <option value="">All {m.short}</option>
              {m.cities.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary" type="submit">Search</button>
          </form>
          <div className="hero-stats"><span><b>0%</b>commission</span><span><b>{m.currency} 0</b>to post an ad</span><span><b>{total.toLocaleString()}</b>live listings</span></div>
        </div>
      </section>

      <section className="section"><div className="wrap">
        <div className="section-head"><h2>Shop by sport</h2><Link href="/browse">See all listings →</Link></div>
        <div className="sports">
          {SPORTS.map((s) => (
            <Link key={s.id} className="sport" href={`/browse?sport=${s.id}`}>
              <span className="glyph" style={{ background: tint(s.id, 60) }} aria-hidden="true">{s.em}</span>
              <span className="nm">{s.name}</span><span className="ct">{count[s.id] ?? 0} listings</span>
            </Link>
          ))}
        </div>
      </div></section>

      <div className="wrap"><AdBanner ad={banner} /></div>

      {sponsored.length > 0 && (
        <section className="section"><div className="wrap">
          <div className="section-head"><h2>From local shops</h2><span className="note">Sponsored. Businesses pay to appear here, which keeps ReKit free.</span></div>
          <div className="grid">{sponsored.map((l) => <ListingCard key={l.id} l={l} />)}</div>
        </div></section>
      )}

      <section className="section"><div className="wrap">
        <div className="section-head"><h2>Fresh listings</h2><Link href="/browse">Browse all →</Link></div>
        {recent.length ? (
          <div className="grid">{recent.map((l) => <ListingCard key={l.id} l={l} saved={saved.has(l.id)} />)}</div>
        ) : (
          <div className="empty"><h3>No listings yet</h3><p>Be the first to sell something.</p><Link className="btn btn-primary" href="/sell">Post an ad, free</Link></div>
        )}
      </div></section>

      <section className="section"><div className="wrap">
        <div className="section-head"><h2>How ReKit works</h2></div>
        <div className="steps">
          <div><h3>Snap & post</h3><p>Add photos, a price and your area. It takes about two minutes and costs nothing.</p></div>
          <div><h3>Chat in the app</h3><p>Buyers message you directly. Your phone number stays hidden unless you choose to show it.</p></div>
          <div><h3>Meet & play</h3><p>Meet somewhere public, check the gear, pay the seller directly. We never take a cut.</p></div>
        </div>
      </div></section>
    </>
  );
}
