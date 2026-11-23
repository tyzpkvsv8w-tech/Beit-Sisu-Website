"use client";

import Link from "next/link";
import { useRef } from "react";
import { REPORT_REASONS, SPORTS, market } from "@/lib/constants";
import { displayPhone } from "@/lib/format";
import { reportListing, sendEnquiry, updateProfile } from "@/app/actions/social";
import { fmt } from "@/i18n/fmt";
import { useI18n } from "@/i18n/client";
import { SubmitButton } from "./SubmitButton";
import { useFormAction } from "./useFormAction";

export function ReportButton({ listingId }: { listingId: string }) {
  const { m } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const { state, onSubmit, pending } = useFormAction(reportListing);
  return (
    <>
      <button type="button" className="linkbtn" style={{ justifySelf: "start", paddingInlineStart: 0 }} onClick={() => ref.current?.showModal()}>{m.report.link}</button>
      <dialog ref={ref} className="sheet">
        {state?.ok ? (
          <div className="form-card" style={{ border: 0 }}>
            <p className="ok" style={{ margin: 0 }}>{state.ok}</p>
            <button className="btn btn-ghost" type="button" onClick={() => ref.current?.close()}>{m.common.close}</button>
          </div>
        ) : (
          <form className="form-card" style={{ border: 0 }} onSubmit={onSubmit} noValidate>
            <h2 style={{ border: 0, padding: 0 }}>{m.report.title}</h2>
            <input type="hidden" name="listingId" value={listingId} />
            <div className="field"><label htmlFor="reason">{m.report.reason}</label>
              <select id="reason" name="reason" defaultValue="">
                <option value="" disabled>{m.report.choose}</option>
                {REPORT_REASONS.map((r) => <option key={r} value={r}>{m.reportReasons[r]}</option>)}
              </select></div>
            <div className="field"><label htmlFor="details">{m.report.details}</label><textarea id="details" name="details" maxLength={1000} style={{ minHeight: 80 }} dir="auto" /></div>
            {state?.error && <div className="err">{state.error}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <SubmitButton pending={pending} pendingText={m.report.sending}>{m.report.send}</SubmitButton>
              <button className="btn btn-ghost" type="button" onClick={() => ref.current?.close()}>{m.common.cancel}</button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}

export function EnquiryForm() {
  const { m } = useI18n();
  const a = m.advertise;
  const { state, onSubmit, pending } = useFormAction(sendEnquiry);
  if (state?.ok) {
    return <div className="form-card"><h2 style={{ border: 0, padding: 0, fontSize: 30 }}>{a.sentTitle}</h2><p style={{ margin: 0 }}>{state.ok}</p></div>;
  }
  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <h2 style={{ border: 0, padding: 0, fontSize: 30 }}>{a.formTitle}</h2>
      <div className="row2">
        <div className="field"><label htmlFor="aName">{a.name}</label><input id="aName" name="name" dir="auto" /></div>
        <div className="field"><label htmlFor="aBiz">{a.business}</label><input id="aBiz" name="business" placeholder={a.businessPh} dir="auto" /></div>
      </div>
      <div className="row2">
        <div className="field"><label htmlFor="aEmail">{a.email}</label><input id="aEmail" name="email" type="email" dir="ltr" /></div>
        <div className="field"><label htmlFor="aSport">{a.sport}</label>
          <select id="aSport" name="sport" defaultValue=""><option value="">{a.several}</option>{SPORTS.map((s) => <option key={s.id} value={s.id}>{m.sports[s.id]}</option>)}</select></div>
      </div>
      <div className="field"><label htmlFor="aBudget">{fmt(a.budget, { currency: market().currency })}</label>
        <select id="aBudget" name="budget">{a.budgets.map((b, i) => <option key={i} value={BUDGETS[i]}>{b}</option>)}</select></div>
      <div className="field"><label htmlFor="aMsg">{a.message}</label><textarea id="aMsg" name="message" maxLength={2000} style={{ minHeight: 90 }} dir="auto" /></div>
      {state?.error && <div className="err">{state.error}</div>}
      <SubmitButton pending={pending} pendingText={a.sending}>{a.send}</SubmitButton>
    </form>
  );
}

// Stored in English so the ad team sees the same values whatever the language.
const BUDGETS = ["Under 2,000", "2,000 – 10,000", "10,000 – 50,000", "50,000+"];

type ProfileUser = { name: string; phone: string | null; showPhone: boolean; city: string | null; email: string | null };

export function ProfileForm({ user }: { user: ProfileUser }) {
  const { m } = useI18n();
  const t = m.account;
  const { state, onSubmit, pending } = useFormAction(updateProfile);
  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <h2 style={{ border: 0, padding: 0 }}>{t.profile}</h2>
      <dl className="specs" style={{ margin: 0 }}>
        <div><dt>{t.mobile}</dt><dd>{user.phone
          ? <><bdi dir="ltr">{displayPhone(user.phone)}</bdi> <span className="verified">✓ {t.verified}</span></>
          : <Link href="/account/phone" style={{ color: "var(--accent)" }}>{t.addMobile}</Link>}</dd></div>
        <div><dt>{t.email}</dt><dd dir={user.email ? "ltr" : undefined} style={{ textAlign: "start" }}>{user.email ?? t.notSet}</dd></div>
      </dl>
      <div className="row2">
        <div className="field"><label htmlFor="pName">{m.auth.name}</label><input id="pName" name="name" defaultValue={user.name} dir="auto" /></div>
        <div className="field"><label htmlFor="pCity">{m.auth.city}</label>
          <select id="pCity" name="city" defaultValue={user.city ?? market().cities[0]}>{market().cities.map((c) => <option key={c} value={c}>{m.cities[c]}</option>)}</select></div>
      </div>
      {user.phone && <label className="check"><input type="checkbox" name="showPhone" id="pShow" defaultChecked={user.showPhone} /> {t.showPhone}</label>}
      {state?.error && <div className="err">{state.error}</div>}
      {state?.ok && <div className="ok">{state.ok}</div>}
      <SubmitButton pending={pending} pendingText={m.sell.saving}>{t.saveProfile}</SubmitButton>
    </form>
  );
}
