import type { Locale } from "@/i18n";

const numLocale = (l: Locale) => (l === "ar" ? "ar-AE-u-nu-latn" : "en-AE");

export function num(n: number, locale: Locale = "en") {
  return n.toLocaleString(numLocale(locale));
}

/** "AED 650" in English, "650 درهم" in Arabic. */
export function money(amount: number, locale: Locale = "en") {
  return locale === "ar" ? `${num(amount, locale)} درهم` : `AED ${num(amount, locale)}`;
}

export function timeAgo(date: Date, locale: Locale = "en") {
  const rtf = new Intl.RelativeTimeFormat(numLocale(locale), { numeric: "auto" });
  const s = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(s);
  if (abs < 60) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (abs < 30 * 86400) return rtf.format(Math.round(s / 86400), "day");
  return date.toLocaleDateString(numLocale(locale), { day: "numeric", month: "short", year: "numeric" });
}

export function memberSince(date: Date, locale: Locale = "en") {
  return date.toLocaleDateString(numLocale(locale), { month: "short", year: "numeric" });
}

const PHOTO_BASE = (process.env.NEXT_PUBLIC_PHOTO_BASE_URL || "/uploads").replace(/\/$/, "");
export function photoUrl(key: string) {
  return `${PHOTO_BASE}/${key}`;
}

/** +971501234567 -> 050 123 4567 */
export function displayPhone(e164: string) {
  const m = e164.match(/^\+971(5\d)(\d{3})(\d{4})$/);
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : e164;
}
