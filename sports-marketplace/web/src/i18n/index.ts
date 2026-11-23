import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { en, type Messages } from "./en";
import { ar } from "./ar";

export type Locale = "en" | "ar";
export const LOCALE_COOKIE = "rk_lang";
const dictionaries: Record<Locale, Messages> = { en, ar };

/** Cookie first (set by the language switch), then the browser's language. */
export const getLocale = cache(async (): Promise<Locale> => {
  const jar = await cookies();
  const c = jar.get(LOCALE_COOKIE)?.value;
  if (c === "en" || c === "ar") return c;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^ar\b/i.test(accept.trim()) ? "ar" : "en";
});

export async function getI18n() {
  const locale = await getLocale();
  return { locale, m: dictionaries[locale] };
}

export { fmt } from "./fmt";
