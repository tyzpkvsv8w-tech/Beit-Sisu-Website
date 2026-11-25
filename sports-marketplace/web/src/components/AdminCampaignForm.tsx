"use client";

import type { AdCampaign } from "@prisma/client";
import { saveCampaign } from "@/app/actions/ads";
import { SPORTS, market } from "@/lib/constants";
import { en } from "@/i18n/en";
import { SubmitButton } from "./SubmitButton";
import { useFormAction } from "./useFormAction";

const ymd = (d: Date) => new Date(d.getTime() + 4 * 3600e3).toISOString().slice(0, 10);

/** Admin tool (English only): create or edit any campaign, e.g. one sold by the sales team. */
export function AdminCampaignForm({ c, today }: { c?: AdCampaign; today: string }) {
  const { state, onSubmit, pending } = useFormAction(saveCampaign);
  return (
    <form className="form-card" onSubmit={onSubmit} noValidate dir="ltr" lang="en">
      {c && <input type="hidden" name="id" value={c.id} />}
      <h2 style={{ border: 0, padding: 0 }}>Placement</h2>
      <div className="row2">
        <div className="field"><label htmlFor="placement">Placement</label>
          <select id="placement" name="placement" defaultValue={c?.placement ?? "HOME_BANNER"}>
            <option value="HOME_BANNER">Homepage banner (exclusive)</option>
            <option value="SPORT_TAKEOVER">Sport takeover (exclusive per sport)</option>
            <option value="INFEED">In-feed card in search results</option>
            <option value="LISTING_SIDE">Beside listing details</option>
          </select></div>
        <div className="field"><label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={c?.status ?? "APPROVED"}>
            {["APPROVED", "IN_REVIEW", "REJECTED", "CANCELLED", "PENDING_PAYMENT"].map((s) => <option key={s} value={s}>{s.replace("_", " ").toLowerCase()}</option>)}
          </select></div>
      </div>
      <div className="row2">
        <div className="field"><label htmlFor="sport">Sport (targeting)</label>
          <select id="sport" name="sport" defaultValue={c?.sport ?? ""}><option value="">All sports</option>{SPORTS.map((s) => <option key={s.id} value={s.id}>{en.sports[s.id]}</option>)}</select></div>
        <div className="field"><label htmlFor="city">City (targeting)</label>
          <select id="city" name="city" defaultValue={c?.city ?? ""}><option value="">All cities</option>{market().cities.map((x) => <option key={x}>{x}</option>)}</select></div>
      </div>
      <div className="row2">
        <div className="field"><label htmlFor="start">First day</label><input id="start" name="start" type="date" defaultValue={c ? ymd(c.startsAt) : today} /></div>
        <div className="field"><label htmlFor="end">Last day</label><input id="end" name="end" type="date" defaultValue={c ? ymd(new Date(c.endsAt.getTime() - 1)) : ""} /></div>
      </div>
      <label className="check"><input type="checkbox" name="active" id="active" defaultChecked={c?.active ?? true} /> Running (untick to pause)</label>
      <h2>Ad</h2>
      <div className="field"><label htmlFor="advertiser">Advertiser</label><input id="advertiser" name="advertiser" maxLength={40} defaultValue={c?.advertiser} dir="auto" /></div>
      <div className="field"><label htmlFor="headline">Headline</label><input id="headline" name="headline" maxLength={60} defaultValue={c?.headline} dir="auto" /></div>
      <div className="field"><label htmlFor="body">Text</label><input id="body" name="body" maxLength={140} defaultValue={c?.body} dir="auto" /></div>
      <div className="row2">
        <div className="field"><label htmlFor="ctaLabel">Button text</label><input id="ctaLabel" name="ctaLabel" maxLength={20} defaultValue={c?.ctaLabel} dir="auto" /></div>
        <div className="field"><label htmlFor="ctaUrl">Link</label><input id="ctaUrl" name="ctaUrl" type="url" defaultValue={c?.ctaUrl ?? "https://"} /></div>
      </div>
      {state?.error && <div className="err" role="alert">{state.error}</div>}
      <SubmitButton pending={pending} pendingText="Saving…">{c ? "Save campaign" : "Create campaign"}</SubmitButton>
    </form>
  );
}
