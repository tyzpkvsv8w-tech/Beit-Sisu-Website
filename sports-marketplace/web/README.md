# ReKit web app

The real version of the marketplace: accounts, listings with photos, buyer–seller chat,
saved items, reporting, ad slots served from the database, and an admin page.

Built with Next.js 15 (App Router, server actions), Prisma and SQLite for development.

## Run it locally

You need Node.js 20 or newer.

```bash
cd sports-marketplace/web
cp .env.example .env
npm install
npm run setup      # creates the database and loads sample data
npm run dev        # http://localhost:3000
```

### Demo accounts (sample data only)

Every seeded account uses the password `rekit-demo-123`.

| Email | What it's for |
|---|---|
| `admin@rekit.test` | Admin page: reports, ad campaigns, advertiser enquiries |
| `priya@rekit.test` | A buyer with a chat and two saved items |
| `omar@rekit.test` | A seller with an unread message |
| `bikes@rekit.test` | A business account with a sponsored listing |

`npm run db:reset` wipes the local database and reloads the sample data. The seed script refuses to run when `NODE_ENV=production`.

## What works

- **Accounts:** sign up, log in, log out. Passwords are hashed with bcrypt. Sessions are random tokens in an HttpOnly cookie, and only a SHA-256 hash of each token is stored. Failed logins are rate-limited.
- **Selling:** post, edit, mark sold, relist, delete. Up to 8 photos per ad. The browser shrinks photos before upload, and the server checks the file contents (JPG, PNG or WebP only).
- **Buying:** browse by sport, keyword, emirate, price and condition, with sorting and pages. Save items with the heart. Every page works without JavaScript except chat and photo upload.
- **Chat:** one conversation per buyer per listing. New messages appear within about 4 seconds, unread badges show in the header, and messages are marked read when opened. Sellers' phone numbers stay hidden unless they choose to show them, and then only to logged-in users.
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
npm run build && npm start      # in one terminal
npm run db:reset && npm run test:e2e   # in another
```

`tests/e2e.mjs` drives a real browser through 38 checks. They cover guest browsing, filters, signup, posting with a photo, editing, saving, a two-person chat, reporting, the admin removing an ad, advertiser enquiries, phone-width layouts, and these security checks:

- users can't edit other people's ads
- people outside a chat can't read it
- the login page can't redirect to another site
- photo URLs can't reach other files on the server
- non-admins can't open the admin page

## Before going live

These need decisions or accounts from you.

1. **Database:** create a Postgres database (e.g. Neon, Supabase or AWS RDS), set `provider = "postgresql"` in `prisma/schema.prisma`, and set `DATABASE_URL`. No model changes are needed. Switch to `prisma migrate` for schema changes from then on.
2. **Photo storage:** replace the three functions in `src/lib/storage.ts` with an object store (Cloudflare R2, S3 or Supabase Storage). Local disk doesn't survive redeploys.
3. **Hosting:** Vercel, Render or any Node host. Make sure `NODE_ENV=production`, so cookies are marked Secure.
4. **Rate limiting:** `src/lib/rate-limit.ts` keeps counts in memory, which is fine for one server. Move it to Redis (e.g. Upstash) before running several.
5. **Email:** password reset and "you have a new message" emails need an email provider (e.g. Postmark or Resend). Not built yet.
6. **Phone login:** UAE users expect login by SMS code. This needs an SMS provider (e.g. Twilio). It plugs into `createSession` in `src/lib/auth.ts`.
7. **Ad management:** campaigns are added directly in the database for now (`npx prisma studio`). Next steps are a form in the admin page to create campaigns, plus payment.
8. **Legal:** terms of use and a privacy policy (UAE PDPL), and a trade licence that covers online marketplace activity. The signup checkbox references terms that still need writing.
9. **Arabic:** the UI text is English-only. Add translations and right-to-left layout before launch.
10. **Mobile apps:** the site already works well on phones. The next step is a PWA (installable from the browser), then a React Native / Expo app that uses the same server actions through an API.
