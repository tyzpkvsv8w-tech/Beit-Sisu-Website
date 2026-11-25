import { COMPANY } from "@/legal/company";
import type { Locale } from "@/i18n";

// Ad prices in fils (AED x 100), before VAT. These match the Advertise page.
export const BOOKABLE = {
  HOME_BANNER: { weekly: 3500_00, needsSport: false },
  SPORT_TAKEOVER: { weekly: 1500_00, needsSport: true },
} as const;
export type BookableProduct = keyof typeof BOOKABLE;
export const PROMOTE_WEEKLY = 75_00;
export const MAX_WEEKS = 12;
// How long an unpaid booking holds its dates.
export const HOLD_MINUTES = 30;

export function quote(weeklyFils: number, weeks: number) {
  const subtotal = weeklyFils * weeks;
  const vat = Math.round(subtotal * COMPANY.vatRate);
  return { subtotal, vat, total: subtotal + vat };
}

/** 3500_00 -> "AED 3,500" / "AED 3,675.50"; Arabic puts درهم after the number. */
export function aed(fils: number, locale: Locale = "en") {
  const n = (fils / 100).toLocaleString(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { minimumFractionDigits: fils % 100 ? 2 : 0, maximumFractionDigits: 2 });
  return locale === "ar" ? `${n} درهم` : `AED ${n}`;
}

/** Calendar date in the UAE (UTC+4, no daylight saving) as YYYY-MM-DD. */
export function uaeDate(d = new Date(), addDays = 0) {
  return new Date(d.getTime() + 4 * 3600e3 + addDays * 86400e3).toISOString().slice(0, 10);
}
/** Midnight UAE time at the start of a YYYY-MM-DD date. */
export function uaeMidnight(date: string) {
  return new Date(`${date}T00:00:00+04:00`);
}
