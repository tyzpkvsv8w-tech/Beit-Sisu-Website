# beitsisu.com — Website Check-up (6 October 2026)

**What I checked:** all 26 public pages listed in your sitemap. On each page I checked every link and image that points to beitsisu.com. I opened the main pages in a real browser, sized like an iPhone 13 and like a laptop, and read all the text for typos and leftover placeholder text.

**What I could not check:** my network blocked other websites, so I couldn't test links that leave your site. That covers the three Stripe "Buy Now" links, WhatsApp, Instagram, TikTok and the research links. **Please click each of those once yourself.** It takes about 2 minutes.

**Good news:** every image and internal link on beitsisu.com loads (no broken links, no missing images). The booking form works on phones, and the phone menu opens and closes correctly.

---

## Before you start: how to get into your website editor

Your site runs on **WordPress** with a custom theme called "beit-sisu".

1. Go to **https://beitsisu.com/wp-admin** and log in.
2. On the left is a black menu. You'll use **Pages**, **Posts**, **Services**, **Comments**, **Yoast SEO** and **BookingPress** below.
3. To edit a page: **Pages → All Pages**, hover over the page name, click **Edit**. Click any text to change it, then press the blue **Update** button (top right).

> ⚠️ **About the homepage:** your homepage uses a custom-built template. Some of its text may not show up in the normal page editor. If you open **Pages → Home → Edit** and can't find the text named below, it is written into the theme's code. Send that item to whoever built the site. It is a 1-minute job for them.

---

## 🔴 Fix first (visitors and Google can see these)

### 1. WordPress demo pages are still live
These pages came with WordPress and were never removed. Anyone can open them, and Google can list them in search results:
- https://beitsisu.com/sample-page/ ("I'm a bike messenger by day… I like piña coladas", plus a fake "XYZ Doohickey Company")
- https://beitsisu.com/hello-world/ ("Welcome to WordPress. This is your first post…")

**How to fix:**
1. Go to **Pages → All Pages**. Hover over **Sample Page** and click **Trash**.
2. Go to **Posts → All Posts**. Hover over **Hello world!** and click **Trash**.
3. Go to **Comments**. Hover over the comment from **"A WordPress Commenter"** and click **Trash**.

This also fixes the "Hello world!" and "A WordPress Commenter" text in the sidebar of the service pages (item 3).

### 2. Leftover online-shop pages, one showing raw code
https://beitsisu.com/my-account/ shows the text **`[woocommerce_my_account]`** instead of real content. A shop plugin (WooCommerce) was removed, but its pages were left behind. These pages are also empty or useless: **Shop**, **Cart** ("Your cart is currently empty!") and **Checkout**.

**How to fix:** go to **Pages → All Pages**. For each of **My account**, **Shop**, **Cart** and **Checkout**, hover over the name and click **Trash**.

> Do **not** delete these booking-system pages, even though they look empty. The booking plugin (BookingPress) needs them: *My Bookings, Thank you, Cancel appointment, Cancel Payment, Appointment cancellation confirmation, Appointment reschedule, Complete Payment, Book Appointment*.

### 3. The "Services" pages are empty and wide on phones
- https://beitsisu.com/services/infrared-saunas/
- https://beitsisu.com/services/cold-plunges/
- https://beitsisu.com/services/red-light-therapy/
- https://beitsisu.com/services/ (list page)

Each of these pages has only one huge photo and no text. On a phone the photo is about 4 times wider than the screen. The page scrolls sideways and **the menu button disappears off the right edge**. Your site menu doesn't link to these pages, but Google lists them in your sitemap.

