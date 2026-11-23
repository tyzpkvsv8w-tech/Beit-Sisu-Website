"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser, requireUser } from "@/lib/auth";
import { REPORT_REASONS, SPORTS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import type { FormState } from "./auth";

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
  const user = await getUser();
  if (!user) return { error: "Log in to send messages." };
  const text = body.trim();
  if (!text) return { error: "Write a message first." };
  if (text.length > 2000) return { error: "Keep messages under 2,000 characters." };
  if (!rateLimit(`msg:${user.id}`, 60, 60 * 1000)) return { error: "You're sending messages too quickly. Wait a minute." };
  const convo = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!convo || (convo.buyerId !== user.id && convo.sellerId !== user.id)) return { error: "Conversation not found." };
  const now = new Date();
  await db.$transaction([
    db.message.create({ data: { conversationId, senderId: user.id, body: text } }),
    db.conversation.update({ where: { id: conversationId }, data: { updatedAt: now } }),
  ]);
  return {};
}

const reportSchema = z.object({
  listingId: z.string().min(1),
  reason: z.enum(REPORT_REASONS, { errorMap: () => ({ message: "Choose a reason" }) }),
  details: z.string().trim().max(1000).optional(),
});

export async function reportListing(_: FormState, form: FormData): Promise<FormState> {
  const parsed = reportSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const user = await requireUser(`/listing/${parsed.data.listingId}`);
  await db.report.upsert({
    where: { listingId_reporterId: { listingId: parsed.data.listingId, reporterId: user.id } },
    update: { reason: parsed.data.reason, details: parsed.data.details, resolved: false },
    create: { ...parsed.data, reporterId: user.id },
  });
  return { ok: "Thanks. Our team will review this ad." };
}

const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  business: z.string().trim().min(2, "Enter your business name").max(120),
  email: z.string().trim().email("Enter a valid work email"),
  sport: z.string().optional().refine((s) => !s || SPORTS.some((x) => x.name === s), "Choose a sport"),
  budget: z.string().max(40).optional(),
  message: z.string().trim().max(2000).optional(),
});

export async function sendEnquiry(_: FormState, form: FormData): Promise<FormState> {
  const h = (await import("next/headers")).headers;
  const ip = (await h()).get("x-forwarded-for") ?? "local";
  if (!rateLimit(`enq:${ip}`, 5, 3600 * 1000)) return { error: "Too many enquiries from this network. Try again later." };
  const parsed = enquirySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.adEnquiry.create({ data: { ...parsed.data, sport: parsed.data.sport || null } });
  return { ok: `Thanks, ${parsed.data.name}. Our ad team will email ${parsed.data.email} within one working day.` };
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(40),
  phone: z.string().trim().max(20).refine((p) => !p || /^\+?[\d\s-]{7,}$/.test(p), "Enter a valid mobile number").optional(),
  showPhone: z.string().optional().transform((v) => v === "on"),
  city: z.string().optional(),
});

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/account/profile");
  const parsed = profileSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.user.update({ where: { id: user.id }, data: { ...parsed.data, phone: parsed.data.phone || null } });
  revalidatePath("/account");
  return { ok: "Profile saved." };
}
