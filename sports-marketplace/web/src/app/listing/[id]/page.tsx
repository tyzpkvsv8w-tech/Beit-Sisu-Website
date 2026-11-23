import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { displayPhone, memberSince, money, timeAgo } from "@/lib/format";
import { fmt, getI18n } from "@/i18n";
import { pickAd } from "@/lib/ads";
import { cardInclude, savedIds } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import { AdCard } from "@/components/Ads";
import { FavButton } from "@/components/FavButton";
import { Gallery } from "@/components/Gallery";
import { ReportButton } from "@/components/SmallForms";
import { startConversation } from "@/app/actions/social";
import { paymentsBlockedInApp } from "@/lib/app-mode";
import { setListingStatus } from "@/app/actions/listings";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

async function load(id: string) {
  return db.listing.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { position: "asc" } },
      seller: { select: { id: true, name: true, createdAt: true, phone: true, showPhone: true, isBusiness: true, _count: { select: { listings: { where: { status: "ACTIVE" } } } } } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ m, locale }, l] = await Promise.all([getI18n(), load((await params).id)]);
  if (!l || l.status === "REMOVED") return { title: m.listing.notFound };
  return { title: `${l.title} · ${money(l.price, locale)}`, description: l.description.slice(0, 160) };
}

export default async function ListingPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const l = await load(id);
  if (!l || l.status === "REMOVED") notFound();
  const [user, { m, locale }] = await Promise.all([getUser(), getI18n()]);
  const t = m.listing;
  const mine = user?.id === l.sellerId;
  const sponsored = !!l.sponsoredUntil && l.sponsoredUntil > new Date();
  const sportName = m.sports[l.sport];
  const sep = locale === "ar" ? "‹" : "›";
  if (!mine) await db.listing.update({ where: { id }, data: { views: { increment: 1 } } });

  const [similar, ad, saved] = await Promise.all([
    db.listing.findMany({ where: { sport: l.sport, status: "ACTIVE", id: { not: l.id }, market: l.market }, orderBy: { createdAt: "desc" }, take: 4, include: cardInclude }),
    pickAd("LISTING_SIDE", { sport: l.sport, city: l.city }),
    savedIds(user?.id, [l.id]),
  ]);
  const similarSaved = await savedIds(user?.id, similar.map((x) => x.id));
  const showPhone = l.seller.showPhone && l.seller.phone;

  return (
    <div className="wrap">
      <div className="crumbs"><Link href="/">{m.common.home}</Link>{sep}<Link href={`/browse?sport=${l.sport}`}>{sportName}</Link>{sep}<span>{m.cities[l.city]}</span></div>
      {sp.posted && <div className="banner-ok" style={{ marginTop: 12 }}>{t.postedBanner}</div>}
      {sp.updated && <div className="banner-ok" style={{ marginTop: 12 }}>{t.updatedBanner}</div>}
      {sp.blocked && <div className="legal-draft" style={{ marginTop: 12 }} role="alert">{m.block.cantMessage}</div>}
      <div className="detail">
        <div className="d-left" style={{ display: "grid", gap: 16, minWidth: 0 }}>
          <div className="gallery">
            {l.status === "SOLD" && <div className="sold-banner">{t.soldBanner}</div>}
            <Gallery sport={l.sport} title={l.title} keys={l.photos.map((p) => p.key)} />
          </div>
          <div className="panel d-info">
            <h2 style={{ fontSize: 24, textTransform: "uppercase" }}>{t.details}</h2>
            <dl className="specs" style={{ margin: 0 }}>
              <div><dt>{t.condition}</dt><dd>{m.conditions[l.condition]}</dd></div>
              <div><dt>{t.sport}</dt><dd>{sportName}</dd></div>
              <div><dt>{t.brand}</dt><dd dir="auto">{l.brand || t.notSpecified}</dd></div>
              <div><dt>{t.size}</dt><dd dir="auto">{l.size || t.notSpecified}</dd></div>
              <div><dt>{t.location}</dt><dd>{l.area && <><bdi>{l.area}</bdi>{locale === "ar" ? "، " : ", "}</>}{m.cities[l.city]}</dd></div>
              <div><dt>{t.posted}</dt><dd>{timeAgo(l.createdAt, locale)}</dd></div>
            </dl>
            <h2 style={{ fontSize: 24, textTransform: "uppercase" }}>{t.description}</h2>
            <p className="desc" dir="auto">{l.description}</p>
            {!mine && user && <ReportButton listingId={l.id} />}
          </div>
        </div>
        <div className="side-stack">
          <div className="panel">
            {sponsored && <span className="chip chip-sponsor" style={{ justifySelf: "start" }}>{t.sponsored}</span>}
            <h1 className="d-title" dir="auto">{l.title}</h1>
            <div className="d-price price">{money(l.price, locale)}{l.negotiable && <span className="neg">{t.negotiable}</span>}</div>
            <div className="seller">
              <div className="avatar">{l.seller.name.charAt(0)}</div>
              <div>
                <div className="nm" dir="auto">{l.seller.name}</div>
                <div className="sub">{l.seller.isBusiness ? t.business : fmt(t.memberSince, { date: memberSince(l.seller.createdAt, locale) })} · {l.seller._count.listings === 1 ? t.activeAd1 : fmt(t.activeAds, { n: l.seller._count.listings })}</div>
              </div>
            </div>
            {mine ? (
              <>
                <div className="note">{fmt(t.yourAd, { n: l.views })}</div>
                <Link className="btn btn-primary btn-block" href={`/listing/${l.id}/edit`}>{t.edit}</Link>
                {l.seller.isBusiness && l.status === "ACTIVE" && !(await paymentsBlockedInApp()) && (
                  <Link className="btn btn-volt btn-block" href={`/listing/${l.id}/promote`}>
                    {sponsored ? fmt(m.promote.until, { date: l.sponsoredUntil!.toLocaleDateString(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dubai" }) }) : m.promote.button}
                  </Link>
                )}
                <form action={setListingStatus}>
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="status" value={l.status === "SOLD" ? "ACTIVE" : "SOLD"} />
                  <button className="btn btn-ghost btn-block" type="submit">{l.status === "SOLD" ? t.markAvailable : t.markSold}</button>
                </form>
              </>
            ) : l.status === "SOLD" ? (
              <div className="note">{t.soldNote}</div>
            ) : user ? (
              <>
                <form action={startConversation}>
                  <input type="hidden" name="listingId" value={l.id} />
                  <button className="btn btn-primary btn-block" type="submit">{l.seller.isBusiness ? t.chatStore : t.chatSeller}</button>
                </form>
                <div style={{ display: "grid", gridTemplateColumns: showPhone ? "1fr auto" : "1fr", gap: 8 }}>
                  {showPhone && <div className="btn btn-ghost phone-reveal" style={{ cursor: "text" }} dir="ltr">{displayPhone(l.seller.phone!)}</div>}
                  <FavButton listingId={l.id} initial={saved.has(l.id)} variant="button" />
                </div>
              </>
            ) : (
              <>
                <Link className="btn btn-primary btn-block" href={`/login?next=/listing/${l.id}`}>{t.loginToChat}</Link>
                <div className="note" style={{ textAlign: "center" }}>{t.newHere} <Link href={`/login?next=/listing/${l.id}`} style={{ color: "var(--accent)" }}>{t.createFree}</Link></div>
              </>
            )}
          </div>
          <div className="panel">
            <strong>{t.safetyTitle}</strong>
            <ul className="tips">{t.tips.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <AdCard ad={ad} asCard={false} />
        </div>
      </div>
      {similar.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head"><h2>{fmt(t.more, { sport: sportName })}</h2><Link href={`/browse?sport=${l.sport}`}>{m.common.seeAll}</Link></div>
          <div className="grid">{similar.map((x) => <ListingCard key={x.id} l={x} saved={similarSaved.has(x.id)} />)}</div>
        </section>
      )}
    </div>
  );
}
