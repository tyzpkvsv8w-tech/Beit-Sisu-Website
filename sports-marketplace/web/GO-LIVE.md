# Putting ReKit online: Supabase + Vercel

Supabase holds the database, the listing photos and the SMS login codes. Vercel runs the
website. Both have free plans that are enough to launch. SMS texts are the one thing you
pay for from day one, per message, through the SMS provider you connect to Supabase.

Allow about an hour. You need the GitHub repository and an email address.

## 1. Create the Supabase project

1. Sign up at supabase.com and click **New project**.
2. Name it `rekit`. Set a strong database password and save it in your password manager.
3. For the region, choose the one closest to the UAE that Supabase offers. If you have
   rules about where UAE users' data must be stored, check them now: the region can't be
   changed later.

## 2. Database connection

In the project, go to **Connect** (top bar) and choose the **ORMs → Prisma** tab, or go to
**Project Settings → Database**. Copy two connection strings:

| Setting | Which string |
|---|---|
| `DATABASE_URL` | **Transaction pooler** (port 6543). Add `?pgbouncer=true` to the end. |
| `DIRECT_URL` | **Session pooler** (port 5432) |

Replace `[YOUR-PASSWORD]` in both with the database password from step 1.

## 3. Photo storage

1. Go to **Storage → New bucket**.
2. Name it `listing-photos` and turn on **Public bucket**. Listing photos are meant to be seen by everyone.
3. Optionally, set the bucket's file size limit to 5 MB and allowed types to
   `image/jpeg, image/png, image/webp`. The app checks these too.

## 4. SMS login

1. Go to **Authentication → Sign In / Providers → Phone** and turn it on.
2. Choose an SMS provider and paste in its account details. Twilio, MessageBird and
   Vonage all send to the UAE. You create an account with the provider and pay them per text.
3. **UAE sender rules:** texts to UAE numbers usually need a registered sender name (for
   example "ReKit") approved through your provider. This can take a few days, so start early.
4. Under **Authentication → Rate Limits**, check the SMS limit. The app also limits each
   number to 3 codes per 10 minutes.
5. Write the SMS message so it includes `{{ .Code }}`, e.g. `Your ReKit code is {{ .Code }}`.
   You can add the Arabic in the same message: `رمز ReKit الخاص بك: {{ .Code }}`.

## 5. API keys

In **Project Settings → API Keys** (or **Data API**), copy:

- the **Project URL**: this goes in `SUPABASE_URL`
- the **anon / publishable** key: this goes in `SUPABASE_ANON_KEY`
- the **service_role / secret** key: this goes in `SUPABASE_SERVICE_ROLE_KEY`

The secret key gives full access. Only ever paste it into Vercel's settings, never into code or chat.

## 6. Email (Resend)

1. Sign up at resend.com. The free plan covers a few thousand emails a month.
2. Go to **Domains → Add domain**, add your domain (e.g. `rekit.ae`), and add the DNS records Resend shows you at your domain registrar. These let mail apps trust your emails, so they don't land in spam.
3. Go to **API Keys → Create API key** with "Sending access". Paste it only into Vercel (next step).
4. Pick a sender address on that domain, e.g. `ReKit <hello@rekit.ae>`.

## 7. Payments (Stripe)

Stripe takes card and Apple Pay payments for ad bookings and listing promotions, and pays out to a UAE bank account.

1. Sign up at stripe.com with the company's details. Stripe asks for the trade licence and bank account before paying out.
2. In **Settings → Payment methods**, keep Cards on and turn on Apple Pay and Google Pay if you want them.
3. Go to **Developers → API keys** and copy the **Secret key** (`sk_live_…`). It goes in Vercel as `STRIPE_SECRET_KEY`. Start with test-mode keys (`sk_test_…`) to try everything first.
4. Go to **Developers → Webhooks → Add endpoint**:
   - URL: `https://<your domain>/api/payments/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`

   Copy the endpoint's **Signing secret** (`whsec_…`). It goes in Vercel as `STRIPE_WEBHOOK_SECRET`.
