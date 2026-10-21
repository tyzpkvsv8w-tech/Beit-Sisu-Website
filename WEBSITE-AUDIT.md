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

---

# Part 2 — Booking system check (BookingPress)

**What I did:** I went through the whole booking form like a customer, on an iPhone-sized screen and on a laptop: Service → extras pop-up → Room → Date & Time → Cart → Customer Details → Summary. I tried four services and both rooms, and checked the next 8 days of time slots. **I stopped before pressing "Book Appointment"**, so no booking was made and no slot was blocked; the browser record shows nothing was sent except "show me the time slots".

**Good news:** the form loads quickly with no errors. Every step works. You can't book a time that has already passed, and fully booked times are hidden. The pricing is consistent: a 2-person session is always AED 40 more than 1 person, matching the FAQ. Empty or badly typed email addresses are correctly rejected.

> **Where things are:** in WordPress, click **BookingPress** in the left menu. Your "rooms" (Tub, Barrel) are set up in BookingPress as **Staff Members**, so look there for anything about rooms. Exact menu names can differ slightly between BookingPress versions. If something isn't where I say, look in **BookingPress → Customize** or **BookingPress → Settings**.

## 🔴 Fix first

### B1. Opening hours in the booking system don't match the website
The website says **"Open 7 Days a Week, 7AM – 8PM"** (and 9PM on the Contact page). The booking form actually offers:

| Day | First slot | Last 60-min slot (finishes) | Last 15-min cold plunge (finishes) |
|---|---|---|---|
| Mon 12 / Tue 13 Oct | **10:00 am** (all services, both rooms) | 6:50 pm (7:50 pm) | 7:30 pm (7:45 pm) |
| Wed / Thu | 7:00 am | 6:50 pm (7:50 pm) | 7:30 pm (7:45 pm) |
| Fri | 7:00 am | ~7:20 pm (8:20 pm) | 8:00 pm (8:15 pm) |
| Sat | 7:00 am | 7:50 pm (**8:50 pm**) | 8:30 pm (**8:45 pm**) |
| Sun | 8:00 am | 7:50 pm (**8:50 pm**) | 8:30 pm (8:45 pm) |

So customers **can't book before 10am on Mondays and Tuesdays**, even though the site says 7AM. On weekends they can book sessions that finish around 8:50pm, after the "8PM" closing time on your homepage.

**How to fix:**
1. Decide your real hours for each day.
2. Go to **BookingPress → Settings → Working Hours**. Set each day's start and end time.
3. Go to **BookingPress → Staff Members**. Open **Tub**, then **Barrel**. If either has its own **Working Hours** tab, set it the same (or turn off "custom working hours").
4. Update the homepage and Contact Us page so they say the same thing. If the hours differ by day, list them, e.g. "Mon–Tue 10AM–8PM, Wed–Sun 7AM–9PM".

### B2. On phones, the payment choice is hidden
On the last step (Summary) on a phone, the heading **"Select Payment Method"** is cut off at the bottom of the box. The two options, **"Pay Post Service"** and **"Credit Card/Apple Pay"**, only appear if the customer scrolls *inside* the booking box. **Neither option is pre-selected**, but the "Book Appointment" button is right there. Customers may press it without noticing they need to choose how to pay.

**How to fix:** in **BookingPress → Settings → Payment** (sometimes **Payment Gateways**), set a **default payment method** if your version has that option. Also ask your developer to make the booking box taller on phones so the payment options are visible. To see what customers see, do one real test booking on your own phone and press "Book Appointment" *without* choosing a payment method.

### B3. Phone number isn't checked
I typed **"12"** as the phone number and the form accepted it. Only the email address is checked. You could end up with bookings you can't call or WhatsApp.

**How to fix:** go to **BookingPress → Customize → Form Fields** (or **Settings → General**). Find **Phone Number** and turn on **phone number validation** if it's there. Set a minimum length too.

### B4. Phone box defaults to the USA 🇺🇸
The phone field shows a **US flag** and the example "**+1** 201 555 0123". Almost all your customers will have UAE (+971) numbers, so many will type their number with the wrong country code.

