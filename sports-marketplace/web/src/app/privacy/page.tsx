import { LegalPage } from "@/components/LegalPage";
import { privacyEn } from "@/legal/privacy.en";
import { privacyAr } from "@/legal/privacy.ar";
import { getI18n } from "@/i18n";

export async function generateMetadata() {
  const { locale } = await getI18n();
  return { title: (locale === "ar" ? privacyAr : privacyEn).title };
}

export default function Privacy() {
  return <LegalPage doc={{ en: privacyEn, ar: privacyAr }} />;
}
