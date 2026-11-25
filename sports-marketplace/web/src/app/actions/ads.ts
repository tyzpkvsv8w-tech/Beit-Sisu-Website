"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { appUrl } from "@/lib/app";
import { SPORT_BY_ID } from "@/lib/constants";
import { BOOKABLE, HOLD_MINUTES, MAX_WEEKS, PROMOTE_WEEKLY, quote, uaeDate, uaeMidnight, type BookableProduct } from "@/lib/pricing";
import { createCheckout, paymentDriver } from "@/lib/payments";
import { approveCampaign, cancelOrder, markPaid, rejectCampaign, slotConflicts } from "@/lib/campaigns";
import { COMPANY } from "@/legal/company";
import { fmt, getI18n } from "@/i18n";
import type { Messages } from "@/i18n/en";
import type { FormState } from "./auth";
import { paymentsBlockedInApp } from "@/lib/app-mode";

const WEEK = 7 * 86400e3;

function creativeSchema(m: Messages) {
  return {
    advertiser: z.string().trim().min(2, m.errors.advertiser).max(40, m.errors.advertiser),
    headline: z.string().trim().min(3, m.errors.headline).max(60, m.errors.headline),
    body: z.string().trim().min(3, m.errors.adBody).max(140, m.errors.adBody),
    ctaLabel: z.string().trim().min(2, m.errors.cta).max(20, m.errors.cta),
    ctaUrl: z.string().trim().url(m.errors.ctaUrl).max(300).refine((u) => u.startsWith("https://"), m.errors.ctaUrl),
  };
}

const weeksText = (m: Messages, n: number) => (n === 1 ? m.book.week1 : fmt(m.book.weeksN, { n }));

/** Lines shown on the payment page: the item, then VAT as its own line. */
function lines(m: Messages, name: string, q: ReturnType<typeof quote>) {
  return [{ name, amount: q.subtotal }, ...(q.vat ? [{ name: fmt(m.book.vat, { rate: Math.round(COMPANY.vatRate * 100) }), amount: q.vat }] : [])];
}

async function startCheckout(orderId: string, name: string, q: ReturnType<typeof quote>, m: Messages, email: string | null) {
  const { sessionId, url } = await createCheckout({
    orderId,
    lines: lines(m, name, q),
    customerEmail: email,
    successUrl: `${appUrl()}/advertise/bookings/${orderId}?paid=1`,
    cancelUrl: `${appUrl()}/advertise/bookings/${orderId}?cancelled=1`,
    expiresInMinutes: HOLD_MINUTES,
  });
  await db.order.update({ where: { id: orderId }, data: { providerSessionId: sessionId } });
  return url;
}

/** Self-serve booking: holds the dates, then sends the advertiser to pay. */
export async function bookCampaign(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser("/advertise/book");
  const { m } = await getI18n();
  if (await paymentsBlockedInApp()) return { error: m.errors.appPayments };
  const parsed = z.object({
    product: z.enum(["HOME_BANNER", "SPORT_TAKEOVER"], { errorMap: () => ({ message: m.errors.product }) }),
    sport: z.string().optional(),
    start: z.string({ required_error: m.errors.bookingStart }).regex(/^\d{4}-\d{2}-\d{2}$/, m.errors.bookingStart),
    weeks: z.coerce.number().int().min(1, m.errors.bookingWeeks).max(MAX_WEEKS, m.errors.bookingWeeks),
    terms: z.literal("on", { errorMap: () => ({ message: m.errors.adTerms }) }),
    ...creativeSchema(m),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const product = d.product as BookableProduct;
  const sport = BOOKABLE[product].needsSport ? d.sport : null;
  if (BOOKABLE[product].needsSport && !(sport && sport in SPORT_BY_ID)) return { error: m.errors.sport };
  if (d.start < uaeDate(new Date(), 1) || d.start > uaeDate(new Date(), 365)) return { error: m.errors.bookingStart };
  const startsAt = uaeMidnight(d.start);
  const endsAt = new Date(startsAt.getTime() + d.weeks * WEEK);
  if ((await slotConflicts(product, sport ?? null, startsAt, endsAt)).length) return { error: m.errors.slotTaken };

  const q = quote(BOOKABLE[product].weekly, d.weeks);
  const name = fmt(m.book.line, {
    product: m.book.products[product].name + (sport ? ` (${m.sports[sport]})` : ""),
    weeks: weeksText(m, d.weeks),
  });
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  const campaign = await db.adCampaign.create({
    data: {
      advertiser: d.advertiser, headline: d.headline, body: d.body, ctaLabel: d.ctaLabel, ctaUrl: d.ctaUrl,
      placement: product, sport, startsAt, endsAt, status: "PENDING_PAYMENT", ownerId: me.id,
    },
  });
  const order = await db.order.create({
    data: { userId: me.id, kind: "CAMPAIGN", campaignId: campaign.id, description: name, weeks: d.weeks, ...q, provider: paymentDriver() },
  });
  let url: string;
  try {
    url = await startCheckout(order.id, name, q, m, user.emailVerifiedAt ? user.email : null);
  } catch (e) {
    console.error("Checkout failed", e);
    await cancelOrder(order.id);
    return { error: m.errors.paymentFailed };
  }
  redirect(url);
}

/** A business seller pays to show their own listing as Sponsored. */
export async function promoteListing(_: FormState, form: FormData): Promise<FormState> {
  const listingId = String(form.get("listingId"));
  const me = await requireUser(`/listing/${listingId}/promote`);
  const { m } = await getI18n();
  if (await paymentsBlockedInApp()) return { error: m.errors.appPayments };
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  if (!user.isBusiness) return { error: m.promote.onlyBusiness };
  const weeks = Number(form.get("weeks"));
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > MAX_WEEKS) return { error: m.errors.bookingWeeks };
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== me.id) return { error: m.errors.notYours };
  if (listing.status !== "ACTIVE") return { error: m.errors.listingNotActive };
  const q = quote(PROMOTE_WEEKLY, weeks);
  const name = fmt(m.book.line, { product: `${m.promote.title}: ${listing.title.slice(0, 60)}`, weeks: weeksText(m, weeks) });
  const order = await db.order.create({
    data: { userId: me.id, kind: "PROMOTE", listingId, description: name, weeks, ...q, provider: paymentDriver() },
  });
  let url: string;
  try {
    url = await startCheckout(order.id, name, q, m, user.emailVerifiedAt ? user.email : null);
  } catch (e) {
    console.error("Checkout failed", e);
    await cancelOrder(order.id);
    return { error: m.errors.paymentFailed };
  }
  redirect(url);
}

