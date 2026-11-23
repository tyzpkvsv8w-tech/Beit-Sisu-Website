"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { login, signup } from "@/app/actions/auth";
import { completePhoneSignup, requestCode, verifyCode, type PhoneResult } from "@/app/actions/phone";
import { market } from "@/lib/constants";
import { fmt } from "@/i18n/fmt";
import { useI18n } from "@/i18n/client";
import { SubmitButton } from "./SubmitButton";
import { useFormAction } from "./useFormAction";

function CityAndTerms() {
  const { m } = useI18n();
  return (
    <>
      <div className="field"><label htmlFor="city">{m.auth.city}</label>
        <select id="city" name="city" defaultValue="">
          <option value="" disabled>{m.auth.choose}</option>
          {market().cities.map((c) => <option key={c} value={c}>{m.cities[c]}</option>)}
        </select></div>
      <label className="check"><input type="checkbox" name="terms" id="terms" />
        <span>{m.auth.termsA} <a href="/terms" target="_blank" rel="noopener">{m.auth.termsLink}</a> {m.auth.termsAnd}{m.dir === "rtl" ? "" : " "}<a href="/privacy" target="_blank" rel="noopener">{m.auth.privacyLink}</a></span></label>
    </>
  );
}

/**
 * Phone-first login. One flow covers logging in and signing up:
 * number -> 6-digit code -> (new numbers only) name and city.
 * With attach=true it adds a verified number to the signed-in account.
 */
export function PhoneAuth({ next, attach = false }: { next: string; attach?: boolean }) {
  const { m } = useI18n();
  const [step, setStep] = useState<"phone" | "code" | "profile">("phone");
  const [phone, setPhone] = useState("");
  const [shownPhone, setShownPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string>();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function handle(res: PhoneResult | undefined) {
    if (!res) return; // redirected
    if ("error" in res) { setError(res.error); return; }
    setError("");
    setShownPhone(res.phone);
    if (res.step === "code") { setDevCode(res.devCode); setCode(""); }
    setStep(res.step);
  }
  const send = () => start(async () => handle(await requestCode(phone)));

  if (step === "profile") {
    return (
      <form className="form-card" noValidate onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); start(async () => handle(await completePhoneSignup(fd))); }}>
        <div><div className="eyebrow">{m.auth.finishEyebrow}</div><h1>{m.auth.finishTitle}</h1></div>
        <p style={{ margin: 0 }}>{fmt(m.auth.finishText, { phone: "⁦" + shownPhone + "⁩" })}</p>
        <input type="hidden" name="next" value={next} />
        <div className="field"><label htmlFor="name">{m.auth.name}</label><input id="name" name="name" autoComplete="name" placeholder={m.auth.namePh} dir="auto" /></div>
        <CityAndTerms />
        {error && <div className="err" role="alert">{error}</div>}
        <SubmitButton pending={pending} pendingText={m.auth.creating} className="btn btn-primary btn-block">{m.auth.finish}</SubmitButton>
      </form>
    );
  }

  if (step === "code") {
    return (
      <form className="form-card" noValidate onSubmit={(e) => { e.preventDefault(); start(async () => handle(await verifyCode(code, next))); }}>
        <div><div className="eyebrow">{attach ? m.auth.addPhoneTitle : m.auth.phoneEyebrow}</div><h1>{m.auth.code}</h1></div>
        <p style={{ margin: 0 }}>{fmt(m.auth.codeSent, { phone: "⁦" + shownPhone + "⁩" })}</p>
        {devCode && <div className="banner-ok" data-testid="dev-code">{fmt(m.auth.devCode, { code: devCode })}</div>}
        <div className="field"><label htmlFor="code">{m.auth.code}</label>
          <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} dir="ltr" className="otp"
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus /></div>
        {error && <div className="err" role="alert">{error}</div>}
        <SubmitButton pending={pending} pendingText={m.auth.verifying} className="btn btn-primary btn-block">{m.auth.verify}</SubmitButton>
        <div className="alt" style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="linkbtn" onClick={() => { setStep("phone"); setError(""); }}>{m.auth.changeNumber}</button>
          <button type="button" className="linkbtn" onClick={send} disabled={pending}>{m.auth.resend}</button>
        </div>
      </form>
    );
  }

  return (
    <form className="form-card" noValidate onSubmit={(e) => { e.preventDefault(); send(); }}>
      <div><div className="eyebrow">{attach ? m.auth.addPhoneText : m.auth.phoneEyebrow}</div><h1>{attach ? m.auth.addPhoneTitle : m.auth.phoneTitle}</h1></div>
      <div className="field"><label htmlFor="phone">{m.auth.mobile}</label>
        <div className="phone-input" dir="ltr"><span>🇦🇪 +971</span>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder={m.auth.mobilePh}
            value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus /></div></div>
      {error && <div className="err" role="alert">{error}</div>}
      <SubmitButton pending={pending} pendingText={m.auth.sending} className="btn btn-primary btn-block">{m.auth.sendCode}</SubmitButton>
      {!attach && <div className="alt"><Link href={`/login/email?next=${encodeURIComponent(next)}`}>{m.auth.useEmail}</Link></div>}
    </form>
  );
}

