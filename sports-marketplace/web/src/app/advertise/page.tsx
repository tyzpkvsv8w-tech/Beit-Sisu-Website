import { SPORTS, market, MARKETS } from "@/lib/constants";
import { EnquiryForm } from "@/components/SmallForms";
import { db } from "@/lib/db";

export const metadata = { title: "Advertise on ReKit" };
export const dynamic = "force-dynamic";

const PRODUCTS = [
  { h: "Homepage banner", where: "Top of the home page", rate: "3,500", per: "per week", pts: ["Full-width banner seen by every visitor", "Website and app", "One advertiser at a time"] },
  { h: "Sport takeover", where: "One sport category", rate: "1,500", per: "per week", best: true, pts: ["Banner and in-feed ads in one sport, e.g. Padel", "Reach buyers already shopping that sport", "Ideal for clubs, coaches and specialist shops"] },
  { h: "Sponsored listings", where: "In search results", rate: "75", per: "per listing / week", pts: ["Your stock shown at the top of matching searches", "Labelled 'Sponsored'", "For businesses only. Private sellers never pay."] },
  { h: "Listing-page ads", where: "Beside listing details", rate: "25", per: "per 1,000 views (CPM)", pts: ["Targeted by sport and emirate", "Pay only for impressions served", "Click and view reporting"] },
  { h: "Newsletter feature", where: "Weekly 'Fresh Gear' email", rate: "1,200", per: "per send", pts: ["Featured slot in the weekly email", "Segmented by sport interest", "Includes click report"] },
  { h: "Event & club partner", where: "Site-wide", rate: "Custom", per: "", pts: ["Race, tournament or academy launches", "Co-branded collections", "Talk to us for a package"] },
];

export default async function Advertise() {
  const m = market();
  const [listings, users] = await Promise.all([
    db.listing.count({ where: { status: "ACTIVE", market: m.code } }),
    db.user.count(),
  ]);
  return (
    <>
      <section className="adv-hero"><div className="wrap">
        <div className="eyebrow" style={{ color: "inherit", opacity: 0.8 }}>ReKit for business</div>
        <h1>Reach people who are buying sports gear right now</h1>
        <p>Everyone who visits ReKit is shopping for a sport they play. Put your shop, club, academy or event in front of them, targeted by sport and emirate.</p>
        <div><a className="btn btn-volt" href="#enquire">Request a media kit</a></div>
      </div></section>
      <section className="section"><div className="wrap">
        <div className="adv-stats">
          <div className="stat"><b>{listings.toLocaleString()}</b><span>live listings</span></div>
          <div className="stat"><b>{users.toLocaleString()}</b><span>registered members</span></div>
          <div className="stat"><b>{SPORTS.length}</b><span>sport categories to target</span></div>
          <div className="stat"><b>{Object.keys(MARKETS).length}</b><span>GCC markets on the roadmap</span></div>
        </div>
        <p className="note">Rates are starting prices in {m.currency}, excluding VAT.</p>
      </div></section>
      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="section-head"><h2>Ad products</h2></div>
        <div className="products">
          {PRODUCTS.map((p) => (
            <div key={p.h} className={`product${p.best ? " best" : ""}`}>
              {p.best && <span className="chip chip-new" style={{ justifySelf: "start" }}>Most popular</span>}
              <div className="where">{p.where}</div><h3>{p.h}</h3>
              <div className="rate price">{p.rate === "Custom" ? "Custom" : `${m.currency} ${p.rate}`} <small>{p.per}</small></div>
              <ul>{p.pts.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          ))}
        </div>
      </div></section>
      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="section-head"><h2>Our ad rules</h2></div>
        <div className="principles">
          <div><h3>Always labelled</h3><p>Every paid placement says &quot;Ad&quot; or &quot;Sponsored&quot;. Users can always tell.</p></div>
          <div><h3>Sport only</h3><p>We accept sport, fitness and outdoor advertisers. No gambling, no unrelated pop-ups.</p></div>
          <div><h3>Never in the way</h3><p>Ads sit beside listings, never over them. No autoplay video, no full-screen interstitials.</p></div>
        </div>
      </div></section>
      <section className="section" style={{ paddingTop: 0 }} id="enquire"><div className="wrap" style={{ maxWidth: 720 }}>
        <EnquiryForm />
      </div></section>
    </>
  );
}
