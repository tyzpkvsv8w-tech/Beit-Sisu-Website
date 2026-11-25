// Fill these in before launch. Anything still in [brackets] shows up on the Terms and
// Privacy pages as a blank to complete, and the pages show a "draft" notice until
// `draft` is set to false (after a UAE lawyer has reviewed both documents).

export const COMPANY = {
  draft: true,
  // Date shown as "Last updated" on both pages (YYYY-MM-DD).
  updated: "2026-11-23",
  email: "[support@your-domain.ae]",
  privacyEmail: "[privacy@your-domain.ae]",
  // VAT added to ad prices (5% in the UAE). Set to 0 if the company isn't VAT-registered yet,
  // and fill in the Tax Registration Number (TRN) once it is.
  vatRate: 0.05,
  trn: "[TRN]",
  // Cap on liability in the Terms (AED). Confirm with your lawyer.
  liabilityCap: 500,
  // Which language wins if the two versions differ. UAE courts work in Arabic; confirm with your lawyer.
  prevailing: "ar" as "ar" | "en",
  en: {
    legalName: "[Company legal name]",
    address: "[Registered address]",
    licence: "[Trade licence number]",
    authority: "[Licensing authority]",
    emirate: "[Emirate]",
    smsProvider: "[SMS provider, e.g. Twilio]",
    dataRegion: "[Supabase data region, e.g. Frankfurt, Germany]",
  },
  ar: {
    legalName: "[الاسم القانوني للشركة]",
    address: "[العنوان المسجّل]",
    licence: "[رقم الرخصة التجارية]",
    authority: "[جهة الترخيص]",
    emirate: "[الإمارة]",
    smsProvider: "[مزوّد الرسائل النصية، مثل Twilio]",
    dataRegion: "[منطقة تخزين بيانات Supabase، مثل فرانكفورت، ألمانيا]",
  },
};

export type Block = string | { list: string[] } | { rows: [string, string][] };
export type Section = { id: string; h: string; blocks: Block[] };
export type LegalDoc = { title: string; intro: string[]; sections: Section[] };
