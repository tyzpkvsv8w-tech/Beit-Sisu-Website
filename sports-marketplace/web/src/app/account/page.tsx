import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money, timeAgo } from "@/lib/format";
import { fmt, getI18n } from "@/i18n";
import { Thumb } from "@/components/Thumb";
import { ProfileForm } from "@/components/SmallForms";
import { EmailSettings } from "@/components/EmailForms";
import { ConfirmDelete, DeleteAccount } from "@/components/ConfirmDelete";
import { LangSwitch } from "@/components/LangSwitch";
import { InstallButton } from "@/components/AppInstall";
import { PushSettings } from "@/components/PushNotifications";
import { vapidPublicKey } from "@/lib/push";
import { inApp } from "@/lib/app-mode";
import { setListingStatus } from "@/app/actions/listings";
import { logout } from "@/app/actions/auth";
import { unblock } from "@/app/actions/blocks";
import { weeklyViews } from "@/lib/views";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.account.title };
}

export default async function Account({ searchParams }: { searchParams: Promise<{ deleted?: string; phone?: string; password?: string }> }) {
  const me = await requireUser("/account");
  const sp = await searchParams;
  const { m, locale } = await getI18n();
  const t = m.account;
  const blockedPeople = await db.block.findMany({ where: { blockerId: me.id }, include: { blocked: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } });
  const [user, listings] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: me.id } }),
    db.listing.findMany({
      where: { sellerId: me.id, status: { not: "REMOVED" } },
      orderBy: { createdAt: "desc" },
      include: { photos: { orderBy: { position: "asc" }, take: 1 }, _count: { select: { conversations: true, favorites: true } } },
    }),
  ]);
  const thisWeek = await weeklyViews(listings.map((l) => l.id));
  return (
    <div className="wrap section" style={{ display: "grid", gap: 22 }}>
      <div className="toolbar">
        <div><h1>{t.title}</h1><div className="count">{fmt(t.count, { n: listings.length })}</div></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {me.role === "ADMIN" && <Link className="btn btn-ghost" href="/admin">{t.admin}</Link>}
          <Link className="btn btn-ghost m-only" href="/saved">{m.common.saved}</Link>
          <Link className="btn btn-ghost" href="/advertise/bookings">{t.bookings}</Link>
          <Link className="btn btn-primary" href="/sell">+ {m.common.postAd}</Link>
        </div>
      </div>
      {sp.deleted && <div className="banner-ok">{t.deleted}</div>}
      {sp.phone && <div className="banner-ok">{m.auth.phoneAdded}</div>}
      {sp.password && <div className="banner-ok">{m.password.done}</div>}
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
                  <span data-testid="my-ad-stats">{fmt(t.stats, { views: l.views, week: thisWeek.get(l.id) ?? 0, saves: l._count.favorites, chats: l._count.conversations })}</span>
                  <Link href={`/listing/${l.id}#stats`} style={{ color: "var(--accent)" }}>{m.stats.seeStats}</Link>
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
      <div style={{ maxWidth: 620, display: "grid", gap: 16 }}><ProfileForm user={user} /><EmailSettings user={user} /></div>
      <PushSettings publicKey={vapidPublicKey()} />
      <div className="panel" style={{ maxWidth: 620 }} data-testid="blocked-people">
        <h2 style={{ fontSize: 22 }}>{m.block.listTitle}</h2>
        {blockedPeople.length === 0 ? <p className="note" style={{ margin: 0 }}>{m.block.none}</p> : blockedPeople.map((b) => (
          <form key={b.blockedId} action={unblock} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <bdi>{b.blocked.name}</bdi><input type="hidden" name="userId" value={b.blockedId} />
            <button className="btn btn-ghost btn-sm" type="submit">{m.block.unblock}</button>
          </form>
        ))}
      </div>
      {!(await inApp()) && (
        <div className="panel" style={{ maxWidth: 620 }}>
          <h2 style={{ fontSize: 22 }}>{m.app.installApp}</h2>
          <p style={{ margin: 0 }}>{m.app.installText}</p>
          <InstallButton />
        </div>
      )}
      <div className="panel danger-zone" style={{ maxWidth: 620 }} id="delete">
        <h2 style={{ fontSize: 22 }}>{t.deleteTitle}</h2>
        <p style={{ margin: 0 }}>{t.deleteText}</p>
        <DeleteAccount />
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span className="note">{t.language}:</span><LangSwitch className="btn btn-ghost" />
        <form action={logout}><button className="btn btn-ghost" type="submit">{m.common.logOut}</button></form>
      </div>
    </div>
  );
}
