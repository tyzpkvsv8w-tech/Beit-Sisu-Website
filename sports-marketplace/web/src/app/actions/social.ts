"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notifyNewMessage } from "@/lib/notify";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser, requireUser } from "@/lib/auth";
import { REPORT_REASONS, SPORT_BY_ID, market } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { fmt, getI18n } from "@/i18n";
import { clientIp, type FormState } from "./auth";

export async function toggleFavorite(listingId: string): Promise<{ saved: boolean } | { login: true }> {
  const user = await getUser();
  if (!user) return { login: true };
  const key = { userId_listingId: { userId: user.id, listingId } };
  const existing = await db.favorite.findUnique({ where: key });
  if (existing) {
    await db.favorite.delete({ where: key });
    revalidatePath("/saved");
    return { saved: false };
  }
  const listing = await db.listing.findUnique({ where: { id: listingId }, select: { id: true } });
  if (!listing) return { saved: false };
  await db.favorite.create({ data: { userId: user.id, listingId } });
  revalidatePath("/saved");
  return { saved: true };
}

/** Opens (or reuses) the buyer's conversation about a listing. */
export async function startConversation(form: FormData) {
  const listingId = String(form.get("listingId"));
  const user = await requireUser(`/listing/${listingId}`);
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status === "REMOVED") redirect("/");
  if (listing.sellerId === user.id) redirect("/messages");
  const convo = await db.conversation.upsert({
    where: { listingId_buyerId: { listingId, buyerId: user.id } },
    update: {},
    create: { listingId, buyerId: user.id, sellerId: listing.sellerId },
  });
  redirect(`/messages/${convo.id}`);
}

export async function sendMessage(conversationId: string, body: string): Promise<{ error?: string }> {
  const { m } = await getI18n();
  const user = await getUser();
  if (!user) return { error: m.errors.loginToMessage };
  const text = body.trim();
  if (!text) return { error: m.errors.emptyMessage };
  if (text.length > 2000) return { error: m.errors.longMessage };
  if (!rateLimit(`msg:${user.id}`, 60, 60 * 1000)) return { error: m.errors.tooFast };
  const convo = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!convo || (convo.buyerId !== user.id && convo.sellerId !== user.id)) return { error: m.errors.noConversation };
  const [message] = await db.$transaction([
    db.message.create({ data: { conversationId, senderId: user.id, body: text } }),
    db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
  ]);
  // Runs after the reply is sent, so a slow email service never slows down chat.
  after(() => notifyNewMessage(message.id).catch((e) => console.error("Message email failed", e)));
  return {};
}

export async function reportListing(_: FormState, form: FormData): Promise<FormState> {
  const { m } = await getI18n();
  const parsed = z.object({
    listingId: z.string().min(1),
    reason: z.enum(REPORT_REASONS, { errorMap: () => ({ message: m.errors.reason }) }),
    details: z.string().trim().max(1000).optional(),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const user = await requireUser(`/listing/${parsed.data.listingId}`);
  await db.report.upsert({
    where: { listingId_reporterId: { listingId: parsed.data.listingId, reporterId: user.id } },
    update: { reason: parsed.data.reason, details: parsed.data.details, resolved: false },
    create: { ...parsed.data, reporterId: user.id },
  });
  return { ok: m.report.thanks };
}

export async function sendEnquiry(_: FormState, form: FormData): Promise<FormState> {
  const { m } = await getI18n();
  if (!rateLimit(`enq:${await clientIp()}`, 5, 3600 * 1000)) return { error: m.errors.tooManyEnquiries };
  const parsed = z.object({
    name: z.string().trim().min(2, m.errors.enquiryName).max(80),
    business: z.string().trim().min(2, m.errors.enquiryBusiness).max(120),
    email: z.string().trim().email(m.errors.enquiryEmail),
    sport: z.string().optional().refine((s) => !s || s in SPORT_BY_ID, m.errors.sport),
    budget: z.string().max(40).optional(),
    message: z.string().trim().max(2000).optional(),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.adEnquiry.create({ data: { ...parsed.data, sport: parsed.data.sport || null } });
  return { ok: fmt(m.advertise.sent, { name: parsed.data.name, email: parsed.data.email }) };
}

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/account");
  const { m } = await getI18n();
  const parsed = z.object({
    name: z.string().trim().min(2, m.errors.name).max(40, m.errors.name),
    showPhone: z.string().optional().transform((v) => v === "on"),
    notifyMessages: z.string().optional().transform((v) => v === "on"),
    city: z.string({ required_error: m.errors.city }).refine((c) => market().cities.includes(c), m.errors.city),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { notifyMessages, ...data } = parsed.data;
  // The alerts checkbox only shows once an email is confirmed; leave the setting alone otherwise.
  await db.user.update({ where: { id: user.id }, data: form.has("notifyField") ? { ...data, notifyMessages } : data });
  revalidatePath("/account");
  return { ok: m.account.profileSaved };
}
