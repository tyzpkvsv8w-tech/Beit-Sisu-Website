# Search Console "Page indexing" issues: investigation (26 Oct 2026), ✅ fixes applied 27 Oct

Source: Search Console export "Coverage", data up to **19 Oct 2026**. At that point 12 pages were indexed and 17 were not.

The export only gives counts per reason, not which pages. I checked every sitemap URL, plus the old URLs Google is likely to know, the way Googlebot sees them. robots.txt is fine and doesn't block anything important.

| Google's reason | Pages | What it is | Problem? |
|---|---|---|---|
| Not found (404) | 3 | Deleted pages Google still remembers: `/hello-world/`, `/sample-page/`, `/join-the-club/`, the old WooCommerce `/shop/`, `/cart/`, `/checkout/`, `/my-account/` | **No.** A 404 is the correct answer for a deleted page; Google drops them by itself. |
| Excluded by "noindex" tag | 2 | `/author/admin/` and `/category/uncategorized/`, hidden on purpose by Yoast | **No.** Intentional. |
| Blocked due to access forbidden (403) | 1 | Almost certainly `/xmlrpc.php` (blocked by the host for security) or a login page | **No.** |
| Duplicate without user-selected canonical | 1 | Probably an address variant, e.g. `/?p=…`, `/home/`, `http://`/`www.` versions. All of these redirect correctly now. | **No.** |
| Crawled, currently not indexed | 10 | See below | **Partly.** |

## What's worth fixing (needs your OK)

1. **Seven behind-the-scenes booking pages are in the sitemap and marked "index":**
   - `/thank-you/`
   - `/my-bookings/`
   - `/cancel-appointment/`
   - `/cancel-payment/`
   - `/appointment-cancellation-confirmation/`
   - `/appointment-reschedule/`
   - `/bookingpress-complete-payment/`

   We are telling Google they matter. Google crawls them, sees almost nothing, and lists them as "Crawled, currently not indexed". That accounts for most of the 10.

   **Fix:** in Yoast, set each to "Allow search engines to show this page: No". They then leave the sitemap and stop showing as issues. Booking keeps working; `/book-appointment/` stays in Google.
2. **Author page for my helper account.**
   - The three articles and the rental page were published under the helper login `claude-helper1`. So Google sees an author page `/author/claude-helper1/` (in the sitemap, set to index), and that name appears as the articles' author in Google's data.
   - **Fix:**
     - Change the author of those 4 items to your main `admin` account (or whichever name you'd like shown).
     - Turn off author pages in Yoast (Settings → Advanced → Author archives). It's a one-business site, so they add nothing.
3. **"Services Archive" page** (`/services/`). It's a thin automatic list page titled "Services Archive", in the sitemap and set to index.
   - **Fix:** hide it from search in Yoast (Settings → Content types → Services → archive). The three real service pages are unaffected.

## Normal and expected
- New pages (the two new articles and the ice bath rental page) are often "Crawled, currently not indexed" for a few weeks. Use URL inspection → Request indexing in Search Console to speed them up.
- After the fixes, open each issue in Search Console and click **Validate fix**.

## Owner's screenshots (26 Oct) confirmed
- **Crawled, currently not indexed (10):**
  - 7 are code files: BookingPress `.js` files (4), the WordPress emoji script (2), `/services/feed/`. Google never indexes those, so it's normal.
  - The other 3 are `/bookingpress-complete-payment/`, `/thank-you/` and `/my-bookings/`.
- **404 (3):**
  - `/join-the-club/` (deleted page)
  - `/wp-content/plugins/*` (a malformed address, not a real page)
  - an old BookingPress cart calendar-download link (the Cart add-on is now off)
  - All fine.
- **Indexed (14):** includes `/ice-bath-rental-dubai/` and `/how-cold-is-an-ice-bath/` (crawled 24 Oct), but also `/author/claude-helper1/` and `/services/`.

## ✅ Fixes applied 27 Oct 2026 (owner: "Go ahead. Use Beit Sisu")
1. **Booking pages hidden** (Yoast "noindex" on each): thank-you, my-bookings, cancel-appointment, cancel-payment, appointment-cancellation-confirmation, appointment-reschedule, bookingpress-complete-payment. Page content checked unchanged; booking smoke test OK.
2. **Author:**
   - The 3 articles and the rental page now belong to the main `admin` account, whose public display name is now **Beit Sisu**. Google's data on the articles shows author "Beit Sisu"; "claude" no longer appears anywhere on the page.
   - Yoast author archives turned off: `/author/claude-helper1/` and `/author/admin/` now 301-redirect to the homepage, and the author sitemap is gone.
3. **Services Archive** (`/services/`): now "noindex" (Yoast → Content types → Services → archive). The 3 service pages stay indexed.

Sitemaps now list only real pages:
- **Pages:** home, Collaborations, About, Contact, Book Appointment, FAQ, Ice Bath Rental
- **Services:** the 3 service pages
- **Posts:** Blog plus the 3 articles

**Owner next step:** in Search Console → Page indexing, open "Crawled – currently not indexed" and click **Validate fix**. Optionally do the same for "Not found (404)". Results take 1–4 weeks.
