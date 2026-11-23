import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { aed } from "@/lib/pricing";
import { cancelOrder, syncOrder } from "@/lib/campaigns";
import { resumeCheckout } from "@/app/actions/ads";
import { fmt, getI18n } from "@/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.bookings.title };
}

export default async function BookingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string; cancelled?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const me = await requireUser(`/advertise/bookings/${id}`);
  const { m, locale } = await getI18n();
  const t = m.bookings;
  let order = await db.order.findUnique({ where: { id } });
  if (!order || order.userId !== me.id) notFound();
  // Returning from checkout: confirm with the payment provider, or release the dates if they left.
  if (order.status === "PENDING") {
    if (sp.cancelled) await cancelOrder(order.id);
    else await syncOrder(order.id);
    order = (await db.order.findUnique({ where: { id } }))!;
  }
  const full = await db.order.findUniqueOrThrow({ where: { id }, include: { campaign: true, listing: true } });
  const c = full.campaign;
  const day = (d: Date) => d.toLocaleDateString(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dubai" });

  let title = t.pendingTitle, text = t.pendingText, tone = "note";
  if (order.status === "CANCELLED") { title = t.cancelledTitle; text = t.cancelledText; }
  else if (order.status === "REFUNDED") { title = t.rejectedTitle; text = fmt(t.refundedText, { total: aed(order.total, locale) }) + (c?.reviewNote ? " " + fmt(t.reason, { note: c.reviewNote }) : ""); }
  else if (order.status === "PAID" && full.kind === "PROMOTE") { title = t.promotedTitle; text = fmt(t.promotedText, { date: full.listing?.sponsoredUntil ? day(full.listing.sponsoredUntil) : "" }); tone = "ok"; }
  else if (order.status === "PAID" && c?.status === "APPROVED") { title = t.approvedTitle; text = fmt(t.approvedText, { start: day(c.startsAt), end: day(new Date(c.endsAt.getTime() - 1)) }); tone = "ok"; }
  else if (order.status === "PAID") { title = t.paidTitle; text = t.paidText; tone = "ok"; }

  return (
    <div className="wrap section" style={{ maxWidth: 680 }}>
      <div className="form-card">
        <h1 style={{ fontSize: 36, textTransform: "uppercase" }} data-testid="booking-title">{title}</h1>
        <p className={tone} style={{ margin: 0 }}>{text}</p>
        <dl className="specs" style={{ margin: 0 }}>
          <div><dt>{m.book.step4}</dt><dd>{order.description}</dd></div>
          <div><dt>{m.book.total}</dt><dd className="price">{aed(order.total, locale)}</dd></div>
        </dl>
        {order.status === "PAID" && <p className="note" style={{ margin: 0 }}>{fmt(t.paid, { total: aed(order.total, locale), vat: aed(order.vat, locale) })}</p>}
        <p className="note" style={{ margin: 0 }}>{fmt(t.ref, { id: order.id })}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {order.status === "PENDING" && <form action={resumeCheckout}><input type="hidden" name="orderId" value={order.id} /><button className="btn btn-primary" type="submit">{t.pay}</button></form>}
          <Link className="btn btn-ghost" href="/advertise/bookings">{t.back}</Link>
        </div>
      </div>
    </div>
  );
}
