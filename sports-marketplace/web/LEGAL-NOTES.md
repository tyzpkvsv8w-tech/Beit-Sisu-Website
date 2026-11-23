# Terms of Use and Privacy Policy: notes for legal review

The documents are live on the site at `/terms`, `/privacy` and `/advertising-terms`, in English and Arabic. The
text is in `src/legal/`:

- `terms.en.ts`, `terms.ar.ts`
- `adterms.en.ts`, `adterms.ar.ts` (accepted by advertisers at checkout)
- `privacy.en.ts`, `privacy.ar.ts`
- `company.ts`: company details and the main choices

**These are drafts written for a first review, not legal advice.** Please have a lawyer
qualified in the UAE check all three documents, in both languages, before launch.

## 1. Fill in company details (`src/legal/company.ts`)

Anything in [brackets] shows on the pages as a highlighted blank:

- legal name, registered address, trade licence number and licensing authority
- the emirate whose courts handle disputes
- support and privacy email addresses
- the SMS provider's name (e.g. Twilio)
- the Supabase data region you pick when creating the project

When the review is done, set `draft: false` to remove the "Draft for legal review" notice,
and update `updated` to the publication date.

## 2. Decisions for the lawyer to confirm

| Topic | What the draft says | Why it needs checking |
|---|---|---|
| Minimum age | 18 | The age of majority under UAE civil law is 21 (Hijri years). Decide whether 18 is acceptable for a free classifieds service, or use 21. |
| Liability cap | AED 500 total (`liabilityCap`) | Check it's enforceable and the amount is right. |
| Governing law and courts | UAE federal law plus the licensing emirate; that emirate's courts | If the company is set up in DIFC or ADGM, a different legal system and data protection law apply (DIFC Data Protection Law 2020, ADGM Data Protection Regulations 2021). |
| Which language prevails | Arabic (`prevailing`) | UAE courts work in Arabic. Some companies choose English. Confirm. |
| Data protection law | Federal Decree-Law No. 45 of 2021 (PDPL); complaints to the UAE Data Office | Check the current status of its executive regulations, and whether the company needs to register or appoint a data protection officer. |
| Reasons for using data | Plain-language reasons ("needed to provide the service…", "needed to keep ReKit safe…") | Map these to the PDPL's legal bases. |
| Data outside the UAE | Transfers "only as UAE law allows" | Depends on the Supabase region. Confirm the transfer mechanism (adequacy or contractual safeguards). |
| Prohibited items | Weapons, airsoft and paintball guns, spearguns, unregistered supplements, recalled helmets, etc. | Check against current UAE rules, especially airsoft and paintball, spearguns, and supplements. |
| Business sellers | Must identify themselves and follow consumer protection rules | Check obligations under UAE consumer protection and e-commerce law. |
| Advertising | Ads always labelled; banned categories (gambling, alcohol, tobacco, adult, weapons, unregistered supplements, political or religious) | Check against UAE Media Council advertising rules. |
| Advertiser refunds | Full refund if rejected, or if cancelled 48+ hours before the start; none after that, or for promotions once paid | Check against UAE consumer and e-commerce law (advertisers are businesses, but confirm). Cancellations are done by hand: refund in Stripe, then mark the campaign Cancelled in the admin form. |
| Service failures | If an ad is down for more than 24 hours through our fault, extend it or refund that part | Confirm the wording. |
| VAT | 5% added at checkout (`vatRate`); tax invoices with the TRN on request | Confirm VAT registration status and tax invoice requirements. Set `vatRate: 0` until registered. |

## 3. What the Privacy Policy promises, and where the app does it

The policy was written from the code. If the app changes, update the policy first.

| Promise | Where it happens |
|---|---|
| Passwords and session tokens stored hashed | `src/lib/auth.ts` |
| Login codes expire after 10 minutes; 5 tries; 3 codes per number per 10 minutes | `src/app/actions/phone.ts` |
| Phone number hidden unless "Show my number" is on, and then only to logged-in users | `src/app/listing/[id]/page.tsx` |
| Email never shown to other users | Not rendered anywhere public |
| Photos resized in the browser, which strips location data | `compress()` in `src/components/ListingForm.tsx` (falls back to the original file if the browser can't resize it) |
| Cookies: only `rk_session` (30 days), `rk_otp` (15 minutes) and `rk_lang` (1 year) | `src/lib/auth.ts`, `src/app/actions/phone.ts`, `src/app/actions/auth.ts` |
| No analytics or advertising trackers; ad counts are totals only | `src/lib/ads.ts`, `src/app/go/[id]/route.ts` |
| Push notifications are opt-in per device, encrypted end to end, and stop at logout | `src/lib/push.ts`, `src/app/api/push/subscription/route.ts`, `public/sw.js` |
| Delete your account from the account page; everything goes with it, including conversations for both sides | `deleteAccount` in `src/app/actions/auth.ts` (database cascade), and the photos are removed from storage |
| Ad photos removed from storage when the ad is deleted | `setListingStatus` in `src/app/actions/listings.ts` |
| Third parties: Supabase, the SMS provider, Vercel, Resend (email), Stripe (payments), browser push services, Google Fonts | Google Fonts could be self-hosted to remove it from the list |

## 4. Gaps to close before or soon after launch

- **Automatic deletion:** the policy says reports and advertiser enquiries are kept "up to 2 years", but nothing deletes them automatically yet. Add a scheduled clean-up, or change the wording.
- **Data copies:** requests for a copy of your data are handled by email for now. A "download my data" button would make this self-serve.
- **Supabase's own phone records:** Supabase Auth keeps a record of each number that gets a code. The policy says so. Consider removing those records regularly through Supabase's admin API.
- **Tax invoices:** the payment confirmation email isn't a full VAT tax invoice. Issue tax invoices (e.g. from Stripe Invoicing or accounting software) once VAT-registered.
- **Cookie banner:** none is needed while ReKit only uses essential cookies. Adding analytics or ad tracking would need consent first, and an update to the policy.
