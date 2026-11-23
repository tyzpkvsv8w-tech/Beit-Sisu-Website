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

## 6. Put the website on Vercel

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

4. Click **Deploy**. The build creates the database tables automatically
   (`prisma migrate deploy`), then builds the site.
5. Open the site and log in with your own mobile number. You should get a text.

## 7. Make yourself the admin

In Supabase, go to **Table Editor → User**, find your row, and change `role` from `USER`
to `ADMIN`. Then reload the site: **Admin** appears on your account page.

## 8. Your domain

In Vercel, go to **Project → Settings → Domains** and add your domain, e.g. `rekit.ae`.
`.ae` domains are registered through accredited UAE registrars.

## What not to do in production

- Don't run `npm run db:seed` or `db:reset`. They delete everything and load demo data,
  and the script refuses when `NODE_ENV=production`.
- Don't set `SMS_DRIVER=dev` or `ALLOW_DEV_SMS`. Test mode shows login codes on screen.
  The app refuses to use it in production unless `ALLOW_DEV_SMS=1` is set, which is only for automated tests.
