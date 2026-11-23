"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, safeNext, verifyPassword } from "@/lib/auth";
import { failures, rateLimit } from "@/lib/rate-limit";
import { market } from "@/lib/constants";

export type FormState = { error?: string; ok?: string } | undefined;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name (at least 2 characters)").max(40),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters for your password").max(200),
  city: z.string().refine((c) => market().cities.includes(c), "Choose your emirate or city"),
  terms: z.literal("on", { errorMap: () => ({ message: "Please accept the terms to create an account" }) }),
});

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  if (!rateLimit(`signup:${await clientIp()}`, 10, 60 * 60 * 1000)) {
    return { error: "Too many sign-ups from this network. Try again in an hour." };
  }
  const parsed = signupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password, city } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists. Log in instead." };
  const user = await db.user.create({
    data: { name, email, city, passwordHash: await hashPassword(password) },
  });
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const ip = await clientIp();
  const key = `login:${ip}:${email}`;
  if (failures.blocked(key, 8, 15 * 60 * 1000)) {
    return { error: "Too many failed attempts. Wait 15 minutes and try again." };
  }
  const user = await db.user.findUnique({ where: { email } });
  // Same message either way, so the form doesn't reveal which emails have accounts.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    failures.record(key);
    return { error: "That email and password don't match. Check them and try again." };
  }
  failures.clear(key);
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
