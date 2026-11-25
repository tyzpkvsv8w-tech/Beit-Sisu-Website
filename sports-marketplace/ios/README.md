# ReKit on the Apple App Store

The iPhone app is a native shell built with **Capacitor 7**. It shows the live website and adds
what Apple expects from a real app, which a website can't do on iPhone:

- **Push notifications through Apple (APNs)** for new messages. The server sends them directly to Apple.
- **The native share sheet** on every ad.
- **Universal links:** rekit.ae links open in the app (`/.well-known/apple-app-site-association`).
- Camera and photo-library access for ad photos, with explanations in English and Arabic.
- Its own icon, launch screen and offline page.

Because it shows the live site, every change to the website appears in the app straight away.
You only resubmit to Apple for native changes, like a new icon.

The site meets Apple's main review rules:

- **User-generated content (1.2):** a filter blocks ads for banned items, plus report, block, and published contact details at `/help`.
- **Account deletion (5.1.1(v)):** in the app.
- **Payments (3.1):** ad bookings are website-only in the app. The server enforces this, and the app shows no purchase buttons.

## What you need

1. **The website live** on its real domain (see `web/GO-LIVE.md`).
2. **An Apple Developer Program membership**: developer.apple.com/programs, USD 99 a year.
   - Enrol as an **organisation**. It needs the company's D-U-N-S number (free) and takes a few days to verify. The App Store then shows the company as the seller, not your personal name.
3. **A Mac with Xcode 16 or later.** If you don't have a Mac, a cloud build service can build and upload the app from this folder, such as **Codemagic** (free tier), **Ionic Appflow** or **Bitrise**. A freelance iOS developer can also do steps 2 to 5 below in an hour or two.

## Steps

### 1. Set your domain and IDs

If your domain isn't `rekit.ae`, replace it in `capacitor.config.ts` and `ios/App/App/App.entitlements`.
The bundle ID is `ae.rekit.app`. To change it, update `capacitor.config.ts` and set it in Xcode under **Signing & Capabilities**.

### 2. Register the app with Apple (developer.apple.com → Certificates, IDs & Profiles)

1. **Identifiers → +** → App IDs → App. Bundle ID: `ae.rekit.app`. Tick **Push Notifications** and **Associated Domains**.
2. **Keys → +** → name it "ReKit push", tick **Apple Push Notifications service (APNs)**, then download the `.p8` file.
   - You can only download it once. Save it in your password manager.
   - Note the **Key ID**, and your **Team ID** (shown at the top right, and under Membership).

### 3. Tell the website about the app (on Vercel)

| Variable | Value |
|---|---|
| `APPLE_TEAM_ID` | your 10-character Team ID |
| `IOS_BUNDLE_ID` | `ae.rekit.app` |
| `APNS_KEY_ID` | the key's ID |
| `APNS_TEAM_ID` | your Team ID |
| `APNS_PRIVATE_KEY` | the full contents of the `.p8` file, including the BEGIN/END lines |
| `APNS_SANDBOX` | leave empty. Set it to `1` only while testing builds run straight from Xcode. |

Redeploy, then check that `https://rekit.ae/.well-known/apple-app-site-association` shows `TEAMID.ae.rekit.app`.

### 4. Build in Xcode

```bash
cd sports-marketplace/ios
npm install
npx cap sync ios
npx cap open ios        # opens Xcode
```

In Xcode:

1. Select the **App** target → **Signing & Capabilities**, choose your Team, and keep "Automatically manage signing" on. Push Notifications and Associated Domains are already set in `App.entitlements`.
2. Optional, for the Arabic permission messages: **File → Add Files to "App"**, select `App/en.lproj` and `App/ar.lproj`, and choose "Create groups".
3. Run on your iPhone (plug it in, pick it at the top, press ▶). Check that:
   - the site loads
   - notifications arrive (Account → Turn on notifications, then send yourself a message from another account)
   - Share opens the share sheet
   - a rekit.ae link in Notes opens the app
4. **Product → Archive → Distribute App → App Store Connect → Upload.**

### 5. TestFlight, then submit

1. In **App Store Connect** (appstoreconnect.apple.com) → **Apps → +**: name "ReKit: Used Sports Gear", bundle ID `ae.rekit.app`, primary language English.
2. When the upload finishes processing (around 15 minutes), test it in **TestFlight** on a few phones.
3. Fill in the version page from `store-listing/`:
   - `listing.md`: name, subtitle, description, keywords, URLs, categories
   - `graphics/iphone-*.png`: screenshots (6.9" iPhone, 1320×2868). Retake them with real listings before launch: in `web/`, start the site and run `node scripts/make-store-assets.cjs --ios`
   - `app-privacy.md`: the App Privacy section
   - `review-notes.md`: the demo account, review notes and age rating
4. **Add for Review → Submit.** Reviews usually take one to three days. If Apple asks questions, reply in App Store Connect; `review-notes.md` covers the usual ones.

## Updating the app

Website changes need no new app version. For native changes, such as icons, plugins or the
Capacitor version, raise the version and build number in Xcode, archive, upload, and submit
an update.
