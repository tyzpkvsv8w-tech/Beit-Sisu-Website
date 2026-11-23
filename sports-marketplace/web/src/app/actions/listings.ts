"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CONDITIONS, MAX_PHOTOS, SPORT_BY_ID, market } from "@/lib/constants";
import { deletePhoto, savePhoto } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import type { FormState } from "./auth";

const optional = z.string().trim().max(80).optional().transform((v) => v || null);

const listingSchema = z.object({
  title: z.string().trim().min(5, "Give your ad a title of at least 5 characters").max(80, "Keep the title under 80 characters"),
  sport: z.string().refine((s) => s in SPORT_BY_ID, "Choose a sport"),
  condition: z.enum(CONDITIONS, { errorMap: () => ({ message: "Choose the condition" }) }),
  price: z.coerce.number({ invalid_type_error: "Enter a price" }).int("Enter a whole number").min(0, "Price can't be negative").max(10_000_000, "That price looks too high"),
  negotiable: z.string().optional().transform((v) => v === "on"),
  brand: optional,
  size: optional,
  city: z.string().refine((c) => market().cities.includes(c), "Choose an emirate or city"),
  area: optional,
  description: z.string().trim().min(10, "Add a description of at least 10 characters").max(2000, "Keep the description under 2,000 characters"),
});

function photosFrom(form: FormData) {
  return form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
}

export async function createListing(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/sell");
  if (!rateLimit(`post:${user.id}`, 20, 24 * 3600 * 1000)) {
    return { error: "You've posted 20 ads today, which is the daily limit. Try again tomorrow." };
  }
  const parsed = listingSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const files = photosFrom(form);
  if (files.length > MAX_PHOTOS) return { error: `You can add up to ${MAX_PHOTOS} photos.` };

  const keys: string[] = [];
  try {
    for (const f of files) keys.push(await savePhoto(f));
  } catch (e) {
    await Promise.all(keys.map(deletePhoto));
    return { error: e instanceof Error ? e.message : "One of the photos couldn't be uploaded." };
  }

  const listing = await db.listing.create({
    data: {
      ...parsed.data,
      sellerId: user.id,
      photos: { create: keys.map((key, position) => ({ key, position })) },
    },
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
  const listing = await ownListing(id, user.id);
  if (!listing) return { error: "You can only edit your own ads." };
  const parsed = listingSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const keep = new Set(form.getAll("keepPhoto").map(String));
  const kept = listing.photos.filter((p) => keep.has(p.id)).sort((a, b) => a.position - b.position);
  const removed = listing.photos.filter((p) => !keep.has(p.id));
  const files = photosFrom(form);
  if (kept.length + files.length > MAX_PHOTOS) return { error: `You can have up to ${MAX_PHOTOS} photos.` };

  const keys: string[] = [];
  try {
    for (const f of files) keys.push(await savePhoto(f));
  } catch (e) {
    await Promise.all(keys.map(deletePhoto));
    return { error: e instanceof Error ? e.message : "One of the photos couldn't be uploaded." };
  }

  await db.$transaction([
    db.photo.deleteMany({ where: { id: { in: removed.map((p) => p.id) } } }),
    ...kept.map((p, i) => db.photo.update({ where: { id: p.id }, data: { position: i } })),
    db.listing.update({
      where: { id },
      data: {
        ...parsed.data,
        photos: { create: keys.map((key, i) => ({ key, position: kept.length + i })) },
      },
    }),
  ]);
  await Promise.all(removed.map((p) => deletePhoto(p.key)));
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
    await Promise.all(listing.photos.map((p) => deletePhoto(p.key)));
  }
  revalidatePath("/account");
  revalidatePath(`/listing/${id}`);
  if (status === "REMOVED") redirect("/account?deleted=1");
}
