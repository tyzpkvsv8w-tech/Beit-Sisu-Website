import type { AdCampaign } from "@prisma/client";
import { sportOf } from "@/lib/constants";

export function AdBanner({ ad }: { ad: AdCampaign | null }) {
  if (!ad) return <HouseAd />;
  return (
    <div className="ad ad-leader">
      <span className="ad-label">Advertisement</span>
      <div className="brand">{ad.advertiser}</div>
      <div className="msg"><strong>{ad.headline}</strong>{ad.body}</div>
      <a className="btn btn-primary" href={`/go/${ad.id}`} rel="sponsored noopener" target="_blank">{ad.ctaLabel}</a>
    </div>
  );
}

export function AdCard({ ad, asCard = true }: { ad: AdCampaign | null; asCard?: boolean }) {
  if (!ad) return null;
  return (
    <div className={asCard ? "card ad ad-card" : "ad"} style={asCard ? undefined : { position: "relative" }}>
      <span className="ad-label">Ad</span>
      <div className="ad-mpu">
        {ad.sport && <div className="eyebrow">{sportOf(ad.sport).name}</div>}
        <div className="brand">{ad.advertiser}</div>
        <strong>{ad.headline}</strong>
        <div className="note">{ad.body}</div>
        <a className="btn btn-ghost" href={`/go/${ad.id}`} rel="sponsored noopener" target="_blank">{ad.ctaLabel}</a>
      </div>
    </div>
  );
}

/** Shown when no campaign is booked for a slot: sells the slot itself. */
function HouseAd() {
  return (
    <div className="ad ad-leader">
      <span className="ad-label">Advertise here</span>
      <div className="brand">Your brand</div>
      <div className="msg"><strong>Reach people shopping for sports gear</strong>This space is available. Target by sport and emirate.</div>
      <a className="btn btn-primary" href="/advertise">See ad options</a>
    </div>
  );
}
