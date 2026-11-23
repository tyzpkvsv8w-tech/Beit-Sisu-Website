import "server-only";
import type { AdCampaign } from "@prisma/client";
import { db } from "./db";
import { appUrl } from "./app";
import { sendEmail } from "./email";
import { checkoutStatus, expireCheckout, refundPayment } from "./payments";
import { HOLD_MINUTES } from "./pricing";
import { orderDecisionEmail, paymentReceivedEmail } from "./email-templates";

/** Placements that only one advertiser can hold at a time (per sport, for takeovers). */
const EXCLUSIVE = ["HOME_BANNER", "SPORT_TAKEOVER"];

/** Campaigns that overlap the dates and hold the slot: approved, waiting for review, or unpaid within the hold window. */
export async function slotConflicts(placement: string, sport: string | null, start: Date, end: Date, excludeId?: string) {
  if (!EXCLUSIVE.includes(placement)) return [];
  return db.adCampaign.findMany({
    where: {
      placement,
      ...(placement === "SPORT_TAKEOVER" ? { sport } : {}),
      id: excludeId ? { not: excludeId } : undefined,
      startsAt: { lt: end },
      endsAt: { gt: start },
      OR: [
        { status: { in: ["APPROVED", "IN_REVIEW"] } },
        { status: "PENDING_PAYMENT", createdAt: { gt: new Date(Date.now() - HOLD_MINUTES * 60e3) } },
      ],
    },
    select: { id: true, startsAt: true, endsAt: true },
  });
}

/** Upcoming taken dates, shown on the booking form so advertisers can pick free weeks. */
export async function bookedRanges() {
  const rows = await db.adCampaign.findMany({
    where: {
      placement: { in: EXCLUSIVE },
      endsAt: { gt: new Date() },
      OR: [{ status: { in: ["APPROVED", "IN_REVIEW"] } }, { status: "PENDING_PAYMENT", createdAt: { gt: new Date(Date.now() - HOLD_MINUTES * 60e3) } }],
    },
    orderBy: { startsAt: "asc" },
    select: { placement: true, sport: true, startsAt: true, endsAt: true },
  });
  return rows.map((r) => ({ placement: r.placement, sport: r.sport, start: r.startsAt.toISOString(), end: r.endsAt.toISOString() }));
}

async function userEmail(userId: string | null) {
  if (!userId) return null;
  const u = await db.user.findUnique({ where: { id: userId } });
  return u?.email && u.emailVerifiedAt ? u : null;
}

/** Marks an order paid and fulfils it. Safe to call twice (webhook and return page can race). */
export async function markPaid(orderId: string, paymentId: string | undefined) {
  const { count } = await db.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "PAID", paidAt: new Date(), providerPaymentId: paymentId ?? null },
  });
  if (count === 0) return;
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { listing: true } });
  let promotedUntil: Date | null = null;
  if (order.kind === "CAMPAIGN" && order.campaignId) {
    await db.adCampaign.update({ where: { id: order.campaignId }, data: { status: "IN_REVIEW" } });
  } else if (order.kind === "PROMOTE" && order.listing) {
    const from = order.listing.sponsoredUntil && order.listing.sponsoredUntil > new Date() ? order.listing.sponsoredUntil : new Date();
    promotedUntil = new Date(from.getTime() + order.weeks * 7 * 86400e3);
    await db.listing.update({ where: { id: order.listing.id }, data: { sponsoredUntil: promotedUntil } });
  }
  const u = await userEmail(order.userId);
  if (u) {
    await sendEmail(paymentReceivedEmail({
      to: u.email!, name: u.name, locale: u.locale, item: order.description, total: order.total, promotedUntil,
      url: `${appUrl()}/advertise/bookings/${order.id}`,
    })).catch((e) => console.error("Receipt email failed", e));
  }
}

/** The buyer left checkout, or it expired: release the dates. */
export async function cancelOrder(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "PENDING") return;
  if (order.providerSessionId) await expireCheckout(order.providerSessionId);
  const { count } = await db.order.updateMany({ where: { id: orderId, status: "PENDING" }, data: { status: "CANCELLED" } });
  if (count && order.campaignId) await db.adCampaign.update({ where: { id: order.campaignId }, data: { status: "CANCELLED" } });
}

/** Brings a pending order up to date by asking the payment provider. */
export async function syncOrder(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "PENDING" || !order.providerSessionId || order.provider !== "stripe") return;
  const s = await checkoutStatus(order.providerSessionId).catch(() => null);
  if (s?.paid) await markPaid(order.id, s.paymentId);
  else if (s?.expired) await cancelOrder(order.id);
}

export async function approveCampaign(campaignId: string) {
  const c = await db.adCampaign.update({ where: { id: campaignId }, data: { status: "APPROVED", reviewNote: null } });
  await notifyDecision(c, true);
}

/** Rejects a booking and refunds it in full if it was paid. */
export async function rejectCampaign(campaignId: string, note: string) {
  const c = await db.adCampaign.update({ where: { id: campaignId }, data: { status: "REJECTED", reviewNote: note || null } });
  const paid = await db.order.findFirst({ where: { campaignId, status: "PAID" } });
  let refunded: number | null = null;
  if (paid) {
    if (paid.providerPaymentId) await refundPayment(paid.providerPaymentId);
    await db.order.update({ where: { id: paid.id }, data: { status: "REFUNDED", refundedAt: new Date() } });
    refunded = paid.total;
  }
  await notifyDecision(c, false, refunded);
}

async function notifyDecision(c: AdCampaign, approved: boolean, refunded: number | null = null) {
  const u = await userEmail(c.ownerId);
  if (!u) return;
  const order = await db.order.findFirst({ where: { campaignId: c.id }, orderBy: { createdAt: "desc" } });
  await sendEmail(orderDecisionEmail({
    to: u.email!, name: u.name, locale: u.locale, approved, headline: c.headline, start: c.startsAt, end: c.endsAt,
    note: c.reviewNote, refunded, url: `${appUrl()}/advertise/bookings/${order?.id ?? ""}`,
  })).catch((e) => console.error("Decision email failed", e));
}
