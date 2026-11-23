import { LegalPage } from "@/components/LegalPage";
import { termsEn } from "@/legal/terms.en";
import { termsAr } from "@/legal/terms.ar";
import { getI18n } from "@/i18n";

export async function generateMetadata() {
  const { locale } = await getI18n();
  return { title: (locale === "ar" ? termsAr : termsEn).title };
}

export default function Terms() {
  return <LegalPage doc={{ en: termsEn, ar: termsAr }} />;
}
