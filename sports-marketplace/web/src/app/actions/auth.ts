"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, getUser, hashPassword, safeNext, verifyPassword } from "@/lib/auth";
import { failures, rateLimit } from "@/lib/rate-limit";
import { deletePhotos } from "@/lib/storage";
import { sendVerification } from "@/lib/notify";
import { market } from "@/lib/constants";
import { getI18n, LOCALE_COOKIE } from "@/i18n";

export type FormState = { error?: string; ok?: string } | undefined;

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const { m } = await getI18n();
  if (!rateLimit(`signup:${await clientIp()}`, 10, 60 * 60 * 1000)) return { error: m.errors.tooManySignups };
  const schema = z.object({
    name: z.string().trim().min(2, m.errors.name).max(40, m.errors.name),
    email: z.string().trim().toLowerCase().email(m.errors.email),
    password: z.string().min(8, m.errors.password).max(200),
    city: z.string({ required_error: m.errors.city }).refine((c) => market().cities.includes(c), m.errors.city),
    terms: z.literal("on", { errorMap: () => ({ message: m.errors.terms }) }),
  });
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password, city } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { error: m.errors.emailTaken };
  const { locale } = await getI18n();
  const user = await db.user.create({ data: { name, email, city, locale, passwordHash: await hashPassword(password) } });
  await createSession(user.id);
  await sendVerification(user, email).catch((e) => console.error("Verification email failed", e));
  redirect(safeNext(form.get("next")));
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const { m } = await getI18n();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const key = `login:${await clientIp()}:${email}`;
  if (failures.blocked(key, 8, 15 * 60 * 1000)) return { error: m.errors.tooManyLogins };
  const user = email ? await db.user.findUnique({ where: { email } }) : null;
  // Same message either way, so the form doesn't reveal which emails have accounts.
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    failures.record(key);
    return { error: m.errors.badLogin };
  }
  failures.clear(key);
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function setLocale(locale: string) {
  if (locale !== "en" && locale !== "ar") return;
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 365 * 24 * 3600, sameSite: "lax" });
  const user = await getUser();
  if (user) await db.user.update({ where: { id: user.id }, data: { locale } });
  revalidatePath("/", "layout");
}

/**
 * Permanently deletes the signed-in user and everything that belongs to them:
 * ads and photos, saved items, conversations (for both sides), reports and sessions.
 */
export async function deleteAccount(form: FormData) {
  const user = await getUser();
  if (!user || form.get("confirm") !== "yes") return;
  const photos = await db.photo.findMany({ where: { listing: { sellerId: user.id } }, select: { key: true } });
  await db.user.delete({ where: { id: user.id } }); // related rows go with it (onDelete: Cascade)
  await deletePhotos(photos.map((p) => p.key));
  (await cookies()).delete("rk_session");
  redirect("/?bye=1");
}