**How to fix:** go to **BookingPress → Settings → General** and set **Default Phone Country Code** to **United Arab Emirates (+971)**. Click **Save**.

## 🟠 Confusing for customers

### B5. "Cart Total (Deposit)" but you charge the full price
The cart step says **"Cart Total (Deposit) 220.00"**, and the summary then says **"Total Amount Payable 220.00"**. Customers may think 220 is only a deposit and more is due later.

**How to fix:** if you don't take deposits, go to **BookingPress → Settings → Payment**. Turn **Deposit payment** off, or rename the label in **BookingPress → Customize → Labels**.

### B6. The cart says "220.00 of 220.00"
Under the price, the cart shows "of 220.00". This is a leftover from the deposit feature in B5, and fixing B5 should remove it.

### B7. Date and time are stuck together in the cart
The cart shows **"October 7, 202610:00 am – 11:00 am"**. The space between the year and time is missing. Change the **date format** in **BookingPress → Settings → General** (e.g. to "7 Oct 2026"), or ask your developer to add a space.

### B8. Payment option called "Pay Post Service"
It's unclear English. **How to fix:** in **BookingPress → Settings → Payment**, open the on-site / pay-later method. Change its **title** to **"Pay at the studio"**.

### B9. Prices show "د.إ" instead of "AED"
The booking form shows prices like **220.00د.إ**, but the rest of your website uses "AED 220". Some visitors won't recognise the Arabic symbol. **How to fix:** in **BookingPress → Settings → Payment**, look for **Currency symbol / price format**. Pick the option that shows **AED**, or ask your developer to swap it.

### B10. Rooms "Tub" and "Barrel" have no photos or explanation
The Room step shows two large grey **person-shaped placeholders**. On a phone, the room names are hidden below them. Customers can't tell what the difference is.

**How to fix:**
1. Go to **BookingPress → Staff Members** and open **Tub**.
2. Upload a photo of the room as its profile picture. In the description, add one line like *"Room with a round cold-plunge tub"*.
3. Repeat for **Barrel**.

There's also an **"Any Room"** option, which is good for customers who don't mind.

### B11. Services have no photos, and two pairs have identical names
All 8 services show a grey mountain placeholder (also in item 11 of Part 1). Two services are both called **"1 Person: Private Contrast Therapy"** and two are called **"1 Person: Private Cold Plunge"**; only the small "Duration" line tells them apart.

**How to fix:** in **BookingPress → Services**, open each one and upload a **Service image**. Put the time in the name, e.g. **"1 Person: Private Contrast Therapy – 60 min"** and "… – 30 min".

### B12. Services you mention on the website but can't book
- The FAQ says *"Contrast Therapy: 30/60/90mins sessions"*, but **there is no 90-minute session** in the booking form; the "Extra Time" add-on is 20 minutes for AED 60. Either add a 90-min service or change the FAQ.
- The homepage **Memberships** (Silver / Gold / Black) can only be bought through the Stripe links, not the booking form. Make sure members know how to book their sessions without paying again, e.g. a coupon code or a note on the booking page.

### B13. The Intro Offer: how do people book sessions 2 and 3?
*"Intro Offer… AED 350, and get 3x 60min contrast therapy sessions"* is booked as **one** 60-minute appointment. Nothing tells the customer how to book their 2nd and 3rd sessions. Add a sentence to the offer's description (**BookingPress → Services → Intro Offer**), e.g. *"Book your first session here. We'll send you a code to book your next two."* Match it to however you actually do it.

## 🟡 Small wording fixes (in BookingPress → Services or Customize → Labels)

| Where | Current | Change to |
|---|---|---|
| Contrast Therapy service descriptions | "This invigorating combination… **are** guaranteed" | "…**is** guaranteed" |
| Intro Offer description | "Only available to avail once." | "Can only be used once per customer." |
| Summary step | "Have a coupon code **?**" | "Have a coupon code?" |
| Extras pop-up | "Extra Time — 20 m" | "Extra 20 minutes" (clearer) |

