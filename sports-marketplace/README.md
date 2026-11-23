# ReKit: second-hand sports equipment marketplace (prototype)

"ReKit" is a placeholder name. A clickable prototype of a free classifieds site for
used sports gear, launching in the UAE with the rest of the GCC to follow. It works like
Dubizzle, but only for sport. Users pay nothing; advertisers pay for the placements.

## Open it

Open `index.html` in any browser. It has no build step and no server. It works on
desktop and phone widths, and on phones it shows an app-style bottom tab bar.

## What's in the prototype

| Screen | What it does |
|---|---|
| Home | Search by keyword and emirate, 12 sport categories, a homepage banner ad, sponsored shop listings, fresh listings |
| Browse (`#browse`, `#sport-cycling`, …) | Filter by sport, emirate, price and condition, then sort. Sponsored listings and an in-feed ad are mixed into the results and labelled |
| Listing (`#listing-2`) | Photo gallery, details (condition, brand, size, location), seller card, a demo chat with quick replies, a "show phone number" button, safety tips, a targeted ad, similar items |
| Post an ad (`#post`) | Free posting form with photo upload. The ad shows up straight away (saved in your browser only) |
| Saved (`#saved`) | Saved listings and your own ads |
| Advertise (`#advertise`) | Pitch to advertisers, six ad products with example AED rates, ad rules, an enquiry form |
| Country picker | UAE live. KSA, Qatar, Oman, Bahrain and Kuwait show as "coming soon". Each market sets its own currency and cities in `MARKETS` |

All listings, sellers and advertisers are made-up sample data. The ad rates are
placeholders for planning, not market research.

## Revenue model (ads only, users always free)

1. **Homepage banner**: a flat weekly fee for one advertiser at a time.
2. **Sport takeover**: banner and in-feed ads inside one sport. This is the most valuable slot, because a padel shop reaches only padel buyers.
3. **Sponsored listings for businesses**: shops pay to put their stock at the top of matching searches. Private sellers never pay.
4. **Listing-page display ads (CPM)**: targeted by sport and emirate. Can start with Google Ad Manager and move to direct sales later.
5. **Newsletter features**: a weekly "fresh gear" email, split by sport.
6. **Event and club partnerships**: races, tournaments, academies.

Ad rules shown to advertisers: every ad is labelled, only sport, fitness and outdoor advertisers are accepted, and no pop-ups or autoplay video.

## Suggested path to a real product

1. **Validate**: choose the name and domain, then test the prototype with 10–20 players and 5 local sports shops. Would the shops pay for a sport takeover?
2. **MVP (web + app from one codebase)**:
   - Frontend: Next.js for the website (SEO matters for classifieds) and Expo / React Native for the iOS and Android apps, sharing logic.
   - Backend: Supabase or Firebase for accounts (phone OTP login, which is standard in the UAE), the listings database, photo storage and real-time chat.
   - Search: Postgres full-text search to start, Algolia or Meilisearch later.
   - Ads: Google Ad Manager for display ads, plus a simple in-house system for sponsored listings and takeovers sold directly.
3. **Trust & safety**: phone verification, report listing, moderation queue, banned-item rules, and in-app chat so numbers stay private.
4. **Legal (UAE)**: a trade licence that covers e-commerce or online marketplace activity, terms of use, a privacy policy in line with the UAE PDPL, and advertising content rules. Get local advice before launch.
5. **Expansion**: add a market to `MARKETS` with its currency and cities, then add Arabic (right-to-left) support. Plan for Arabic from day one in the real build.
