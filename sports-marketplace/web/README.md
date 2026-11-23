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
- **Ads (the revenue):**
  - Campaigns live in the `AdCampaign` table, with four placements: home banner, sport takeover, in-feed and listing sidebar. They can be targeted by sport and city.
  - A sport takeover beats general ads on that sport's pages.
  - Impressions and clicks are counted. Clicks go through `/go/<id>`.
  - Businesses' listings with `sponsoredUntil` set appear as "Sponsored" at the top of results and on the home page.
  - When no campaign is booked, the slot advertises itself to businesses instead.
  - Enquiries from the Advertise page are saved for the admin.

## Tests

```bash
npm run build && npm start              # terminal 1 (add ALLOW_DEV_SMS=1 so test-mode SMS works)
npm run db:reset && npm run test:e2e    # terminal 2
```

`tests/e2e.mjs` drives a real browser through 67 checks:

- browsing and filters
- phone signup: wrong number, wrong code, missing city or terms
- logging straight in with an existing number
- posting with a photo, editing, saving
- a two-person chat
- the SMS code limits
- adding a phone number to an email account, including refusing someone else's number
- reports, admin removal and advertiser enquiries
- the Terms and Privacy pages in both languages, and deleting an account
- Arabic: right-to-left layout, translated text and errors, Arabic search, and phone-width layouts in both languages
- security: other people's ads and chats are off-limits, no open redirect, no path traversal, admin only for admins

`tests/supabase-mock.mjs` is a stand-in for Supabase's SMS and Storage services. Running the same test with `SMS_DRIVER=supabase` and `STORAGE_DRIVER=supabase` pointed at it, and `E2E_SMS_CODE=123456`, checks the real Supabase code paths without a Supabase project.

## Still to do

1. **A real Supabase project:** follow [GO-LIVE.md](GO-LIVE.md). The Supabase integration has only been tested against the stand-in so far.
2. **Rate limiting:** `src/lib/rate-limit.ts` keeps counts in memory. On Vercel, each server instance keeps its own counts, so move them to a shared store (e.g. Upstash Redis) soon after launch. The SMS limits in Supabase's own settings apply regardless.
3. **Email:** password reset and "new message" emails need an email provider (e.g. Resend or Postmark).
4. **Ad management:** campaigns are added directly in the database for now (Supabase Table Editor → AdCampaign). Next steps are a create-campaign form in the admin page, plus payment.
5. **Legal:** draft Terms of Use and Privacy Policy are live at `/terms` and `/privacy` in both languages. Fill in the company details and get a UAE lawyer to review them: see [LEGAL-NOTES.md](LEGAL-NOTES.md). You also need a trade licence that covers online marketplace activity.
6. **Arabic search engines:** the language is stored in a cookie, so Google sees one URL per page. For Arabic search results, add `/ar/...` URLs later.
7. **Mobile apps:** make the site installable from the browser first (PWA), then build a React Native / Expo app.
