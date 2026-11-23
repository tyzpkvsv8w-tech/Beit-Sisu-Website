import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money, timeAgo } from "@/lib/format";
import { fmt, getI18n } from "@/i18n";
import { Thumb } from "@/components/Thumb";
import { ProfileForm } from "@/components/SmallForms";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { LangSwitch } from "@/components/LangSwitch";
import { setListingStatus } from "@/app/actions/listings";
import { logout } from "@/app/actions/auth";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.account.title };
}

export default async function Account({ searchParams }: { searchParams: Promise<{ deleted?: string; phone?: string }> }) {
  const me = await requireUser("/account");
  const sp = await searchParams;
  const { m, locale } = await getI18n();
  const t = m.account;
  const [user, listings] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: me.id } }),
    db.listing.findMany({
      where: { sellerId: me.id, status: { not: "REMOVED" } },
      orderBy: { createdAt: "desc" },
      include: { photos: { orderBy: { position: "asc" }, take: 1 }, _count: { select: { conversations: true, favorites: true } } },
    }),
  ]);
  return (
    <div className="wrap section" style={{ display: "grid", gap: 22 }}>
      <div className="toolbar">
        <div><h1>{t.title}</h1><div className="count">{fmt(t.count, { n: listings.length })}</div></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {me.role === "ADMIN" && <Link className="btn btn-ghost" href="/admin">{t.admin}</Link>}
          <Link className="btn btn-ghost m-only" href="/saved">{m.common.saved}</Link>
          <Link className="btn btn-primary" href="/sell">+ {m.common.postAd}</Link>
        </div>
      </div>
      {sp.deleted && <div className="banner-ok">{t.deleted}</div>}
      {sp.phone && <div className="banner-ok">{m.auth.phoneAdded}</div>}
      {listings.length ? (
        <div className="mylist">
          {listings.map((l) => (
            <div className="myrow" key={l.id}>
              <Thumb sport={l.sport} photoKey={l.photos[0]?.key} alt="" />
              <div style={{ minWidth: 0 }}>
                <Link className="t" href={`/listing/${l.id}`} dir="auto">{l.title}</Link>
                <div className="s">
                  <span className={`status-pill status-${l.status}`}>{l.status === "ACTIVE" ? t.live : t.sold}</span>
                  <strong className="price">{money(l.price, locale)}</strong>
                  <span>{timeAgo(l.createdAt, locale)}</span>
                  <span>{fmt(t.stats, { views: l.views, saves: l._count.favorites, chats: l._count.conversations })}</span>
                </div>
              </div>
              <div className="acts">
                <Link className="btn btn-ghost btn-sm" href={`/listing/${l.id}/edit`}>{t.edit}</Link>
                <form action={setListingStatus}>
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="status" value={l.status === "SOLD" ? "ACTIVE" : "SOLD"} />
                  <button className="btn btn-ghost btn-sm" type="submit">{l.status === "SOLD" ? t.relist : t.markSold}</button>
                </form>
                <ConfirmDelete id={l.id} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty"><h3>{t.noAds}</h3><p>{t.noAdsText}</p><Link className="btn btn-primary" href="/sell">{m.common.postAdFree}</Link></div>
      )}
      <div style={{ maxWidth: 620 }}><ProfileForm user={user} /></div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span className="note">{t.language}:</span><LangSwitch className="btn btn-ghost" />
        <form action={logout}><button className="btn btn-ghost" type="submit">{m.common.logOut}</button></form>
      </div>
    </div>
  );
}
