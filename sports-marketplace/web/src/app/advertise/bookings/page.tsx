import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { aed } from "@/lib/pricing";
import { fmt, getI18n } from "@/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.bookings.title };
}

export default async function Bookings() {
  const me = await requireUser("/advertise/bookings");
  const { m, locale } = await getI18n();
  const t = m.bookings;
  const orders = await db.order.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    include: { campaign: true, listing: { select: { title: true, sponsoredUntil: true } } },
  });
  const day = (d: Date) => d.toLocaleDateString(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dubai" });
  const now = new Date();
  return (
    <div className="wrap section" style={{ maxWidth: 900 }}>
      <div className="toolbar"><div><h1>{t.title}</h1></div><Link className="btn btn-primary" href="/advertise/book">{t.book}</Link></div>
      {orders.length === 0 ? <div className="empty"><h3>{t.empty}</h3><Link className="btn btn-primary" href="/advertise/book">{t.book}</Link></div> : (
        <div className="mylist">
          {orders.map((o) => {
            const c = o.campaign;
            const status = c ? t.status[c.status] : t.orderStatus[o.status];
            const timing = c && c.status === "APPROVED"
              ? (c.endsAt < now ? t.ended : c.startsAt > now ? fmt(t.scheduled, { date: day(c.startsAt) }) : c.active ? t.live : t.paused)
              : null;
            return (
              <Link key={o.id} href={`/advertise/bookings/${o.id}`} className="myrow booking-row">
                <div style={{ minWidth: 0 }}>
                  <span className="t" dir="auto">{c ? c.headline : o.listing?.title ?? o.description}</span>
                  <div className="s">
                    <span className={`status-pill ${c?.status === "APPROVED" || o.status === "PAID" ? "status-ACTIVE" : "status-SOLD"}`}>{status}</span>
                    <span>{o.description}</span>
                    {timing && <span>{timing}</span>}
                    {c && c.status === "APPROVED" && <span>{fmt(t.stats, { views: c.impressions, clicks: c.clicks })}</span>}
                  </div>
                </div>
                <strong className="price">{aed(o.total, locale)}</strong>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
