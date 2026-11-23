"use client";

import { useRef } from "react";
import { reportListing, sendEnquiry, updateProfile } from "@/app/actions/social";
import { REPORT_REASONS, SPORTS, market } from "@/lib/constants";
import { SubmitButton } from "./SubmitButton";
import { useFormAction } from "./useFormAction";

export function ReportButton({ listingId }: { listingId: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { state, onSubmit, pending } = useFormAction(reportListing);
  return (
    <>
      <button type="button" className="linkbtn" style={{ justifySelf: "start", paddingLeft: 0 }} onClick={() => ref.current?.showModal()}>⚑ Report this ad</button>
      <dialog ref={ref} className="sheet">
        {state?.ok ? (
          <div className="form-card" style={{ border: 0 }}>
            <p className="ok" style={{ margin: 0 }}>{state.ok}</p>
            <button className="btn btn-ghost" type="button" onClick={() => ref.current?.close()}>Close</button>
          </div>
        ) : (
          <form className="form-card" style={{ border: 0 }} onSubmit={onSubmit} noValidate>
            <h2 style={{ border: 0, padding: 0 }}>Report this ad</h2>
            <input type="hidden" name="listingId" value={listingId} />
            <div className="field"><label htmlFor="reason">Reason</label>
              <select id="reason" name="reason" defaultValue="">
                <option value="" disabled>Choose a reason</option>
                {REPORT_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select></div>
            <div className="field"><label htmlFor="details">Details (optional)</label><textarea id="details" name="details" maxLength={1000} style={{ minHeight: 80 }} /></div>
            {state?.error && <div className="err">{state.error}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <SubmitButton pending={pending} pendingText="Sending…">Send report</SubmitButton>
              <button className="btn btn-ghost" type="button" onClick={() => ref.current?.close()}>Cancel</button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}

export function EnquiryForm() {
  const { state, onSubmit, pending } = useFormAction(sendEnquiry);
  if (state?.ok) {
    return <div className="form-card"><h2 style={{ border: 0, padding: 0, fontSize: 30 }}>Enquiry sent</h2><p style={{ margin: 0 }}>{state.ok}</p></div>;
  }
  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <h2 style={{ border: 0, padding: 0, fontSize: 30 }}>Talk to our ad team</h2>
      <div className="row2">
        <div className="field"><label htmlFor="aName">Your name</label><input id="aName" name="name" required /></div>
        <div className="field"><label htmlFor="aBiz">Business</label><input id="aBiz" name="business" required placeholder="Shop, club or brand" /></div>
      </div>
      <div className="row2">
        <div className="field"><label htmlFor="aEmail">Work email</label><input id="aEmail" name="email" type="email" required /></div>
        <div className="field"><label htmlFor="aSport">Main sport</label>
          <select id="aSport" name="sport" defaultValue=""><option value="">Several / all</option>{SPORTS.map((s) => <option key={s.id}>{s.name}</option>)}</select></div>
      </div>
      <div className="field"><label htmlFor="aBudget">Monthly budget ({market().currency})</label>
        <select id="aBudget" name="budget"><option>Under 2,000</option><option>2,000 – 10,000</option><option>10,000 – 50,000</option><option>50,000+</option></select></div>
      <div className="field"><label htmlFor="aMsg">What do you want to promote?</label><textarea id="aMsg" name="message" maxLength={2000} style={{ minHeight: 90 }} /></div>
      {state?.error && <div className="err">{state.error}</div>}
      <SubmitButton pending={pending} pendingText="Sending…">Send enquiry</SubmitButton>
    </form>
  );
}

export function ProfileForm({ user }: { user: { name: string; phone: string | null; showPhone: boolean; city: string | null; email: string } }) {
  const { state, onSubmit, pending } = useFormAction(updateProfile);
  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <h2 style={{ border: 0, padding: 0 }}>Profile</h2>
      <div className="field"><label htmlFor="pEmail">Email</label><input id="pEmail" value={user.email} disabled /></div>
      <div className="field"><label htmlFor="pName">Name shown to buyers</label><input id="pName" name="name" defaultValue={user.name} required /></div>
      <div className="row2">
        <div className="field"><label htmlFor="pPhone">Mobile</label><input id="pPhone" name="phone" type="tel" defaultValue={user.phone ?? ""} placeholder="05X XXX XXXX" /></div>
        <div className="field"><label htmlFor="pCity">Emirate / city</label>
          <select id="pCity" name="city" defaultValue={user.city ?? ""}>{market().cities.map((c) => <option key={c}>{c}</option>)}</select></div>
      </div>
      <label className="check"><input type="checkbox" name="showPhone" id="pShow" defaultChecked={user.showPhone} /> Show my number on my ads (logged-in buyers only)</label>
      {state?.error && <div className="err">{state.error}</div>}
      {state?.ok && <div className="ok">{state.ok}</div>}
      <SubmitButton pending={pending} pendingText="Saving…">Save profile</SubmitButton>
    </form>
  );
}
