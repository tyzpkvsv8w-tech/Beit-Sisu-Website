# ReKit web app

The real version of the marketplace: accounts, listings with photos, buyer–seller chat,
saved items, reporting, ad slots served from the database, an admin page, SMS login, and English + Arabic.

Built with Next.js 15 (App Router, server actions), Prisma and Postgres. In production it runs on Vercel, with Supabase for the database, photo storage and SMS codes.

## Run it locally

You need Node.js 20+ and a Postgres database. Any local Postgres works, or a free Supabase project.

```bash
cd sports-marketplace/web
cp .env.example .env     # then point DATABASE_URL / DIRECT_URL at your Postgres
npm install
npm run setup            # creates the tables and loads sample data
npm run dev              # http://localhost:3000
```

Locally, photos are saved to `./uploads` and SMS login runs in **test mode**: no text is sent, and the code appears on screen.

### Demo accounts (sample data only)

| Log in with | What it's for |
|---|---|
| `admin@rekit.test` / `rekit-demo-123` (email login) | Admin page: reports, ad campaigns, advertiser enquiries |
| mobile `050 222 3344` (Priya) | A buyer with a chat and two saved items |
| mobile `050 123 4567` (Omar) | A seller with an unread message |
| `bikes@rekit.test` / `rekit-demo-123` | A business account with a sponsored listing |

Every seeded person also has the email `<firstname>@rekit.test` with the same password.

## Going live

See **[GO-LIVE.md](GO-LIVE.md)** for step-by-step Supabase + Vercel setup.

## What works

- **SMS login:** enter a UAE mobile number, then a 6-digit code. New numbers add a name and city and are signed up; existing numbers are logged straight in.
  - Codes expire after 10 minutes, and 5 wrong tries end the attempt.
  - Each number can request 3 codes per 10 minutes, and each network 10 per hour.
  - Email-and-password accounts still work, and can add a verified number from the account page.
  - In production Supabase sends and checks the codes. Test mode, which shows codes on screen, is refused in production.
- **Emails:**
  - Password reset: a single-use link that expires in 1 hour. Resetting logs out every other device. The form gives the same answer whether or not an account exists.
  - Email confirmation for new addresses.
  - New-message alerts: one email per conversation until it's read, in the recipient's language, with a one-click unsubscribe and an on/off switch on the account page.
  - Phone-only users can add an email for alerts. Emails only go to confirmed addresses.
  - Resend sends the emails in production. In test mode they're saved to `.outbox/`.
- **Accounts:** passwords are hashed with bcrypt. Sessions are random tokens in an HttpOnly cookie, and only a SHA-256 hash of each token is stored. Failed logins are rate-limited.
- **Arabic:** the whole interface is in English and Arabic, with right-to-left layout and Arabic fonts (Cairo and IBM Plex Sans Arabic).
  - Visitors get Arabic automatically if their browser is set to it, and the header button switches language.
  - Sports, conditions, cities, prices (درهم) and dates are all localised.
  - Listings show exactly as their sellers wrote them, in either language, and search finds both.
  - All text lives in `src/i18n/en.ts` and `src/i18n/ar.ts`. TypeScript flags any string missing from the Arabic file.
- **Selling:** post, edit, mark sold, relist, delete. Up to 8 photos per ad. The browser shrinks photos before upload, and the server checks the file contents (JPG, PNG or WebP only).
- **Buying:** browse by sport, keyword, emirate, price and condition, with sorting and pages. Save items with the heart. Every page works without JavaScript except chat and photo upload.
- **Chat:** one conversation per buyer per listing. New messages appear within about 4 seconds, unread badges show in the header, and messages are marked read when opened. Sellers' phone numbers stay hidden unless they choose to show them, and then only to logged-in users.
- **Your data:** users can permanently delete their account, with its ads, photos, saved items and conversations, from the account page.
- **Trust & safety:** report an ad. Admins see reports and can dismiss them or remove the ad.
- **Apple App Store readiness:** see [`../ios/README.md`](../ios/README.md).
  - A Capacitor 7 iPhone app (`ios/`) that shows the live site and adds Apple push notifications (APNs, sent directly by the server with token auth), the native share sheet, universal links, camera and photo permissions in English and Arabic, and the icon and launch screen.
  - A filter blocks ads for banned items in English and Arabic, with extra words configurable. There's also a Help and contact page (`/help`).
  - The App Store listing in both languages, iPhone screenshots, App Privacy answers, and review notes with the age rating.
  - Ad bookings are website-only inside the iPhone app by default (`IOS_ALLOW_PAYMENTS`).
