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
