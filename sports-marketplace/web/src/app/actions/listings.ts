"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CONDITIONS, MAX_PHOTOS, SPORT_BY_ID, market } from "@/lib/constants";
import { PhotoError, deletePhotos, savePhoto } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import { fmt, getI18n } from "@/i18n";
import type { Messages } from "@/i18n/en";
import type { FormState } from "./auth";

function listingSchema(m: Messages) {
  const optional = z.string().trim().max(80).optional().transform((v) => v || null);
  return z.object({
    title: z.string().trim().min(5, m.errors.title).max(80, m.errors.titleLong),
    sport: z.string({ required_error: m.errors.sport }).refine((s) => s in SPORT_BY_ID, m.errors.sport),
    condition: z.enum(CONDITIONS, { errorMap: () => ({ message: m.errors.condition }) }),
    price: z.coerce.number({ invalid_type_error: m.errors.price }).int(m.errors.price).min(0, m.errors.price).max(10_000_000, m.errors.priceHigh),
    negotiable: z.string().optional().transform((v) => v === "on"),
    brand: optional,
    size: optional,
    city: z.string({ required_error: m.errors.city }).refine((c) => market().cities.includes(c), m.errors.city),
    area: optional,
    description: z.string().trim().min(10, m.errors.description).max(2000, m.errors.descriptionLong),
  });
}

function photosFrom(form: FormData) {
  return form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
}

async function saveAll(files: File[], m: Messages): Promise<{ keys: string[] } | { error: string }> {
  const keys: string[] = [];
  try {
    for (const f of files) keys.push(await savePhoto(f));
    return { keys };
  } catch (e) {
    await deletePhotos(keys);
    if (e instanceof PhotoError) {
      return { error: { empty: m.errors.photoEmpty, tooBig: m.errors.photoTooBig, badType: m.errors.photoType }[e.reason] };
    }
    console.error("Photo upload failed", e);
    return { error: m.errors.photoUpload };
  }
}

export async function createListing(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/sell");
  const { m } = await getI18n();
  if (!rateLimit(`post:${user.id}`, 20, 24 * 3600 * 1000)) return { error: m.errors.dailyLimit };
  const parsed = listingSchema(m).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const files = photosFrom(form);
  if (files.length > MAX_PHOTOS) return { error: fmt(m.errors.maxPhotos, { max: MAX_PHOTOS }) };
  const saved = await saveAll(files, m);
  if ("error" in saved) return saved;

  const listing = await db.listing.create({
    data: { ...parsed.data, sellerId: user.id, photos: { create: saved.keys.map((key, position) => ({ key, position })) } },
  });
  revalidatePath("/");
  redirect(`/listing/${listing.id}?posted=1`);
}

async function ownListing(id: string, userId: string) {
  const listing = await db.listing.findUnique({ where: { id }, include: { photos: true } });
  if (!listing || listing.sellerId !== userId || listing.status === "REMOVED") return null;
  return listing;
}

export async function updateListing(_: FormState, form: FormData): Promise<FormState> {
  const id = String(form.get("id"));
  const user = await requireUser(`/listing/${id}/edit`);
  const { m } = await getI18n();
  const listing = await ownListing(id, user.id);
  if (!listing) return { error: m.errors.notYours };
  const parsed = listingSchema(m).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const keep = new Set(form.getAll("keepPhoto").map(String));
  const kept = listing.photos.filter((p) => keep.has(p.id)).sort((a, b) => a.position - b.position);
  const removed = listing.photos.filter((p) => !keep.has(p.id));
  const files = photosFrom(form);
  if (kept.length + files.length > MAX_PHOTOS) return { error: fmt(m.errors.maxPhotos, { max: MAX_PHOTOS }) };
  const saved = await saveAll(files, m);
  if ("error" in saved) return saved;

  await db.$transaction([
    db.photo.deleteMany({ where: { id: { in: removed.map((p) => p.id) } } }),
    ...kept.map((p, i) => db.photo.update({ where: { id: p.id }, data: { position: i } })),
    db.listing.update({
      where: { id },
      data: { ...parsed.data, photos: { create: saved.keys.map((key, i) => ({ key, position: kept.length + i })) } },
    }),
  ]);
  await deletePhotos(removed.map((p) => p.key));
  revalidatePath(`/listing/${id}`);
  redirect(`/listing/${id}?updated=1`);
}

export async function setListingStatus(form: FormData) {
  const id = String(form.get("id"));
  const status = String(form.get("status"));
  const user = await requireUser("/account");
  if (!["ACTIVE", "SOLD", "REMOVED"].includes(status)) return;
  const listing = await ownListing(id, user.id);
  if (!listing) return;
  await db.listing.update({ where: { id }, data: { status } });
  if (status === "REMOVED") {
    await db.photo.deleteMany({ where: { listingId: id } });
    await deletePhotos(listing.photos.map((p) => p.key));
  }
  revalidatePath("/account");
  revalidatePath(`/listing/${id}`);
  if (status === "REMOVED") redirect("/account?deleted=1");
}