- **Google Play readiness:** see [`../android/README.md`](../android/README.md).
  - The app link file is at `/.well-known/assetlinks.json`, set from environment variables.
  - The Android app's settings (`android/twa-manifest.json`) and the full listing: English and Arabic text, screenshots, feature graphics, and Data safety and content-rating answers.
  - **Blocking:** block (and optionally report) someone from any chat. They can't message you or start a new chat, the chat disappears from your inbox, and you can unblock them from your account page.
  - A public page explains how to delete your account (`/delete-account`).
  - Ad bookings and promotions are website-only inside the Android app by default (`ANDROID_ALLOW_PAYMENTS`).
- **Push notifications for new messages:**
  - People turn notifications on per device, on the account page or from a prompt in the chat right after sending a message. "No thanks" is remembered.
  - Each message shows the sender, the ad and the start of the message, in the recipient's language. Tapping opens the conversation.
  - A burst of messages in one chat replaces the previous notification instead of piling up. Nothing shows if you're already reading that chat.
  - Notifications are encrypted for each device, so Google, Apple and Mozilla's push services can't read them.
  - Subscriptions are tied to the login session, so logging out, a password reset or deleting the account stops notifications on that device. Expired subscriptions are removed automatically.
  - The server only sends to the browser makers' push services, never to an address someone makes up.
  - On iPhone, notifications work once ReKit is added to the home screen (iOS 16.4+). The app tells iPhone users this.
- **Installable app (PWA):**
  - ReKit installs to the home screen on Android, iPhone and desktop, and opens full screen with its own icon and name.
  - Long-press shortcuts for Sell, Search and Messages. Name and shortcuts follow the user's language.
  - From a visitor's second page view, a small bar suggests installing: an Install button on Android and desktop Chrome, or the Share-menu steps on iPhone. "Not now" hides it for 30 days, and the account page always has an install option.
  - With no connection, an offline page shows instead of a browser error.
  - The service worker (`public/sw.js`) only stores files that are the same for everyone (code, styles, fonts, icons, the offline page), never pages, messages or account data. That's safe on shared phones and keeps everything up to date.
  - Icons are generated by `node scripts/make-icons.cjs`.
- **Online ad booking and payments:**
  - Businesses book a homepage banner or a sport takeover at `/advertise/book`: pick dates, write the ad with a live preview, see the price with VAT, accept the Advertising Terms, and pay by card through Stripe Checkout.
  - Exclusive slots can't be double-booked, and unpaid bookings hold their dates for 30 minutes.
  - Paid bookings go to the admin review queue. Approving emails the advertiser; rejecting refunds in full automatically and emails the reason.
  - Business sellers can promote their own listings (AED 75 a week + VAT). It goes live as soon as it's paid.
  - Advertisers see their bookings, statuses, views and clicks at `/advertise/bookings`.
  - Payments are confirmed by Stripe's signed webhook, and also checked directly when the advertiser returns, so a late webhook doesn't matter. Card details never reach our servers.
- **Admin campaigns:** a form to create or edit any campaign (all four placements, targeting, dates, pause), for deals agreed offline.
- **Ads (the revenue):**
  - Campaigns live in the `AdCampaign` table, with four placements: home banner, sport takeover, in-feed and listing sidebar. They can be targeted by sport and city.
  - A sport takeover beats general ads on that sport's pages.
  - Impressions and clicks are counted. Clicks go through `/go/<id>`.
  - Businesses' listings with `sponsoredUntil` set appear as "Sponsored" at the top of results and on the home page.
  - When no campaign is booked, the slot advertises itself to businesses instead.
  - Enquiries from the Advertise page are saved for the admin.

## Tests

```bash
ALLOW_DEV_SMS=1 ALLOW_DEV_EMAIL=1 ALLOW_DEV_SECRETS=1 npm start   # terminal 1, after npm run build
npm run db:reset && npm run test:e2e    # terminal 2
```

