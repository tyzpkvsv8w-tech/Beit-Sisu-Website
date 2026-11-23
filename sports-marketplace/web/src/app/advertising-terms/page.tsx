import { LegalPage } from "@/components/LegalPage";
import { adTermsEn } from "@/legal/adterms.en";
import { adTermsAr } from "@/legal/adterms.ar";
import { getI18n } from "@/i18n";

export async function generateMetadata() {
  const { locale } = await getI18n();
  return { title: (locale === "ar" ? adTermsAr : adTermsEn).title };
}

export default function AdvertisingTerms() {
  return <LegalPage doc={{ en: adTermsEn, ar: adTermsAr }} />;
}