## ✅ Still worth doing: one real test booking
These parts can only be tested with a real booking: Stripe payment, the confirmation email, the "Thank you" page, and the cancel/reschedule links. Make one booking yourself with your own email and the **Credit Card/Apple Pay** option, then check:
- [ ] Payment page opens and shows the right amount
- [ ] Confirmation email arrives, with the right date, time, room and address
- [ ] The "Thank you" page shows the Booking ID, service and date (they're blank fields when the page is opened directly)
- [ ] The cancel link in the email works
- [ ] Cancel the test appointment afterwards in **BookingPress → Appointments**, and refund it in Stripe

---

# Part 3 — SEO (getting found on Google)

**Checked on 9 October 2026.** The good news: your basics are already in place. Every main page has a Google title and description, the sitemap works, Google is allowed to read the site, and the pages are mobile-friendly. Since my first check, the "Infared" typo in the booking page title has been fixed. ✅

The biggest opportunities are below, **most valuable first**. People searching "ice bath Dubai" or "sauna near me" are mostly found through **Google Maps** and **dedicated pages for each service**. Right now you have neither set up fully.

## ⭐ 1. Google Business Profile (biggest win, not on your website)
For local businesses, the map listing at the top of Google often matters more than the website.
1. Go to **business.google.com** and claim or check the listing for **Beit Sisu**.
2. Make sure the **name, address (Arjaan by Rotana, Dubai Media City), phone, website and opening hours** match your website *exactly*. Decide the hours first (Part 2, B1).
3. Choose categories: primary **"Sauna"**; add **"Wellness center"**, **"Health spa"** and **"Day spa"** if offered.
4. Upload 10+ real photos of the suites, sauna, plunge and reception.
5. **Ask happy customers for Google reviews.** A QR code at reception, or a link in your booking confirmation email. Reply to every review.
6. Add the **booking link** (beitsisu.com/book-appointment/) as the "Book" button.

## ⭐ 2. Turn the empty Services pages into real pages (changes Part 1, item 3)
In Part 1 I suggested hiding the 3 empty Services pages. **For SEO it's better to fill them**, because each one can rank for its own search. Your site currently has **no page focused on "cold plunge Dubai", "ice bath Dubai", "infrared sauna Dubai" or "red light therapy Dubai"**. Everything is squeezed onto the homepage.

For each of **Infrared Saunas**, **Cold Plunges** and **Red Light Therapy**, write about 400–700 words covering:
- What it is and what a session at Beit Sisu looks like (private suite, temperatures, duration)
- Benefits, using the text already on your homepage
- Prices (from the booking form) and a **Book now** button
- 3–5 FAQs specific to that service
- Location line: "in Dubai Media City, minutes from Dubai Marina, JBR and Palm Jumeirah"

Suggested Google titles and descriptions (set in the **Yoast SEO** box at the bottom of each page):

| Page | SEO title | Meta description |
|---|---|---|
| Infrared Saunas | Private Infrared Sauna in Dubai Media City \| Beit Sisu | Book a private full-spectrum infrared sauna suite in Dubai Media City. 30 or 60 min sessions, cold plunge included. Free valet parking. |
| Cold Plunges | Private Cold Plunge & Ice Bath Dubai \| Beit Sisu | Private ice bath sessions at 3.5–8°C in Dubai Media City. 15 or 30 min cold plunge, solo or with a friend. Book online today. |
| Red Light Therapy | Red Light Therapy Dubai \| Private Suites \| Beit Sisu | Red light therapy towers in private contrast therapy suites in Dubai Media City. Pair with infrared sauna and cold plunge. Book online. |

*Note:* the theme shows these pages with a sidebar ("Recent Posts", "Archives") and a photo that's too wide on phones (Part 1, item 3). Ask your developer for a clean layout without the sidebar before you publish them, or I can try a fix with access.

## ⭐ 3. Tell Google you're a local business ("LocalBusiness schema")
Behind the scenes, your site tells Google it's an "Organization", but not **what kind of business, where it is, or when it's open**. Google uses this for Maps and rich results.

**How to fix:**
- **Free:** install the plugin **"WPCode"**. Go to **Code Snippets → Add Snippet**, choose **Add Your Custom Code**, set type to **HTML**, and set location to **Site Wide Header**. Then paste the code below, with your *real* hours, and click **Save** and **Activate**.
- **Or** buy **Yoast Local SEO** (paid add-on), which adds this through a simple form.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HealthAndBeautyBusiness",
  "@id": "https://beitsisu.com/#localbusiness",
  "name": "Beit Sisu",
  "url": "https://beitsisu.com/",
  "image": "https://beitsisu.com/wp-content/uploads/2024/10/DSC08781.jpg",
  "logo": "https://beitsisu.com/wp-content/uploads/2026/07/Beit-Sisu-Circle-Logo-02-3.png",
  "telephone": "+971585963805",
  "email": "hello@beitsisu.com",
  "priceRange": "AED 85–1,899",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Arjaan by Rotana, Dubai Media City",
    "addressLocality": "Dubai",
    "addressCountry": "AE"
  },
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
      "opens": "07:00", "closes": "20:00" }
  ],
  "sameAs": [
    "https://www.instagram.com/beitsisu/",
    "https://www.tiktok.com/@beitsisu"
  ]
}
</script>
```
⚠️ Change `"opens"` / `"closes"` to your real hours first (see Part 2, B1). If hours differ by day, I can write the per-day version.

Also in **Yoast SEO → Settings → Site representation**, add your **TikTok** profile; only Instagram is listed now.

## 4. One main heading per page
Google reads the biggest heading (the "H1") as the topic of the page. Several pages have many H1s: the **homepage has 8**, the FAQ 5 and About Us 4. Your homepage's main heading should say what you are and where, e.g. **"Private Cold Plunge & Infrared Sauna Studio in Dubai"**.

**How to fix:** in the page editor, click a heading block, and in the toolbar change the level from **H1** to **H2**. Keep only one H1 per page. On the homepage, the headings are probably set in the theme's code, so this one may need your developer.

## 5. Make the Blog a real blog
Your only article ("Cold Plunge or Sauna First?") is pasted *into* the **Blog page**, so it has no address of its own. The real blog list only contains "Hello world!". New articles have nowhere to go, and Google can't treat the article as an article.

**How to fix:**
1. Go to **Posts → Add New**. Paste the article, give it the same title, and add a photo as the **Featured image**. Click **Publish**.
2. Change its address (the **Permalink**/**URL** field in the right panel) to `sauna-or-cold-plunge-first`.
3. Go to **Settings → Reading** and set **Posts page** to **Blog**. Click **Save**. The Blog page will now list your articles automatically.
4. Add **Blog** to the top menu (Part 1, item 13).

**Article ideas** that people in Dubai search for. Aim for one a month, each linking to the matching service page and the booking page:
- How cold is an ice bath? Beginner's guide to cold plunging in Dubai
- Infrared sauna vs traditional sauna: what's the difference?
- Contrast therapy for athletes and runners in Dubai
- Is red light therapy worth it? What the research says
- Best recovery routine after a workout in Dubai Marina / JLT
- Date-night and friends ideas in Dubai that aren't brunch (2-person suites)
- Corporate wellness ideas for Dubai Media City teams (links to Collaborations)

## 6. Thin pages: add a bit more text
- **Contact Us** has only ~49 words. Add a "How to find us" paragraph (hotel entrance, valet, which floor, nearest metro/tram), your opening hours, and the Google Map. People search "Beit Sisu location", and Google likes to see it.
- **Book Appointment** has ~33 words. Above the booking form, add 2–3 lines: what's included, cancellation policy, and "Questions? WhatsApp us".

## 7. Images: descriptions and speed
- **Alt text (descriptions):** the homepage has **9 images without a description** and About Us has 2. Go to **Media → Library**, click each photo and fill in **Alternative Text** with plain words, e.g. *"Private infrared sauna suite at Beit Sisu Dubai"*. Don't stuff keywords.
- **Rename future uploads** before uploading, e.g. `cold-plunge-dubai-beit-sisu.jpg` instead of `DSC08817.jpg`. Also fix the misspelt file `red-light-theraphy.png`.
- **Speed:** your server runs LiteSpeed, but the free **LiteSpeed Cache** plugin isn't installed. Install it (**Plugins → Add New → "LiteSpeed Cache"**, **Install**, **Activate**). Then in **LiteSpeed Cache → Image Optimization**, click **Send Optimization Request** to convert photos to the lighter WebP format. That should cut the homepage's 1.5 MB of images by roughly half. *Check the booking form still works after turning it on.* If the booking calendar misbehaves, go to **LiteSpeed Cache → Cache → Excludes** and add `/book-appointment/`.
- For your developer: jQuery is loaded twice, and the fonts are in the old `.ttf` format (`.woff2` is about 50% smaller).

## 8. Social sharing previews
Most pages have no preview image, so links shared on WhatsApp, Instagram or Facebook show a blank box. Go to **Yoast SEO → Settings → Site basics** (or **Social sharing**) and set a **default social image**. Use a 1200×630 photo of a suite. While there, fill in the **Tagline**; it's currently empty.

## 9. Small Yoast settings
- **Yoast SEO → Settings → Advanced → Author archives:** turn **off** (removes the `/author/admin/` page).
- **Yoast SEO → Settings → Categories & tags → Categories:** set **Show in search results** to **off** until you have real blog categories.
- **Yoast SEO → Settings → Content types → Services:** fill in the services first (item 2). Until then, set them to **not show in search results**.
- After the leftover pages are trashed (Part 1), go to **Google Search Console** (search.google.com/search-console). Add beitsisu.com if it isn't there, and submit `https://beitsisu.com/sitemap_index.xml`. You already have **Site Kit by Google** installed, which can connect this for you under **Site Kit → Dashboard**.

