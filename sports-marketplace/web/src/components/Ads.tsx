import type { AdCampaign } from "@prisma/client";
import { getI18n } from "@/i18n";

// Advertiser copy is shown as the advertiser wrote it; the labels around it are translated.

export async function AdBanner({ ad }: { ad: AdCampaign | null }) {
  const { m } = await getI18n();
  if (!ad) {
    return (
      <div className="ad ad-leader">
        <span className="ad-label">{m.ads.advertiseHere}</span>
        <div className="brand">{m.ads.yourBrand}</div>
        <div className="msg"><strong>{m.ads.houseHead}</strong>{m.ads.houseBody}</div>
        <a className="btn btn-primary" href="/advertise">{m.ads.houseCta}</a>
      </div>
    );
  }
  return (
    <div className="ad ad-leader">
      <span className="ad-label">{m.ads.advertisement}</span>
      <div className="brand" dir="auto">{ad.advertiser}</div>
      <div className="msg" dir="auto"><strong>{ad.headline}</strong>{ad.body}</div>
      <a className="btn btn-primary" href={`/go/${ad.id}`} rel="sponsored noopener" target="_blank">{ad.ctaLabel}</a>
    </div>
  );
}

export async function AdCard({ ad, asCard = true }: { ad: AdCampaign | null; asCard?: boolean }) {
  const { m } = await getI18n();
  if (!ad) return null;
  return (
    <div className={asCard ? "card ad ad-card" : "ad"} style={asCard ? undefined : { position: "relative" }}>
      <span className="ad-label">{m.ads.ad}</span>
      <div className="ad-mpu" dir="auto">
        {ad.sport && <div className="eyebrow">{m.sports[ad.sport]}</div>}
        <div className="brand">{ad.advertiser}</div>
        <strong>{ad.headline}</strong>
        <div className="note">{ad.body}</div>
        <a className="btn btn-ghost" href={`/go/${ad.id}`} rel="sponsored noopener" target="_blank">{ad.ctaLabel}</a>
      </div>
    </div>
  );
}