export function LoginForm({ next }: { next: string }) {
  const { m } = useI18n();
  const { state, onSubmit, pending } = useFormAction(login);
  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <div><div className="eyebrow">{m.auth.welcome}</div><h1>{m.auth.login}</h1></div>
      <input type="hidden" name="next" value={next} />
      <div className="field"><label htmlFor="email">{m.auth.email}</label><input id="email" name="email" type="email" autoComplete="email" dir="ltr" /></div>
      <div className="field"><label htmlFor="password">{m.auth.password}</label><input id="password" name="password" type="password" autoComplete="current-password" dir="ltr" /></div>
      {state?.error && <div className="err" role="alert">{state.error}</div>}
      <SubmitButton pending={pending} className="btn btn-primary btn-block" pendingText={m.auth.loggingIn}>{m.auth.loginBtn}</SubmitButton>
      <div className="alt"><Link href={`/login?next=${encodeURIComponent(next)}`}>{m.auth.usePhone}</Link></div>
      <div className="alt">{m.auth.newHere} <Link href={`/signup?next=${encodeURIComponent(next)}`}>{m.auth.emailSignup}</Link></div>
    </form>
  );
}

export function SignupForm({ next }: { next: string }) {
  const { m } = useI18n();
  const { state, onSubmit, pending } = useFormAction(signup);
  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <div><div className="eyebrow">{m.auth.freeForever}</div><h1>{m.auth.createAccount}</h1></div>
      <input type="hidden" name="next" value={next} />
      <div className="field"><label htmlFor="name">{m.auth.name}</label><input id="name" name="name" autoComplete="name" placeholder={m.auth.namePh} dir="auto" /></div>
      <div className="field"><label htmlFor="email">{m.auth.email}</label><input id="email" name="email" type="email" autoComplete="email" dir="ltr" /></div>
      <div className="field"><label htmlFor="password">{m.auth.password}</label><input id="password" name="password" type="password" autoComplete="new-password" dir="ltr" /><span className="hint">{m.auth.passwordHint}</span></div>
      <CityAndTerms />
      {state?.error && <div className="err" role="alert">{state.error}</div>}
      <SubmitButton pending={pending} className="btn btn-primary btn-block" pendingText={m.auth.creating}>{m.auth.createAccount}</SubmitButton>
      <div className="alt"><Link href={`/login?next=${encodeURIComponent(next)}`}>{m.auth.usePhone}</Link></div>
      <div className="alt">{m.auth.haveAccount} <Link href={`/login/email?next=${encodeURIComponent(next)}`}>{m.auth.login}</Link></div>
    </form>
  );
}
