import { SPORTS, market, MARKETS } from "@/lib/constants";
import { num } from "@/lib/format";
import { db } from "@/lib/db";
import { fmt, getI18n } from "@/i18n";
import { EnquiryForm } from "@/components/SmallForms";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.advertise.metaTitle };
}
export const dynamic = "force-dynamic";

export default async function Advertise() {
  const mk = market();
  const { m, locale } = await getI18n();
  const a = m.advertise;
  const [listings, users] = await Promise.all([db.listing.count({ where: { status: "ACTIVE", market: mk.code } }), db.user.count()]);
  const rate = (r: string) => (!r ? a.custom : locale === "ar" ? `${r} درهم` : `AED ${r}`);
  return (
    <>
      <section className="adv-hero"><div className="wrap">
        <div className="eyebrow" style={{ color: "inherit", opacity: 0.8 }}>{a.eyebrow}</div>
        <h1>{a.title}</h1>
        <p>{a.text}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><a className="btn btn-volt" href="/advertise/book">{a.bookOnline}</a><a className="btn btn-ghost" href="#enquire">{a.kit}</a></div>
        <p style={{ fontSize: 14 }}>{a.bookNote}</p>
      </div></section>
      <section className="section"><div className="wrap">
        <div className="adv-stats">
          <div className="stat"><b>{num(listings, locale)}</b><span>{a.statListings}</span></div>
          <div className="stat"><b>{num(users, locale)}</b><span>{a.statMembers}</span></div>
          <div className="stat"><b>{SPORTS.length}</b><span>{a.statSports}</span></div>
          <div className="stat"><b>{Object.keys(MARKETS).length}</b><span>{a.statMarkets}</span></div>
        </div>
        <p className="note">{fmt(a.rateNote, { currency: locale === "ar" ? "درهم" : mk.currency })}</p>
      </div></section>
      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="section-head"><h2>{a.products}</h2></div>
        <div className="products">
          {a.items.map((p, i) => (
            <div key={p.h} className={`product${i === 1 ? " best" : ""}`}>
              {i === 1 && <span className="chip chip-new" style={{ justifySelf: "start" }}>{a.popular}</span>}
              <div className="where">{p.where}</div><h3>{p.h}</h3>
              <div className="rate price">{rate(p.rate)} <small>{p.per}</small></div>
              <ul>{p.pts.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          ))}
        </div>
      </div></section>
      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="section-head"><h2>{a.rulesTitle}</h2></div>
        <div className="principles">{a.rules.map((r) => <div key={r.h}><h3>{r.h}</h3><p>{r.p}</p></div>)}</div>
      </div></section>
      <section className="section" style={{ paddingTop: 0 }} id="enquire"><div className="wrap" style={{ maxWidth: 720 }}>
        <EnquiryForm />
      </div></section>
    </>
  );
}
