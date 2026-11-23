import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { sportOf } from "@/lib/constants";
import { memberSince, money, timeAgo } from "@/lib/format";
import { pickAd } from "@/lib/ads";
import { cardInclude, savedIds } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import { AdCard } from "@/components/Ads";
import { FavButton } from "@/components/FavButton";
import { Gallery } from "@/components/Gallery";
import { ReportButton } from "@/components/SmallForms";
import { startConversation } from "@/app/actions/social";
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
  const l = await load((await params).id);
  if (!l || l.status === "REMOVED") return { title: "Listing not found" };
  return { title: `${l.title} · ${money(l.price)}`, description: l.description.slice(0, 160) };
}

export default async function ListingPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const l = await load(id);
  if (!l || l.status === "REMOVED") notFound();
  const user = await getUser();
  const mine = user?.id === l.sellerId;
  const sponsored = !!l.sponsoredUntil && l.sponsoredUntil > new Date();
  const s = sportOf(l.sport);
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
      <div className="crumbs"><Link href="/">Home</Link>›<Link href={`/browse?sport=${s.id}`}>{s.name}</Link>›<span>{l.city}</span></div>
      {sp.posted && <div className="banner-ok" style={{ marginTop: 12 }}>Your ad is live. Share the link or wait for buyers to message you.</div>}
      {sp.updated && <div className="banner-ok" style={{ marginTop: 12 }}>Changes saved.</div>}
      <div className="detail">
        <div className="d-left" style={{ display: "grid", gap: 16, minWidth: 0 }}>
          <div className="gallery">
            {l.status === "SOLD" && <div className="sold-banner">Sold</div>}
            <Gallery sport={l.sport} title={l.title} keys={l.photos.map((p) => p.key)} />
          </div>
          <div className="panel d-info">
            <h2 style={{ fontSize: 24, textTransform: "uppercase" }}>Details</h2>
            <dl className="specs" style={{ margin: 0 }}>
              <div><dt>Condition</dt><dd>{l.condition}</dd></div>
              <div><dt>Sport</dt><dd>{s.name}</dd></div>
              <div><dt>Brand / model</dt><dd>{l.brand || "Not specified"}</dd></div>
              <div><dt>Size / spec</dt><dd>{l.size || "Not specified"}</dd></div>
              <div><dt>Location</dt><dd>{l.area ? `${l.area}, ` : ""}{l.city}</dd></div>
              <div><dt>Posted</dt><dd>{timeAgo(l.createdAt)}</dd></div>
            </dl>
            <h2 style={{ fontSize: 24, textTransform: "uppercase" }}>Description</h2>
            <p className="desc">{l.description}</p>
            {!mine && user && <ReportButton listingId={l.id} />}
          </div>
        </div>
        <div className="side-stack">
          <div className="panel">
            {sponsored && <span className="chip chip-sponsor" style={{ justifySelf: "start" }}>Sponsored</span>}
            <h1 className="d-title">{l.title}</h1>
            <div className="d-price price">{money(l.price, l.market)}{l.negotiable && <span className="neg">Price negotiable</span>}</div>
            <div className="seller">
              <div className="avatar">{l.seller.name.charAt(0)}</div>
              <div>
                <div className="nm">{l.seller.name}</div>
                <div className="sub">{l.seller.isBusiness ? "Business" : `Member since ${memberSince(l.seller.createdAt)}`} · {l.seller._count.listings} active {l.seller._count.listings === 1 ? "ad" : "ads"}</div>
              </div>
            </div>
            {mine ? (
              <>
                <div className="note">This is your ad. {l.views} {l.views === 1 ? "view" : "views"} so far.</div>
                <Link className="btn btn-primary btn-block" href={`/listing/${l.id}/edit`}>Edit ad</Link>
                <form action={setListingStatus}>
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="status" value={l.status === "SOLD" ? "ACTIVE" : "SOLD"} />
                  <button className="btn btn-ghost btn-block" type="submit">{l.status === "SOLD" ? "Mark as available again" : "Mark as sold"}</button>
                </form>
              </>
            ) : l.status === "SOLD" ? (
              <div className="note">This item has been sold.</div>
            ) : user ? (
              <>
                <form action={startConversation}>
                  <input type="hidden" name="listingId" value={l.id} />
                  <button className="btn btn-primary btn-block" type="submit">Chat with {l.seller.isBusiness ? "store" : "seller"}</button>
                </form>
                <div style={{ display: "grid", gridTemplateColumns: showPhone ? "1fr auto" : "1fr", gap: 8 }}>
                  {showPhone && <div className="btn btn-ghost phone-reveal" style={{ cursor: "text" }}>{l.seller.phone}</div>}
                  <FavButton listingId={l.id} initial={saved.has(l.id)} variant="button" />
                </div>
              </>
            ) : (
              <>
                <Link className="btn btn-primary btn-block" href={`/login?next=/listing/${l.id}`}>Log in to chat with the seller</Link>
                <div className="note" style={{ textAlign: "center" }}>New here? <Link href={`/signup?next=/listing/${l.id}`} style={{ color: "var(--accent)" }}>Create a free account</Link></div>
              </>
            )}
          </div>
          <div className="panel">
            <strong>Stay safe when you meet</strong>
            <ul className="tips"><li>Meet in a public place, such as a mall or your sports club.</li><li>Check the gear in person before you pay.</li><li>Never send a deposit or pay by transfer to someone you haven&apos;t met.</li><li>ReKit will never ask for your bank details.</li></ul>
          </div>
          <AdCard ad={ad} asCard={false} />
        </div>
      </div>
      {similar.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head"><h2>More {s.name}</h2><Link href={`/browse?sport=${s.id}`}>See all →</Link></div>
          <div className="grid">{similar.map((x) => <ListingCard key={x.id} l={x} saved={similarSaved.has(x.id)} />)}</div>
        </section>
      )}
    </div>
  );
}
