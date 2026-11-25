# ReKit on Google Play

The Android app is a **Trusted Web Activity (TWA)**: a small Android wrapper that opens the
live website full screen, with no browser bar. Every change to the site appears in the app
straight away, with no app update needed.

The site already has everything Google Play needs:

- the installable-app setup
- the link file that proves the app and website belong together (`/.well-known/assetlinks.json`)
- notifications that work inside the app
- blocking and reporting users, as Google's policy for user-generated content requires
- in-app account deletion, plus a public page at `/delete-account`

This folder has the app's settings (`twa-manifest.json`) and everything for the store listing
(`store-listing/`).

## What you need first

1. **The website live** on its real domain (see `web/GO-LIVE.md`). The app is a window onto it.
2. **A Google Play developer account**: play.google.com/console, a one-off USD 25 fee.
   - Sign up as an **organisation** if you can. You need the company's D-U-N-S number, which is free from Dun & Bradstreet.
   - New *personal* accounts must run a closed test with at least 12 testers for 14 days before they can publish. Organisation accounts skip this.
3. **Your domain and package name.** The settings use `rekit.ae` and `ae.rekit.app`. If yours differ, change `host`, the URLs and `packageId` in `twa-manifest.json`, and set `ANDROID_PACKAGE_NAME` on Vercel.

## Build the app

There are two ways. **Option A is easiest.**

### Option A: PWABuilder (no coding)

1. Go to **pwabuilder.com**, enter your site's address, and click **Start**. It reads the site's app settings.
2. Click **Package for stores → Android → Generate package**. Use these options:
   - Package ID: `ae.rekit.app`
   - App name: `ReKit: Used Sports Gear`, launcher name: `ReKit`
   - Start URL: `/?source=twa` (this tells the site it's inside the app)
   - Notification delegation: **on**
   - Signing key: **Create new**
3. Download the zip. It contains the app bundle (`.aab`), the **signing key** and its passwords, and an `assetlinks.json`.
4. **Save the signing key and passwords in your password manager, with a second backup.** Without them you can never update the app.

### Option B: Bubblewrap (command line)

You need Node.js and a JDK; Bubblewrap installs the Android tools itself. In this folder:

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://rekit.ae/manifest.webmanifest   # or: bubblewrap update (uses twa-manifest.json)
bubblewrap build
```

It creates `rekit-upload.keystore` (your signing key, so keep it safe and never commit it) and `app-release-bundle.aab`.

## Connect the app to the website

1. In Play Console, create the app, then go to **Test and release → App integrity → App signing**.
2. Copy the **SHA-256 certificate fingerprint** of the **app signing key**. If you also test builds signed with your own upload key, copy that fingerprint too.
3. On Vercel, set:
   - `ANDROID_PACKAGE_NAME` = `ae.rekit.app`
   - `ANDROID_CERT_SHA256` = the fingerprint(s), comma-separated
4. Redeploy, then open `https://rekit.ae/.well-known/assetlinks.json`. It should show your package and fingerprint.

If this step is wrong, the app still works, but shows a browser address bar at the top.

## Create the listing

Everything is in `store-listing/`:

| Play Console section | Where it comes from |
|---|---|
| App name, short and full description | `store-listing/listing.md`, English and Arabic. Add Arabic under **Store listing → Manage translations**. |
| App icon (512 x 512) | `store-listing/graphics/icon-512.png` |
| Feature graphic (1024 x 500) | `store-listing/graphics/feature-graphic-en.png` (and `-ar` for the Arabic listing) |
| Phone screenshots (1080 x 1920) | `store-listing/graphics/phone-en-1..5.png` (and `phone-ar-*`) |
| App category | Shopping |
| Contact email | your support address |
| Privacy policy URL | `https://rekit.ae/privacy` |
| Data safety form | `store-listing/data-safety.md` |
| Account deletion URL | `https://rekit.ae/delete-account` |
| Content rating questionnaire | `store-listing/data-safety.md` (bottom section) |
| Ads | **Yes, contains ads** (sponsored listings and banners) |
| Target audience | 18 and over |

The screenshots show sample data. Regenerate them with real listings before launch: start
the site, then run `node scripts/make-store-assets.cjs` in `web/`.

## Payments inside the app

Google Play has strict rules about taking payments inside apps. By default, **ad bookings
and listing promotions are website-only in the Android app.** The app explains this, without
linking out, and the server refuses those payments from inside the app.

Businesses can still book on the website in their browser. Check Google Play's current
Payments policy for advertising services with your lawyer. If in-app booking is allowed,
set `ANDROID_ALLOW_PAYMENTS=1` on Vercel.

## Release checklist

- [ ] Website live on the real domain, with Supabase, SMS, email, Stripe and push keys set
- [ ] Legal review done, and the "Draft" notices removed (see `LAUNCH-CHECKLIST.md`)
- [ ] App bundle built and signing key backed up in two places
- [ ] `ANDROID_CERT_SHA256` set; `/.well-known/assetlinks.json` shows the fingerprint
- [ ] Installed from an internal test track: no address bar, notifications arrive, Arabic works
- [ ] Listing, Data safety, content rating, ads declaration and target audience completed
- [ ] (Personal accounts only) closed test with 12+ testers for 14 days
- [ ] Submitted for review; first reviews usually take a few days