/** Pay the remaining balance of a booking whose checkout was left open. */
export async function resumeCheckout(form: FormData) {
  const me = await requireUser("/advertise/bookings");
  if (await paymentsBlockedInApp()) redirect("/advertise/bookings");
  const { m } = await getI18n();
  const order = await db.order.findUnique({ where: { id: String(form.get("orderId")) } });
  if (!order || order.userId !== me.id || order.status !== "PENDING") redirect("/advertise/bookings");
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  const url = await startCheckout(order.id, order.description, { subtotal: order.subtotal, vat: order.vat, total: order.total }, m, user.emailVerifiedAt ? user.email : null);
  redirect(url);
}

// ---------- Pretend checkout (PAYMENT_DRIVER=dev only) ----------

export async function devPay(form: FormData) {
  if (paymentDriver() !== "dev") return;
  const orderId = String(form.get("orderId"));
  await markPaid(orderId, `dev_pay_${orderId}`);
  redirect(`/advertise/bookings/${orderId}?paid=1`);
}

export async function devCancel(form: FormData) {
  if (paymentDriver() !== "dev") return;
  redirect(`/advertise/bookings/${String(form.get("orderId"))}?cancelled=1`);
}

// ---------- Admin ----------

export async function saveCampaign(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const { m } = await getI18n();
  const parsed = z.object({
    id: z.string().optional(),
    placement: z.enum(["HOME_BANNER", "SPORT_TAKEOVER", "INFEED", "LISTING_SIDE"]),
    sport: z.string().optional(),
    city: z.string().optional(),
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date"),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose an end date"),
    status: z.enum(["APPROVED", "IN_REVIEW", "REJECTED", "CANCELLED", "PENDING_PAYMENT"]),
    active: z.string().optional(),
    ...creativeSchema(m),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const sport = d.sport && d.sport in SPORT_BY_ID ? d.sport : null;
  if (d.placement === "SPORT_TAKEOVER" && !sport) return { error: "A sport takeover needs a sport." };
  const startsAt = uaeMidnight(d.start);
  const endsAt = new Date(uaeMidnight(d.end).getTime() + 86400e3); // end date is inclusive
  if (endsAt <= startsAt) return { error: "The end date must be on or after the start date." };
  if (d.status === "APPROVED" && (await slotConflicts(d.placement, sport, startsAt, endsAt, d.id)).length) {
    return { error: "Another campaign already holds this placement for some of these dates." };
  }
  const data = {
    advertiser: d.advertiser, headline: d.headline, body: d.body, ctaLabel: d.ctaLabel, ctaUrl: d.ctaUrl,
    placement: d.placement, sport, city: d.city || null, startsAt, endsAt, status: d.status, active: d.active === "on",
  };
  if (d.id) await db.adCampaign.update({ where: { id: d.id }, data });
  else await db.adCampaign.create({ data });
  revalidatePath("/admin");
  redirect("/admin?saved=1");
}

export async function reviewCampaign(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const decision = form.get("decision");
  const campaign = await db.adCampaign.findUnique({ where: { id } });
  if (!campaign || campaign.status !== "IN_REVIEW") return; // already decided (e.g. double click)
  if (decision === "approve") await approveCampaign(id);
  else if (decision === "reject") await rejectCampaign(id, String(form.get("note") ?? "").trim().slice(0, 500));
  revalidatePath("/admin");
}