5. Optionally, in **Settings → Emails**, turn on "Successful payments" so Stripe also emails card receipts.
6. **VAT:** prices are shown before VAT, and 5% is added at checkout. If the company isn't VAT-registered yet, set `vatRate: 0` in `src/legal/company.ts`. Once registered, add the TRN there too.

## 8. Put the website on Vercel

1. Sign up at vercel.com with GitHub and click **Add New → Project**. Pick this repository.
2. Set **Root Directory** to `sports-marketplace/web`. Vercel detects Next.js.
3. Under **Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | from step 2 |
   | `DIRECT_URL` | from step 2 |
   | `SUPABASE_URL` | from step 5 |
   | `SUPABASE_ANON_KEY` | from step 5 |
   | `SUPABASE_SERVICE_ROLE_KEY` | from step 5 |
   | `STORAGE_DRIVER` | `supabase` |
   | `SUPABASE_BUCKET` | `listing-photos` |
   | `NEXT_PUBLIC_PHOTO_BASE_URL` | `<Project URL>/storage/v1/object/public/listing-photos` |
   | `SMS_DRIVER` | `supabase` |
   | `EMAIL_DRIVER` | `resend` |
   | `RESEND_API_KEY` | from step 6 |
   | `EMAIL_FROM` | e.g. `ReKit <hello@rekit.ae>` |
   | `APP_URL` | your site's address, e.g. `https://rekit.ae` (no slash at the end) |
   | `PAYMENT_DRIVER` | `stripe` |
   | `STRIPE_SECRET_KEY` | from step 7 |
   | `STRIPE_WEBHOOK_SECRET` | from step 7 |
   | `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` | run `npm run vapid` once on your computer and paste both. Keep the private key secret, and don't change the keys later, or every device has to turn notifications on again. |
   | `VAPID_SUBJECT` | `mailto:` plus your support email, e.g. `mailto:support@rekit.ae` |
   | `APP_SECRET` | 32+ random characters. Generate with `openssl rand -base64 48` or a password manager. Keep it secret. |

4. Click **Deploy**. The build creates the database tables automatically
   (`prisma migrate deploy`), then builds the site.
5. Open the site and log in with your own mobile number. You should get a text.
6. On your account page, add your email address. You should get a confirmation email.
7. On your phone, open the site, go to your account page and tap **Turn on notifications**. Then send yourself a message from another account. On iPhone, add ReKit to the home screen first and open it from there.
8. With Stripe test keys, book an ad using the test card `4242 4242 4242 4242` (any future date, any CVC). Check it appears in the admin review queue. Then switch to live keys.

## 9. Make yourself the admin

In Supabase, go to **Table Editor → User**, find your row, and change `role` from `USER`
to `ADMIN`. Then reload the site: **Admin** appears on your account page.

## 10. Your domain

In Vercel, go to **Project → Settings → Domains** and add your domain, e.g. `rekit.ae`.
`.ae` domains are registered through accredited UAE registrars.

## What not to do in production

- Don't run `npm run db:seed` or `db:reset`. They delete everything and load demo data,
  and the script refuses when `NODE_ENV=production`.
- Don't set `ALLOW_DEV_PUSH`. It lets the server send notifications to local test addresses.
- Don't set `PAYMENT_DRIVER=dev` or `ALLOW_DEV_PAYMENTS`. The test checkout lets anyone "pay" without paying.
- Don't set `EMAIL_DRIVER=dev`, `ALLOW_DEV_EMAIL` or `ALLOW_DEV_SECRETS`. These are for automated tests only.
- Don't set `SMS_DRIVER=dev` or `ALLOW_DEV_SMS`. Test mode shows login codes on screen.
  The app refuses to use it in production unless `ALLOW_DEV_SMS=1` is set, which is only for automated tests.
