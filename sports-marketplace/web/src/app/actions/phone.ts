"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, getUser, safeNext } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { checkCode, normalizeUaeMobile, sendCode } from "@/lib/sms";
import { displayPhone } from "@/lib/format";
import { market } from "@/lib/constants";
import { getI18n } from "@/i18n";
import { clientIp } from "./auth";

const CHALLENGE_COOKIE = "rk_otp";
const CODE_TTL_MS = 10 * 60 * 1000;
const SIGNUP_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export type PhoneResult =
  | { error: string }
  | { step: "code"; phone: string; devCode?: string }
  | { step: "profile"; phone: string };

async function challengeFromCookie() {
  const id = (await cookies()).get(CHALLENGE_COOKIE)?.value;
  return id ? db.phoneChallenge.findUnique({ where: { id } }) : null;
}

/** Step 1: text a code. Used for logging in, signing up, and adding a number to an account. */
export async function requestCode(input: string): Promise<PhoneResult> {
  const { m } = await getI18n();
  const phone = normalizeUaeMobile(input);
  if (!phone) return { error: m.errors.phone };
  if (!rateLimit(`sms:${phone}`, 3, CODE_TTL_MS) || !rateLimit(`sms-ip:${await clientIp()}`, 10, 60 * 60 * 1000)) {
    return { error: m.errors.tooManyCodes };
  }
  const user = await getUser();
  if (user) {
    const owner = await db.user.findUnique({ where: { phone }, select: { id: true } });
    if (owner && owner.id !== user.id) return { error: m.errors.phoneTaken };
  }
  let sent;
  try {
    sent = await sendCode(phone);
  } catch (e) {
    console.error("SMS send failed", e);
    return { error: m.errors.smsFailed };
  }
  await db.phoneChallenge.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - SIGNUP_WINDOW_MS) } } });
  const challenge = await db.phoneChallenge.create({
    data: { phone, codeHash: sent.codeHash, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });
  (await cookies()).set(CHALLENGE_COOKIE, challenge.id, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SIGNUP_WINDOW_MS / 1000,
  });
  return { step: "code", phone: displayPhone(phone), devCode: sent.devCode };
}

/** Step 2: check the code. Logs in an existing account, links the number, or asks for a name. */
export async function verifyCode(code: string, next: string): Promise<PhoneResult> {
  const { m } = await getI18n();
  if (!/^\d{6}$/.test(code.trim())) return { error: m.errors.codeFormat };
  const ch = await challengeFromCookie();
  if (!ch || ch.verifiedAt) return { error: m.errors.codeExpired };
  if (ch.expiresAt < new Date()) return { error: m.errors.codeExpired };
  if (ch.attempts >= MAX_ATTEMPTS) return { error: m.errors.codeAttempts };
  await db.phoneChallenge.update({ where: { id: ch.id }, data: { attempts: { increment: 1 } } });

  let ok = false;
  try {
    ok = await checkCode(ch.phone, code.trim(), ch.codeHash);
  } catch (e) {
    console.error("SMS verify failed", e);
    return { error: m.errors.smsFailed };
  }
  if (!ok) return { error: ch.attempts + 1 >= MAX_ATTEMPTS ? m.errors.codeAttempts : m.errors.codeWrong };
  await db.phoneChallenge.update({ where: { id: ch.id }, data: { verifiedAt: new Date() } });

  const current = await getUser();
  const owner = await db.user.findUnique({ where: { phone: ch.phone } });
  if (current) {
    // Adding a number to the signed-in account.
    if (owner && owner.id !== current.id) return { error: m.errors.phoneTaken };
    await db.user.update({ where: { id: current.id }, data: { phone: ch.phone, phoneVerifiedAt: new Date() } });
    await finish(ch.id);
    revalidatePath("/account");
    redirect("/account?phone=1");
  }
  if (owner) {
    await finish(ch.id);
    await createSession(owner.id);
    redirect(safeNext(next));
  }
  return { step: "profile", phone: displayPhone(ch.phone) };
}

/** Step 3 (new numbers only): name and city, then the account is created. */
export async function completePhoneSignup(form: FormData): Promise<PhoneResult> {
  const { m } = await getI18n();
  const ch = await challengeFromCookie();
  if (!ch?.verifiedAt || Date.now() - ch.verifiedAt.getTime() > SIGNUP_WINDOW_MS) return { error: m.errors.verifyFirst };
  const schema = z.object({
    name: z.string().trim().min(2, m.errors.name).max(40, m.errors.name),
    city: z.string({ required_error: m.errors.city }).refine((c) => market().cities.includes(c), m.errors.city),
    terms: z.literal("on", { errorMap: () => ({ message: m.errors.terms }) }),
  });
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (await db.user.findUnique({ where: { phone: ch.phone } })) return { error: m.errors.phoneTaken };
  const { locale } = await getI18n();
  const user = await db.user.create({
    data: { name: parsed.data.name, city: parsed.data.city, phone: ch.phone, phoneVerifiedAt: new Date(), locale },
  });
  await finish(ch.id);
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

async function finish(challengeId: string) {
  await db.phoneChallenge.delete({ where: { id: challengeId } }).catch(() => {});
  (await cookies()).delete(CHALLENGE_COOKIE);
}
