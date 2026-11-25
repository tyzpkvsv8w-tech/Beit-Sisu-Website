"use client";

import { useMemo, useState } from "react";
import { bookCampaign } from "@/app/actions/ads";
import { SPORTS } from "@/lib/constants";
import { BOOKABLE, MAX_WEEKS, aed, quote, type BookableProduct } from "@/lib/pricing";
import { fmt } from "@/i18n/fmt";
import { useI18n } from "@/i18n/client";
import { SubmitButton } from "./SubmitButton";
import { useFormAction } from "./useFormAction";

type Range = { placement: string; sport: string | null; start: string; end: string };

const LIMITS = { advertiser: 40, headline: 60, body: 140, ctaLabel: 20 } as const;

export function BookingForm({ booked, minDate, vatRate }: { booked: Range[]; minDate: string; vatRate: number }) {
  const { m, locale } = useI18n();
  const b = m.book;
  const { state, onSubmit, pending } = useFormAction(bookCampaign);
  const [product, setProduct] = useState<BookableProduct>("SPORT_TAKEOVER");
  const [sport, setSport] = useState("");
  const [start, setStart] = useState(minDate);
  const [weeks, setWeeks] = useState(1);
  const [ad, setAd] = useState({ advertiser: "", headline: "", body: "", ctaLabel: "", ctaUrl: "" });

  const day = (iso: string) => new Date(iso).toLocaleDateString(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dubai" });
  const q = quote(BOOKABLE[product].weekly, weeks);
  const endIso = new Date(new Date(`${start}T00:00:00+04:00`).getTime() + weeks * 7 * 86400e3 - 1).toISOString();
  const taken = useMemo(() => booked.filter((r) => r.placement === product && (product !== "SPORT_TAKEOVER" || r.sport === sport)), [booked, product, sport]);
  const set = (k: keyof typeof ad) => (e: React.ChangeEvent<HTMLInputElement>) => setAd({ ...ad, [k]: e.target.value });
  const show = (k: keyof typeof ad, fallback: string) => ad[k].trim() || fallback;

  return (
    <form className="booking" onSubmit={onSubmit} noValidate>
      <div className="form-card">
        <h2>1. {b.step1}</h2>
        <div className="choice-grid" role="radiogroup" aria-label={b.step1}>
          {(Object.keys(BOOKABLE) as BookableProduct[]).map((p) => (
            <label key={p} className={`choice${product === p ? " on" : ""}`}>
              <input type="radio" name="product" value={p} checked={product === p} onChange={() => setProduct(p)} />
              <strong>{b.products[p].name}</strong>
              <span className="price">{aed(BOOKABLE[p].weekly, locale)} <small>{b.perWeek}</small></span>
              <span className="note">{b.products[p].desc}</span>
            </label>
          ))}
        </div>
        {BOOKABLE[product].needsSport && (
          <div className="field"><label htmlFor="sport">{b.sport}</label>
            <select id="sport" name="sport" value={sport} onChange={(e) => setSport(e.target.value)}>
              <option value="" disabled>{b.chooseSport}</option>
              {SPORTS.map((s) => <option key={s.id} value={s.id}>{m.sports[s.id]}</option>)}
            </select></div>
        )}

        <h2>2. {b.step2}</h2>
        <div className="row2">
          <div className="field"><label htmlFor="start">{b.start}</label>
            <input id="start" name="start" type="date" min={minDate} value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div className="field"><label htmlFor="weeks">{b.weeks}</label>
            <select id="weeks" name="weeks" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
              {Array.from({ length: MAX_WEEKS }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n === 1 ? b.week1 : fmt(b.weeksN, { n })}</option>)}
            </select></div>
        </div>
        <span className="hint">{b.startHint}</span>
        {start && <div className="note">{fmt(b.runs, { start: day(`${start}T00:00:00+04:00`), end: day(endIso) })}</div>}
        {(product === "HOME_BANNER" || sport) && (
          <div className="booked" aria-live="polite">
            {taken.length ? <><span className="note">{b.booked}</span>{taken.map((r, i) => <span key={i} className="chip chip-cond">{day(r.start)} – {day(new Date(new Date(r.end).getTime() - 1).toISOString())}</span>)}</>
              : <span className="note">{b.noneBooked}</span>}
          </div>
        )}

        <h2>3. {b.step3}</h2>
        {(Object.keys(LIMITS) as (keyof typeof LIMITS)[]).map((k) => (
          <div className="field" key={k}>
            <label htmlFor={k}>{{ advertiser: b.advertiser, headline: b.headline, body: b.body, ctaLabel: b.cta }[k]}
              <span className="count-hint">{fmt(b.chars, { n: ad[k].length, max: LIMITS[k] })}</span></label>
            <input id={k} name={k} maxLength={LIMITS[k]} value={ad[k]} onChange={set(k)} dir="auto" />
          </div>
        ))}
        <div className="field"><label htmlFor="ctaUrl">{b.ctaUrl}</label>
          <input id="ctaUrl" name="ctaUrl" type="url" inputMode="url" placeholder="https://" value={ad.ctaUrl} onChange={set("ctaUrl")} dir="ltr" /></div>
      </div>

      <aside className="booking-side">
        <div className="panel">
          <strong>{b.preview}</strong>
          <span className="note">{b.previewNote}</span>
          <div className="ad ad-leader preview" aria-hidden="true">
            <span className="ad-label">{m.ads.advertisement}</span>
            <div className="brand" dir="auto">{show("advertiser", b.sample.advertiser)}</div>
            <div className="msg" dir="auto"><strong>{show("headline", b.sample.headline)}</strong>{show("body", b.sample.body)}</div>
            <span className="btn btn-primary">{show("ctaLabel", b.sample.cta)}</span>
          </div>
        </div>
        <div className="panel">
          <strong>4. {b.step4}</strong>
          <table className="summary"><tbody>
            <tr><td>{fmt(b.line, { product: b.products[product].name, weeks: weeks === 1 ? b.week1 : fmt(b.weeksN, { n: weeks }) })}</td><td className="price">{aed(q.subtotal, locale)}</td></tr>
            {vatRate > 0 && <tr><td>{fmt(b.vat, { rate: Math.round(vatRate * 100) })}</td><td className="price">{aed(q.vat, locale)}</td></tr>}
            <tr className="total"><td>{b.total}</td><td className="price" data-testid="total">{aed(q.total, locale)}</td></tr>
          </tbody></table>
          <label className="check"><input type="checkbox" name="terms" id="adterms" />
            <span>{b.termsA} <a href="/advertising-terms" target="_blank" rel="noopener">{b.termsLink}</a></span></label>
          {state?.error && <div className="err" role="alert">{state.error}</div>}
          <SubmitButton pending={pending} pendingText={b.paying} className="btn btn-primary btn-block">{b.pay}</SubmitButton>
        </div>
      </aside>
    </form>
  );
}