`tests/e2e.mjs` drives a real browser through 172 checks:

- browsing and filters
- phone signup: wrong number, wrong code, missing city or terms
- logging straight in with an existing number
- posting with a photo, editing, saving
- a two-person chat
- the SMS code limits
- adding a phone number to an email account, including refusing someone else's number
- reports, admin removal and advertiser enquiries
- the Terms and Privacy pages in both languages, and deleting an account
- ad booking: double-booking blocked (including by unpaid holds), VAT totals, https-only links, paying, cancelling at checkout and rebooking, approval and refund emails, the admin campaign form going live, business-only promotions, forged payment notifications refused, and the Arabic booking page
- push notifications, using `tests/push-mock.mjs` as the push service and Chrome's newer headless mode (the default headless browser has no notification support). Covers turning on, encrypted and signed delivery (decrypted by the test), the phone displaying it, one notification per chat, logging out stopping it, expired subscriptions cleaned up, blocking other websites and made-up push addresses, the chat prompt, and the iPhone message. Run with `E2E_PUSH=1` and the push stand-in running.
- App Store requirements, using `tests/apns-mock.mjs` as Apple's push service (it checks the signed token): the universal links file, the banned-items filter (and that innocent ads pass), the iPhone app hiding install tips and payments, Apple notifications turned on and delivered with the right title, link and collapse ID, notification taps opening the chat (and not other sites), uninstalled phones removed after Apple's 410, invalid tokens rejected, the native share sheet, and the Help page
- Google Play requirements: blocking and unblocking (a blocked person can't reply or start a new chat, block-and-report reaches the admin), the account deletion page, the app link file, payments hidden inside the Android app, and the chat fitting a phone screen in both languages
- the installable app: the manifest in both languages, icon sizes, Chrome's own installability check, the offline page, only shared files stored on the device, and the install suggestion on Android and iPhone (second page view, "Not now" remembered)
- emails: confirming addresses, alerts (one per conversation, Arabic for Arabic users), forged and real unsubscribe links, and password reset (no account guessing, single-use links, other devices logged out)
- Arabic: right-to-left layout, translated text and errors, Arabic search, and phone-width layouts in both languages
- security: other people's ads and chats are off-limits, no open redirect, no path traversal, admin only for admins

`tests/stripe-mock.mjs` is a stand-in for Stripe: checkout sessions, the payment page, signed webhooks and refunds. Run the same test with `PAYMENT_DRIVER=stripe`, `STRIPE_API_BASE` pointed at it, `STRIPE_SECRET_KEY=sk_test_mock`, `STRIPE_WEBHOOK_SECRET=whsec_mock` and `E2E_PAYMENTS=stripe`. All checks pass except one, which only applies to the test checkout page.

`tests/supabase-mock.mjs` is a stand-in for Supabase's SMS and Storage services. Running the same test with `SMS_DRIVER=supabase` and `STORAGE_DRIVER=supabase` pointed at it, and `E2E_SMS_CODE=123456`, checks the real Supabase code paths without a Supabase project.

## Still to do

1. **A real Supabase project:** follow [GO-LIVE.md](GO-LIVE.md). The Supabase integration has only been tested against the stand-in so far.
2. **Rate limiting:** `src/lib/rate-limit.ts` keeps counts in memory. On Vercel, each server instance keeps its own counts, so move them to a shared store (e.g. Upstash Redis) soon after launch. The SMS limits in Supabase's own settings apply regardless.
3. **Advertiser cancellations:** cancellations after approval are done by hand: refund in the Stripe dashboard, then set the campaign to Cancelled in the admin form. Listing-page ads (CPM) and newsletter slots are still sold through the enquiry form.
4. **Legal:** draft Terms of Use and Privacy Policy are live at `/terms` and `/privacy` in both languages. Fill in the company details and get a UAE lawyer to review them: see [LEGAL-NOTES.md](LEGAL-NOTES.md). You also need a trade licence that covers online marketplace activity.
5. **Arabic search engines:** the language is stored in a cookie, so Google sees one URL per page. For Arabic search results, add `/ar/...` URLs later.
6. **App stores:** both are ready to build and submit (`../android/README.md`, `../ios/README.md`). Building the iPhone app needs a Mac with Xcode or a cloud build service.
