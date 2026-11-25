"use client";

import Link from "next/link";
import { requestPasswordReset, resetPassword, changeEmail } from "@/app/actions/email";
import { fmt } from "@/i18n/fmt";
import { useI18n } from "@/i18n/client";
import { SubmitButton } from "./SubmitButton";
import { useFormAction } from "./useFormAction";

export function ForgotPasswordForm() {
  const { m } = useI18n();
  const t = m.password;
  const { state, onSubmit, pending } = useFormAction(requestPasswordReset);
  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <h1>{t.forgotTitle}</h1>
      {state?.ok ? <div className="banner-ok" role="status">{state.ok}</div> : (
        <>
          <p style={{ margin: 0 }}>{t.forgotText}</p>
          <div className="field"><label htmlFor="email">{m.auth.email}</label><input id="email" name="email" type="email" autoComplete="email" dir="ltr" /></div>
          {state?.error && <div className="err" role="alert">{state.error}</div>}
          <SubmitButton pending={pending} pendingText={t.sending} className="btn btn-primary btn-block">{t.send}</SubmitButton>
        </>
      )}
      <div className="alt">{t.phoneHint} <Link href="/login">{t.phoneLink}</Link></div>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const { m } = useI18n();
  const t = m.password;
  const { state, onSubmit, pending } = useFormAction(resetPassword);
  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <h1>{t.resetTitle}</h1>
      <input type="hidden" name="token" value={token} />
      <div className="field"><label htmlFor="password">{t.newPassword}</label><input id="password" name="password" type="password" autoComplete="new-password" dir="ltr" /><span className="hint">{m.auth.passwordHint}</span></div>
      <div className="field"><label htmlFor="confirm">{t.confirm}</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" dir="ltr" /></div>
      {state?.error && <div className="err" role="alert">{state.error}{state.error === t.invalid && <> <Link href="/forgot-password">{t.requestNew}</Link></>}</div>}
      <SubmitButton pending={pending} pendingText={t.saving} className="btn btn-primary btn-block">{t.save}</SubmitButton>
    </form>
  );
}

type EmailUser = { email: string | null; emailVerifiedAt: Date | null; pendingEmail: string | null };

/** Add, confirm or change the email address used for alerts. */
export function EmailSettings({ user }: { user: EmailUser }) {
  const { m } = useI18n();
  const t = m.account;
  const { state, onSubmit, pending } = useFormAction(changeEmail);
  const waiting = user.pendingEmail ?? (user.email && !user.emailVerifiedAt ? user.email : null);
  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <h2 style={{ border: 0, padding: 0 }}>{t.emailField}</h2>
      <div className="note">
        {user.email && user.emailVerifiedAt && <><bdi dir="ltr">{user.email}</bdi> <span className="verified">✓ {t.verified}</span></>}
        {!user.email && !user.pendingEmail && t.emailNone}
        {waiting && <div>{fmt(t.emailPending, { email: waiting })}</div>}
      </div>
      <div className="field"><label htmlFor="newEmail">{m.auth.email}</label>
        <input id="newEmail" name="email" type="email" autoComplete="email" dir="ltr" defaultValue={waiting ?? ""} /></div>
      {state?.error && <div className="err" role="alert">{state.error}</div>}
      {state?.ok && <div className="ok" role="status">{state.ok}</div>}
      <SubmitButton pending={pending} pendingText={m.password.sending}>{waiting ? t.resendVerify : t.saveEmail}</SubmitButton>
    </form>
  );
}