## What I can do once I have access (Part 1 "access" steps)
- Set the SEO titles and descriptions above, plus the Tagline, default social image and Yoast settings
- Add the LocalBusiness code (after you confirm the hours)
- Fix heading levels on pages I can edit
- Move the blog article into a real post and set up the Blog page
- Write alt text for all images
- **Draft** the three service pages and 2–3 blog articles for you to review. I'll save them as drafts, not publish, so you can check the facts and tone first.

What only you can do: **Google Business Profile**, asking customers for reviews, and approving the drafts.

---

# Progress update: 15 October 2026 (fixes made directly on the site)

A full UpdraftPlus backup (database + files, also copied to Google Drive) was taken first: **15 Oct 2026 11:36**. Each change was re-read after saving and checked on the live page.

## ✅ Done
| Item | What changed |
|---|---|
| Opening hours (Part 1 #5, B1 website side) | Homepage (Company Info) and Contact Us now both show: Mon–Tue 9:30AM–8PM · Wed–Fri 6:30AM–8PM · Sat 6:30AM–9PM · Sun 7:30AM–9PM (may change on public holidays) |
| Jo Watkins' review (#6) | Duplicated sentence removed (Testimonials) |
| © 2024 on homepage (#7) | Footer now shows the current year automatically (`footer.php`) |
| "Item description" (#4) | Removed (Services → Infrared Saunas → Improve Skin Health) |
| FAQ typos (🟡 table) | "from from", 50–70C → 50–75C, "equip" → "equipped", "afte", "effect" → "affect", "doctor professional", "Infrared Red Sauna", "drinking device" → "water bottle", "AED40+" wording, "30 mins or 1 hr" → "30, 60 or 90 min" |
| Age rule | "Children under 13 (guests aged 13–17 must be accompanied by a parent or guardian)" |
| Homepage wording | "reduces" → "reduce", "melatonin-", "and how this can help" |
| About Us | "Dubai Media City", "natural stone set the tone" |
| Contact Us | WhatsApp now "+971 58 596 3805" |
| FAQ vs Blog timings | Blog now matches the FAQ: ~10 min sauna, 30 sec–1 min plunge, 3–4 rounds an hour |
| Cancel pages | Clearer wording on "Appointment canceled" and "Cancel Payment" |
| Leftover Shop page (#2) | Unpublished (set to Draft): now "not found" and out of the sitemap. Demo pages, My account, Cart and Checkout were already gone. |
| Social links (#15) | Instagram/TikTok now `https://` (Company Info) |
| Phone buttons (#9) | "Book now"/"Buy Now" text 9.6px → 14px on phones (`style.css`) |
| Sideways scroll on laptops (#10) | Fixed (`style.css`, `body { overflow-x: clip; }`) |
| LocalBusiness schema (SEO #3) | Added to `header.php` with the per-day hours, address, phone, email, Instagram and TikTok |
| Image descriptions (SEO #7) | Alt text on the 5 main photos; homepage template now uses them instead of "Hero Banner" / empty |
| Tagline (SEO #8) | "Private infrared sauna, cold plunge & red light therapy in Dubai Media City" |
| Social preview image (SEO #8) | Yoast default image = suite photo (DSC08781); shows on every page |
| Yoast | TikTok added and Instagram link cleaned (Site representation); category archives hidden from Google |

## ⏳ Still to do
**Owner (2 minutes each, in BookingPress → Services → click the service → Description → Save):**
- 1 Person / 2 Person Private Contrast Therapy: "…combination of infrared sauna and cold plunge **are** guaranteed…" → "**is** guaranteed".
- Intro Offer: "Only available to avail once." → "Can only be used once per customer."
  (I didn't automate these because saving that screen re-saves the whole service setup.)

**Owner, outside the website:** Google Business Profile with the new hours (SEO #1), Google Search Console sitemap submit (SEO #9), asking for reviews.

**Bigger jobs I can do next, with your OK:**
- Write the three Services pages (SEO #2). The Red Light Therapy service also has 8 copies of a placeholder FAQ ("Mental Health & Brain Boosters") that should be replaced.
- Turn the Blog article into a real post (SEO #5).
- One H1 per page (SEO #4). Needs theme template changes and a visual check.
- Contact Us "How to find us" text and Book Appointment intro (SEO #6). Needs your details.
- LiteSpeed Cache / image compression (SEO #7). Needs a booking test afterwards.
- Booking form photos and labels (Part 2 B2–B13).

## Update: 15 October 2026 (afternoon)
Backup first: **15 Oct 2026 12:31**.

**Done on the live site**
- **One H1 per page (SEO #4):** section headings in `front-page.php` and `page.php` changed from `<h1>` to `<h2 class="section-title section-h1">`, with a matching CSS rule so they look identical (checked with before/after screenshots, phone and laptop). The homepage "Book a private contrast therapy suite now." heading is now an H2. Every main page now has exactly one H1.
- **FAQ page:** removed an empty `<h3>` the template printed in every Infrared Sauna / Cold Plunge question (a typo in the theme). Those sections now have the same spacing as the General section.

**Waiting for your approval** (my session's safety check blocks publishing new wording or larger theme changes without it): see **`WEBSITE-CHANGES-FOR-APPROVAL.md`**:
- Services pages text, Red Light FAQ, Contact "How to find us", Booking intro
- Proposed `single.php` layout (`proposed-theme-changes/single.php`) and the Blog move
- Caching/image plan and the BookingPress settings

## Update: 15 October 2026 (evening): approved changes published
Backup first: **15 Oct 2026 13:17**. All items from `WEBSITE-CHANGES-FOR-APPROVAL.md` were approved ("approve all") and published, using the owner's answers.

| Item | Result |
|---|---|
| Services/blog layout | `single.php` now has the black title banner (one H1), photo column, text, Benefits + FAQ accordions, Book Now button, no sidebar. Checked on phone and laptop, no sideways scroll. |
| Services content box | `functions.php`: `'editor'` support switched on for the Services post type, so Services now edit in the block editor with a main content area. |
| Services pages text | Infrared Saunas, Cold Plunges (incl. 30 min AED 120) and Red Light Therapy now have full text (~1,100 words each including Benefits/FAQ) |
| Red Light FAQ | 8 placeholder copies replaced with 5 real questions (no set time; no eye protection provided) |
| Contact Us | "How to find us" added (ground floor, just past the lobby) |
| Book Appointment | Intro added, incl. 12-hour cancellation/reschedule policy |
| Blog | Article is now a real post: `/sauna-or-cold-plunge-first/` (Yoast title/description carried over). `/blog/` lists posts (Settings → Reading → Posts page = Blog) with a styled `index.php`. Blog page SEO title: "Blog \| Contrast Therapy, Sauna & Cold Plunge Tips \| Beit Sisu". |
| BookingPress | Phone default = UAE (+971); "Pay Post Service" → "Pay at the studio"; description typos fixed on services 1, 2, 3, 6, 7 (booking form before/after diff: only those sentences changed) |
| Caching | LiteSpeed Cache activated. Booking pages excluded (`/book-appointment/`, `/thank-you/`, `/my-bookings/`, cancel/reschedule pages, `/bookingpress-complete-payment/`), plus query strings `bookingpress-listener` and `appointment_id`. Normal pages show `x-litespeed-cache: hit`; booking pages show `no-cache`. Booking form tested up to the Room step. |

**Not possible / still open**
- "AED" instead of "د.إ": BookingPress has no setting for the symbol (only its position).
- WebP image conversion in LiteSpeed needs a free QUIC.cloud account linked by the owner (LiteSpeed Cache → General → Request Domain Key). WP-Optimize and reSmush.it were left as they were.
- Room/service photos in the booking form: need photos chosen by the owner.
- **Owner: one real test card booking + refund** now that caching is on (same as 12 Oct), then confirm the appointment appears.

## Update: 15 October 2026: booking form service photos (Part 2, B11)
Owner-supplied photos, resized to 1200×800 (59 KB / 94 KB), uploaded to every BookingPress service:
- Red-lit infrared sauna photo → Intro Offer (1), Contrast Therapy 1 & 2 person, 30 & 60 min (2, 3, 6, 7)
- Suite with cedar cold plunge barrel → Cold Plunge services (4, 5, 8)

Verified on the live booking form (phone): all 8 photos load, and service names/prices/descriptions are unchanged (before/after diff). Room photos (Tub/Barrel, B10) are still placeholders.
- **Barrel room photo (B10):** owner's barrel-and-shower photo, cropped square (900×900, 70 KB), set on BookingPress → Rooms → Barrel (ID 2). Verified on the live Room step (phone). Tub and Cold Plunge rooms still have placeholders.
- **Service photos updated (owner's request):** Tub room photo (square crop) on Intro Offer and all Contrast Therapy services (1, 2, 3, 6, 7); Barrel room photo (square crop) on all Cold Plunge services (4, 5, 8). All 8 load on the live form; names/prices/descriptions unchanged (diff).
- **Tub room photo:** Tub photo (square crop) set on BookingPress → Rooms → Tub (ID 1). Both Tub and Barrel photos load on the live Room step.
- **"Aesop bath products" → "Gymskin shower products"** everywhere it appeared: Infrared Saunas page text, Infrared Saunas FAQ ("What do I need to bring?", also shown on the FAQ page), Book Appointment intro. Live check: 0 mentions of Aesop left on any page in the sitemap.

## Update: 20 October 2026: Google review link in emails + first new blog draft
- **Review link** (`https://www.google.com/search?q=beit+sisu+reviews`, a cleaned version of the owner's link without session tracking codes) added as a line above the "Visit Our Website" button in all 4 booking confirmation emails (Cold Plunge / Contrast Therapy × Pre-paid / Pay at the studio). Each was saved and re-read to confirm.
- **Appointment Follow Up email:** text updated with the review link, but the email is still **switched off** (it has never been sent). Switching it on is the owner's decision.
- To do: swap in the official `g.page/r/…/review` link from Google Business Profile → "Ask for reviews" when available.
- Blog draft for review: `BLOG-DRAFT-ice-bath-guide.md` (not published).
- Email content inconsistencies found: "Salt & Mud amenities", "sauna up to 79°C", "cold plunge 3–8°C" vs the website. Waiting for the owner's answer.
- **Owner confirmed facts (20 Oct):** sauna reaches 79°C, Gymskin products, cold plunge 3.5–8°C.
  - Website: 75°C changed to 79°C on the homepage ("50-79C"), FAQ (two answers) and Infrared Saunas page.
  - All 4 confirmation emails: "Salt & Mud amenities" → "Gymskin shower products", "3-8°C" → "3.5-8°C".
  - Blog draft: "bring a water bottle" removed (free filtered water provided).
- **Water (20 Oct, owner):** free filtered water and cups provided; guests may bring a bottle to refill.
  - Infrared Saunas FAQ ("What do I need to bring?" and "What do I need to do after my sauna?") updated.
  - All 4 confirmation emails: "Refillable water bottle" → "A refillable water bottle (optional – we provide free filtered water and cups)".
  - Blog draft updated to match.
- **New article published (20 Oct):** https://beitsisu.com/how-cold-is-an-ice-bath/
  - Yoast title and description set; featured image is the barrel room photo (media 563, with alt text).
  - Listed on /blog/ and in the post sitemap. One H1, 9 H2s, internal links to the Cold Plunges page, the first article and Book Appointment.
  - Next: Search Console → URL inspection → Request indexing.

## Update: 20 October 2026: mobile speed fixes
Site Kit report (22 Sep–19 Oct): 0 visitors/impressions because Google Analytics was only connected on 20 Oct 09:28 UTC (tag GT-55VVX9WX / G-6DT2RM8CLF is on the site; Search Console property `https://beitsisu.com/`). Real issue: mobile LCP 8.7 s (Poor).

Backup first: **20 Oct 2026 13:39**. Changes:
- `styles/style.css`:
  - `@font-face` now loads `.woff2` first (35–42 KB each instead of 137–157 KB `.ttf`).
  - Fixed a missing comma in the Light font rule.
  - Added `font-display: swap`.
- `front-page.php`: hero image now uses `the_post_thumbnail()` with `srcset` (768/1024/1500 px), `fetchpriority="high"`, `sizes="100vw"`. Below-the-fold images (services carousel, content image, testimonial photos) get `loading="lazy" decoding="async"`.
- `page.php`: same lazy loading. Services carousel image now also has alt text.

Results:
- Mobile LCP under simulated slow 4G (3 runs each): **7.5 s → 5.5 s** median.
- Fonts downloaded: **287 KB → 75 KB**.
- Before/after screenshots (6 pages × phone/laptop): identical apart from sub-pixel font smoothing.

Next biggest gain (owner): link QUIC.cloud in LiteSpeed Cache → General → Request Domain Key, so images are served as WebP (homepage images ≈ 1.5 MB today).

## Update: 21 October 2026: Site Kit report + missed SEO titles
- **Site Kit (23 Sep–20 Oct):** 183 Google impressions, 2 clicks. Top searches: "cold plunge dubai" (14 impressions), "infrared sauna dubai" (14 impressions, 1 click), "beit sisu" (5 impressions, 1 click). 15 visitors since Analytics was connected on 20 Oct. Mobile LCP 7.4 s (was 8.7 s).
- **Fixed:** the three Services pages never had Yoast titles/descriptions (approved 15 Oct but missed). Now set:
  - Cold Plunges → "Private Cold Plunge & Ice Bath Dubai | Beit Sisu"
  - Infrared Saunas → "Private Infrared Sauna in Dubai Media City | Beit Sisu"
  - Red Light Therapy → "Red Light Therapy Dubai | Private Suites | Beit Sisu"
  - Each with a description; verified live.
