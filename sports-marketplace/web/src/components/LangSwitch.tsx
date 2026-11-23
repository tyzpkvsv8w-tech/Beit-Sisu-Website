"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/app/actions/auth";
import { useI18n } from "@/i18n/client";

export function LangSwitch({ className = "linkbtn lang" }: { className?: string }) {
  const { m, locale } = useI18n();
  const [pending, start] = useTransition();
  const router = useRouter();
  const target = locale === "ar" ? "en" : "ar";
  return (
    <button type="button" className={className} disabled={pending} lang={target} aria-label={m.common.switchLangLabel}
      onClick={() => start(async () => { await setLocale(target); router.refresh(); })}>
      {m.common.switchLang}
    </button>
  );
}
