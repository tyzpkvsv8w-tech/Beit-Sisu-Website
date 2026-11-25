"use client";

import { useState } from "react";
import { promoteListing } from "@/app/actions/ads";
import { MAX_WEEKS, PROMOTE_WEEKLY, aed, quote } from "@/lib/pricing";
import { fmt } from "@/i18n/fmt";
import { useI18n } from "@/i18n/client";
import { SubmitButton } from "./SubmitButton";
import { useFormAction } from "./useFormAction";

export function PromoteForm({ listingId, vatRate }: { listingId: string; vatRate: number }) {
  const { m, locale } = useI18n();
  const { state, onSubmit, pending } = useFormAction(promoteListing);
  const [weeks, setWeeks] = useState(1);
  const q = quote(PROMOTE_WEEKLY, weeks);
  return (
    <form onSubmit={onSubmit} noValidate style={{ display: "grid", gap: 14 }}>
      <input type="hidden" name="listingId" value={listingId} />
      <div className="field"><label htmlFor="weeks">{m.book.weeks}</label>
        <select id="weeks" name="weeks" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
          {Array.from({ length: MAX_WEEKS }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n === 1 ? m.book.week1 : fmt(m.book.weeksN, { n })}</option>)}
        </select></div>
      <table className="summary"><tbody>
        <tr><td>{fmt(m.promote.price, { price: aed(PROMOTE_WEEKLY, locale) })} × {weeks}</td><td className="price">{aed(q.subtotal, locale)}</td></tr>
        {vatRate > 0 && <tr><td>{fmt(m.book.vat, { rate: Math.round(vatRate * 100) })}</td><td className="price">{aed(q.vat, locale)}</td></tr>}
        <tr className="total"><td>{m.book.total}</td><td className="price">{aed(q.total, locale)}</td></tr>
      </tbody></table>
      {state?.error && <div className="err" role="alert">{state.error}</div>}
      <SubmitButton pending={pending} pendingText={m.book.paying} className="btn btn-primary btn-block">{m.promote.pay}</SubmitButton>
    </form>
  );
}