**Simplest fix (hide them):**
1. Go to **Services** in the left menu (or **Posts**, if Services isn't listed).
2. Click each service to edit it. In the right-hand panel, find **Status** (or **Visibility**) and change it to **Draft** or **Private**. Click **Update** or **Save**.

**Better fix (if you want these pages):** add a description, prices and a "Book now" button to each one. Ask your developer to make the large photo fit the screen on phones.

### 4. Leftover placeholder text on the homepage: "Item description"
On the homepage, under **Benefits of Infrared Saunas → Improve Skin Health**, the paragraph ends with:
> "…the more you sweat, the better you'll feel.**Item description**"

**How to fix:** open **Pages → Home → Edit**. Find that paragraph and delete the words **"Item description"**. Click **Update**. If you can't find it, see the ⚠️ note at the top.

### 5. Your opening hours don't match
- Homepage (Contact Us section): **7AM – 8PM**
- Contact Us page: **7AM–9PM**

**How to fix:** decide which is correct. Then edit the other page (**Pages → Home** or **Pages → Contact Us → Edit**) so both say the same. Also check that your Google Business profile matches.

### 6. Duplicated sentence in a customer review
Jo Watkins' review on the homepage says the same sentence twice:
> "Great experience at Beit Sisu today and will certainly be making a cold plunge/infrared sauna visit here part of my weekly routine. Great experience at Beit Sisu today and will certainly be making…"

**How to fix:** in the homepage editor, find the review and delete the second copy of the sentence.

### 7. Old copyright year on the homepage
The homepage footer says **© 2024**, but every other page says **© 2026**.

**How to fix:** this is usually in **Appearance → Customize → Footer**, or in the homepage editor. Change it to 2026. If you can't find it, send it to your developer; they can make it update itself every year.

### 8. Spelling mistake in your Google title: "Infared"
The title Google shows for your booking page is *"Book Your **Infared** Sauna or Ice Bath | Beit Sisu Dubai"*.

**How to fix:**
1. Go to **Pages → Book Appointment → Edit**.
2. Scroll down to the **Yoast SEO** box under the page, or click the Yoast icon at the top right.
3. In **SEO title**, change "Infared" to **Infrared**. Click **Update**.

---

## 🟠 Phone layout problems

### 9. "Book Now" and "Buy Now" buttons have tiny text on phones
On phones, the text on the homepage **Book now** and **Buy Now** buttons is only about 9.6px tall. That's very small to read and tap; 14–16px is recommended. These are your most important buttons.

**How to fix:** this is a theme style, so it can't be changed from the page editor. Ask your developer: *"Please make the .btn text at least 14px on mobile."* If you have **Appearance → Customize → Additional CSS**, you can paste this yourself and click **Publish**:
```css
@media (max-width: 767px) { a.btn, .btn { font-size: 14px !important; padding: 12px 20px !important; } }
```

### 10. Homepage scrolls slightly sideways on laptops
On a standard laptop screen (1366px wide), the **Memberships** section is about 17px wider than the screen. The "Black Membership" box touches the right edge, and the page wobbles sideways a little.

**How to fix:** ask your developer to adjust the membership row's width. You can also try pasting this into **Appearance → Customize → Additional CSS**:
```css
html, body { overflow-x: hidden; }
```

### 11. Booking form: services have no photos
In the booking form, every service (Intro Offer, 1 Person / 2 Person Contrast Therapy, Cold Plunge…) shows a grey "mountain" placeholder icon instead of a picture.

**How to fix:**
1. Go to **BookingPress → Services**.
2. Click **Edit** on each service.
3. Under **Service image**, upload a photo (the same photos as on your homepage work well). Click **Save**.

---

## 🟡 Typos and wording (FAQ page and others)

Edit with **Pages → Frequently Asked Questions → Edit** (or the page named in the item). Click the text, fix it and press **Update**.

| Where | Current text | Change to |
|---|---|---|
| FAQ → *What if I want a refund* | "range **from from** 50-75 degrees" | "range from 50–75 degrees" |
| FAQ → *What are the temperatures used?* | "reach 75C, but will range from **50-70C**" | "50–75C" (the rest of the site says 50–75C) |
| FAQ → *Is it a private room?* | "completely private and **equip** with an ice bath" | "equipped with" |
| FAQ → *Is it a private room?* | "(30 mins or 1 hr sessions)" | "(30, 60 or 90 min sessions)" (matches *How long are the sessions?*) |
| FAQ → *Best time to do a cold plunge?* | "If **afte** a gym session" | "If after a gym session" |
| FAQ → same answer | "you won't **effect** that healthy inflammation" | "affect" |
| FAQ → *First time doing a cold plunge* | "consult your **doctor professional** prior" | "consult your doctor first" |
| FAQ → *Difference between Red Light Therapy and…* | "**Infrared Red Sauna**" | "Infrared Sauna" |
| FAQ → *Who should not use a sauna?* | "Anyone **under the age of 16** (under 18 needs parent/guardian in attendance, under 13 not permitted)" | This contradicts itself. Decide your rule, e.g. "Under 13s are not permitted. Guests aged 13–17 must be accompanied by a parent or guardian." |
| FAQ → *Can I bring a friend?* (both) | "AED40+ per person per session charge" | "an additional guest fee of AED 40 per person per session" (and say whether "+" means "+VAT") |
| FAQ → *What do I need to do after my sauna?* | "just bring along your own **drinking device**" | "your own water bottle" |
| Homepage → *Improve Skin Health* | "Infrared saunas **reduces**" | "Infrared saunas reduce" |
| Homepage → *Sleep & Relaxation* | "more melatonin**-** to your brain" | "more melatonin – to your brain" |
| Homepage → *Sleep & Relaxation* | "Infrared saunas provide one of the best sources of quality relaxation, **and how this can help** improve…" | "Infrared saunas are one of the best sources of quality relaxation, which helps improve…" |
| About Us | "Dubai **media** City" | "Dubai Media City" |
| About Us | "natural stone **sets** the tone" | "natural stone set the tone" |
| Contact Us | "WhatsApp: **+97158596 3805**" | "+971 58 596 3805" (same as the FAQ) |
| BookingPress service descriptions | "This invigorating combination of infrared sauna and cold plunge **are** guaranteed…" | "…**is** guaranteed…" (edit in **BookingPress → Services**) |
| BookingPress Intro Offer | "Only available to avail once." | "Can only be used once per customer." |
| Cancel appointment page | "Sorry to hear that you have **requested for cancel** the appointment. We have sent an email notification for cancel appointment." | "We're sorry to see you go. We've emailed you a link — please click the button in that email to confirm your cancellation." |
| Cancel Payment page | "Your payment **has been failed**." | "Your payment didn't go through. Please try again." |

### Your advice doesn't match between pages
Customers may be confused because the **FAQ** and **Blog** give different session timings:
- FAQ (*How often should I go from hot to cold?*): "about **10 minutes** in the sauna, **30 sec–1 min** in the plunge"
- Blog: "**15–20 minutes** in the infrared sauna, followed by a **2–4 minute** cold plunge"

Pick one recommendation and use it on both pages.

---

## 🔵 Smaller improvements (nice to have)

12. **Quote credited to Heraclitus.** The homepage quote *"The content of your character is your choice…"* is widely said to be misattributed; Heraclitus likely didn't write it. Consider removing the name or using a different quote.
13. **No "Book" or "Blog" link in the top menu.** Visitors can book only through the buttons on the page. Go to **Appearance → Menus** (or **Appearance → Editor → Navigation**). Add **Book Appointment** (and **Blog**, if you want people to read it), then click **Save Menu**.
14. **Images with no description ("alt text").** Several homepage and About Us photos have empty descriptions, and the main photo is just called "Hero Banner". Descriptions help Google and blind visitors. Go to **Media → Library**, click each photo and fill in **Alternative Text** (e.g. "Private infrared sauna and cold plunge suite at Beit Sisu Dubai").
15. **Social links use old `http://` addresses.** The Instagram and TikTok icons point to `http://instagram.com/beitsisu` and `http://www.tiktok.com/@beitsisu`. Change them to `https://www.instagram.com/beitsisu/` and `https://www.tiktok.com/@beitsisu`. They're usually in **Appearance → Menus** or **Appearance → Customize**.
16. **Leftover archive pages Google can find:** `/category/uncategorized/` and `/author/admin/`. After you delete "Hello world!", these will be empty. In **Yoast SEO → Settings → Advanced → Author archives**, turn author archives **off**.
17. **"Free delivery until 24/12"** appears in an old Instagram post shown on your homepage feed. That's fine, but if it bothers you, hide that post in **Instagram Feed → Settings → Moderation**.

---

## ✅ Quick checklist

- [ ] Trash *Sample Page*, *Hello world!* post and the demo comment
- [ ] Trash *My account*, *Shop*, *Cart*, *Checkout* pages
- [ ] Hide (Draft/Private) the 3 empty Services pages
- [ ] Delete "Item description" on homepage
- [ ] Make opening hours match (8PM or 9PM?)
- [ ] Fix Jo Watkins' duplicated review
- [ ] Change homepage © 2024 → 2026
- [ ] Fix "Infared" in the booking page's Yoast SEO title
- [ ] Bigger "Book Now"/"Buy Now" button text on phones
- [ ] Add photos to BookingPress services
- [ ] Fix FAQ typos and the 13/16/18 age rule
- [ ] Make FAQ and Blog timing advice match
- [ ] Click the 3 Stripe "Buy Now" links, WhatsApp, Instagram and TikTok yourself to check they still work
