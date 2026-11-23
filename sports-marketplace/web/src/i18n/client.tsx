"use client";

import { createContext, useContext } from "react";
import type { Messages } from "./en";

type Ctx = { locale: "en" | "ar"; m: Messages };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ locale, m, children }: Ctx & { children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, m }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
