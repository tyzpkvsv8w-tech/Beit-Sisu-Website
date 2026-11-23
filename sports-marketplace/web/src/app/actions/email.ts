"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, hashPassword, requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { appUrl, verifySignature } from "@/lib/app";
import { sendEmail } from "@/lib/email";
import { resetPasswordEmail } from "@/lib/email-templates";
import { consumeEmailToken, createEmailToken } from "@/lib/tokens";
import { sendVerification } from "@/lib/notify";
import { fmt, getI18n } from "@/i18n";
import { clientIp, type FormState } from "./auth";

const RESET_TTL_MS = 3600 * 1000;

/** Always gives the same answer, so the form can't be used to find out who has an account. */
export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const { m } = await getI18n();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!z.string().email().safeParse(email).success) return { error: m.errors.email };
  if (!rateLimit(`reset-ip:${await clientIp()}`, 10, 3600 * 1000) || !rateLimit(`reset:${email}`, 3, 3600 * 1000)) {
    return { error: m.errors.tooManyResets };
  }
  const user = await db.user.findUnique({ where: { email } });
  if (user?.passwordHash) {
    try {
      const token = await createEmailToken(user.id, "reset", RESET_TTL_MS);
      await sendEmail(resetPasswordEmail({ to: email, name: user.name, locale: user.locale, url: `${appUrl()}/reset-password?token=${token}` }));
    } catch (e) {
      console.error("Reset email failed", e);
    }
  }
  return { ok: m.password.sent };
}

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const { m } = await getI18n();
  const password = String(form.get("password") ?? "");
  if (password.length < 8 || password.length > 200) return { error: m.errors.password };
  if (password !== String(form.get("confirm") ?? "")) return { error: m.errors.passwordMatch };
  const token = await consumeEmailToken(String(form.get("token") ?? ""), "reset");
  if (!token) return { error: m.password.invalid };
  await db.$transaction([
    db.user.update({ where: { id: token.userId }, data: { passwordHash: await hashPassword(password) } }),
    // Log out everywhere, in case someone else had the old password.
    db.session.deleteMany({ where: { userId: token.userId } }),
    db.emailToken.deleteMany({ where: { userId: token.userId, purpose: "reset" } }),
  ]);
  await createSession(token.userId);
  redirect("/account?password=1");
}

/** Adds or changes the notification email. It's only used once the link in the email is clicked. */
export async function changeEmail(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser("/account");
  const { m } = await getI18n();
  const parsed = z.string().trim().toLowerCase().email().max(200).safeParse(form.get("email"));
  if (!parsed.success) return { error: m.errors.email };
  const email = parsed.data;
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  if (user.email === email && user.emailVerifiedAt) return { error: m.errors.sameEmail };
  const owner = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (owner && owner.id !== me.id) return { error: m.errors.emailTaken };
  if (!rateLimit(`verify:${me.id}`, 5, 3600 * 1000)) return { error: m.errors.tooManyResets };
  try {
    if (user.email !== email) await db.user.update({ where: { id: me.id }, data: { pendingEmail: email } });
    await sendVerification(user, email);
  } catch (e) {
    console.error("Verification email failed", e);
    return { error: m.errors.emailSendFailed };
  }
  revalidatePath("/account");
  return { ok: fmt(m.account.emailSent, { email }) };
}

/** Used by the verify-email page. */
export async function confirmEmail(raw: string): Promise<{ ok: true; email: string } | { ok: false; reason: "invalid" | "taken" }> {
  const token = await consumeEmailToken(raw, "verify");
  if (!token?.email) return { ok: false, reason: "invalid" };
  const owner = await db.user.findUnique({ where: { email: token.email }, select: { id: true } });
  if (owner && owner.id !== token.userId) return { ok: false, reason: "taken" };
  await db.user.update({ where: { id: token.userId }, data: { email: token.email, emailVerifiedAt: new Date(), pendingEmail: null } });
  return { ok: true, email: token.email };
}

/** Turns off new-message emails from a signed link, no login needed. */
export async function unsubscribe(form: FormData) {
  const userId = String(form.get("u") ?? "");
  if (!verifySignature(`unsub:${userId}`, String(form.get("s") ?? ""))) redirect("/unsubscribe?invalid=1");
  await db.user.updateMany({ where: { id: userId }, data: { notifyMessages: false } });
  redirect("/unsubscribe?done=1");
}
