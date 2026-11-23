# ReKit launch checklist

Tick these off before ReKit goes public. ⛔ means launch is blocked until it's done.

## Waiting on you

- [ ] ⛔ **Legal review of the Terms of Use, Privacy Policy and Advertising Terms.** *Parked: speaking to a lawyer, to upload later.*
  1. Share `web/LEGAL-NOTES.md` and the `/terms`, `/privacy` and `/advertising-terms` pages (English and Arabic) with a UAE lawyer.
  2. Fill in the company details in `web/src/legal/company.ts`: legal name, licence, address, emirate, emails, SMS provider and data region.
  3. Apply the lawyer's changes to `web/src/legal/` in both languages. Or send the revised text to Claude to update.
  4. Set `draft: false` and the publication date in `company.ts`. This removes the "Draft" notice from the pages and the reminder from the admin page.
- [ ] ⛔ Trade licence that covers online marketplace activity.
- [ ] ⛔ Supabase project, SMS provider (with a registered UAE sender name), Resend (with your domain verified), Stripe (with the webhook set up) and Vercel. See `web/GO-LIVE.md`.
- [ ] ⛔ VAT: confirm whether the company is VAT-registered. Set `vatRate` and `trn` in `web/src/legal/company.ts`.
- [ ] Native Arabic speaker to proofread the site's Arabic text.
- [ ] Domain name, e.g. a `.ae` domain.

## Still to build

- [ ] Automatic deletion of reports and advertiser enquiries after 2 years (the Privacy Policy promises this).
- [x] Terms for advertisers (draft, part of the legal review above).
- [x] Password-reset and "new message" emails.
- [x] Form in the admin page for creating ad campaigns, and taking payment.
- [ ] VAT tax invoices for advertisers, once VAT-registered.
- [ ] Shared rate limiting (e.g. Upstash Redis) before running on several servers.
- [x] Installable app (PWA).
- [ ] Google Play and App Store listings (optional), and push notifications for new messages.
- [ ] Before launch, install ReKit on a real iPhone and Android phone and check the icon, full-screen view and offline page.
