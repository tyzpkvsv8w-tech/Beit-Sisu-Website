# Bug: paid Intro Offer bookings never appear in BookingPress

Investigation notes, 10 Oct 2026. They're here so the next session can pick up from this point.

## Symptom
Customers pay for **Intro Offer (1 Person)** (BookingPress service_id 1, AED 350) through Stripe Checkout. Stripe shows the payment as succeeded, but no appointment or payment record is created in BookingPress. The owner reports that card bookings for other services work.

> **Update 10 Oct (2nd session):** this is **not** specific to Intro Offer. Since 29 Sep, *every* Stripe card booking from the website has been lost, whatever the service. See "Findings, session 2" below.

## Example: entry 3139 (7 Oct 2026, ~16:22–16:24 Dubai time)
- Booking chosen: service 1, room "Barrel" (staff_member_id 2), 2026-10-10 12:00–13:00, AED 350, BookingPress customer_id 398
- Stripe: checkout session `cs_live_a13HaBFJbr…`, payment intent `pi_3UNtrO2LkfZFgBoG1z2XkJ9O`; events `charge.succeeded` + `checkout.session.completed` at 16:24:34
- Webhook endpoint: `https://beitsisu.com/?bookingpress-listener=bpa_pro_stripe_url`, Active, API version `2026-08-26.dahlia`, 0 failed deliveries this week
- success_url: `/thank-you/?appointment_id=MzEzOQ==` (base64 "3139"); cancel_url `/cancel-payment/?is_cancel=1`
- Metadata: `bookingpress_entry_id=3139`, `custom="3139|1"` (the trailing 1 = cart booking)

## BookingPress debug log (Settings → Debug Log), rows 4289–4300
4289 submit appointment form front (all fields correct) → 4290 Vue3 stripe checkout session created → 4291/4296 Stripe Webhook data → 4292 webhook requested data (charge.succeeded) → 4293 Event id → 4294 webhook generated invoice data → 4295 Webhook Log array {entry_id 3139, bp_is_cart 1, charge.succeeded} → 4297 webhook requested data (checkout.session.completed) → 4298 Event id → **4299 "Payment Successed - Webhook" Entry id 3139** → 4300 webhook generated invoice data → **nothing else; no appointment created.**

## Ruled out
- Page caching: no cache plugin; booking pages send `no-store`
- Webhook missing, wrong URL, or failing: it's active and delivered
- Returning-customer "once only" limit: Stripe shows her as a new customer, and she had no earlier appointments

## Main suspects
1. The step that turns the paid entry into an appointment, run by the **bookingpress-cart** add-on (because bp_is_cart=1), crashes with a PHP or database error that isn't recorded in the BookingPress log. **Next step: read the PHP error_log around 2026-10-07 12:24 UTC.**
2. BookingPress parts out of sync: WP admin shows 4 plugin updates pending. Installed: bookingpress-appointment-booking, -pro, -cart, -stripe.
3. Something specific to service 1's settings (compare with service 2, "1 Person 60 min").

## Next steps once access is available
- Read the PHP error log and the plugin versions, and look at the entry 3139 row in the entries table
- Compare the debug log of a booking that worked with entry 3139
- Reproduce in Stripe test mode (needs js.stripe.com, checkout.stripe.com, api.stripe.com and m.stripe.network allowed)
- Before any change: confirm a fresh UpdraftPlus backup exists and get the owner's OK

## Findings, session 2 (10 Oct 2026, read-only WP admin via headless Chromium)

Sources: BookingPress → Settings → Debug Log → *Download log* for "Stripe method" (last month) and "Appointment Logs" (last week); BookingPress Payments list (1,070 rows for 2026, fetched through the page's own list call); Plugins page; Site Health → Info. Nothing was changed. Log times below are site time (Dubai, UTC+4).

### 1. The break started between 20 Sep and 29 Sep, and it hits all services
Stripe debug log, every website card payment in the last month:

| Entry | Paid (Dubai) | Service | AED | `bp_is_cart` | Appointment saved? |
|---|---|---|---|---|---|
| 2977 | 17 Sep 13:32 | 5 – Cold Plunge | 85 | 0 | yes ("before insert appointment" → "before insert payment") |
| 3014 | 20 Sep 23:19 | 7 – 2 Person Contrast | 320 | 0 | yes (last successful card booking) |
| **3074** | 29 Sep 13:37 | 1 – Intro Offer | 350 | **1** | **no** |
| **3087** | 30 Sep 19:13 | 5 – Cold Plunge | 85 | **1** | **no** |
| **3117** | 5 Oct 14:51 | 1 – Intro Offer (+towel) | 355 | **1** | **no** |
| **3139** | 7 Oct 16:24 | 1 – Intro Offer | 350 | **1** | **no** |

- The Payments list agrees: the last "Credit Card/Apple Pay" payment is 20 Sep 23:19 (entry 3014). Intro Offer card payments worked earlier too (18 Aug, 24 Aug, both `is_cart 0`). Every card payment that ever worked has `is_cart 0` / `order_id 0`.
- From 29 Sep on, every single-appointment website booking is sent to Stripe with `custom="<entry>|1"`, so the webhook treats it as a cart order. The front-end submission itself has no cart fields, the same as on 17/20 Sep.
- Another sign the code changed between those dates: the 17/20 Sep flow logged "Vue3 stripe created customer" before the checkout session. From 29 Sep that step is gone.
- **The owner's "other services work" is not true for this period.** Entry 3087 (Cold Plunge) was lost the same way. Card bookings for services 3 and 7 since 29 Sep were all abandoned at checkout, so none succeeded.

### 2. Exactly where it stops (Appointment debug log)
`bookingpress_stripe_payment->bookingpress_StripeEventListener` → `bookingpress_pro_payment_gateways->bookingpress_confirm_booking`:
- Non-cart confirmation (e.g. entry 3140, 7 Oct 16:26): "Booking form confirm booking data" → "… transaction id" → "… appointment_booking_fields" → "… appointment_booking_fields before insert" → appointment created.
- Entry 3139 (`is_cart_order 1`, 7 Oct 16:24:35): "Booking form confirm booking data" → "… transaction id" → **nothing more**. Entry 3117 is identical.
- In the last week, 73 "confirm booking data" rows vs 71 "appointment_booking_fields" rows. The two missing are exactly 3117 and 3139.
- So the paid entry goes into the **cart branch** of `bookingpress_confirm_booking` and leaves it without writing anything. That branch (Cart add-on / Pro cart handling) either finds no cart order for a single-appointment entry or dies quietly. Then the Stripe add-on still logs "Payment Successed - Webhook".
- Correction to session 1: "Payment Successed - Webhook" (4299) belongs to the `charge.succeeded` thread (ref 4291), not `checkout.session.completed`. Row 4301 (Webhook Log array for `checkout.session.completed`) also exists after 4300.
- Compare entry 3122 (5 Oct, service 3, "Pay Post Service"): it goes through the new `BookingPressVue3ServicesSubmissionService->finalize_booking → write_one_booking_from_entry` and is saved. Only the Stripe webhook path, which goes through the legacy `bookingpress_confirm_booking` with the cart flag, fails.

### 3. Plugins / environment
- Installed (all latest, **all on auto-update**): BookingPress 1.6.7, Pro 6.2.1, Cart 5.0, Stripe 2.7. WooCommerce gateway add-on 2.2 is inactive (that's where the "WooCommerce Addon 2.6" nag comes from).
- **Suspect 2 is ruled out as worded:** none of the 4 pending updates is BookingPress (they are ACF Pro, AIO WP Migration GDrive, Gravity Forms, Loginizer).
- Strongest lead instead: an auto-update between 21 and 29 Sep. Pro 6.1's changelog: *"Strengthened Vue3 payment confirmation … booking ownership verification before finalizing appointments"*, *"Improved Cart Add-on booking calculations …"*. Cart 4.8–5.0 say only "minor bug fixes". Cart 2.7 had said a single appointment should *not* count as a cart appointment, and that is what now goes wrong. WP admin doesn't record exact install dates.
- Suspect 3 (service 1 settings) is ruled out: service 5 fails too, and service 1 worked in August.
- PHP error log: **still not read.** `WP_DEBUG` and `WP_DEBUG_LOG` are both false, so there is no `wp-content/debug.log`, and WP admin has no read-only way to see the server `error_log`. This needs cPanel / hosting access (LiteSpeed, PHP 8.1.34, path `/home/beithbmb/public_html`).
- Caching: the LiteSpeed Cache plugin is installed but **inactive**; `WP_CACHE` is true (WP-Optimize). Not related to this bug.

### 4. Other Stripe payments with no BookingPress entry (not bugs, but reconcile)
- 30 Sep 18:16, AED 350, Stripe **Payment Link**
- 4 Oct 20:27, AED 350, Stripe Payment Link
  These look like the owner charging Intro Offers by hand. Check whether they cover any of the lost bookings above before refunding or rebooking.
- 15 Sep: AED 1,899 "Subscription update" on the *old* Stripe account. Not a booking. The site switched Stripe accounts between 24 Aug and 17 Sep. Bookings still worked after the switch, so this is not the cause.

### Recommended next steps (all need the owner's OK and a fresh backup first)
1. **Stop the losses now.** Pick one: (a) temporarily turn off Stripe on the booking form and use "Pay Post Service" plus payment links, or (b) if the cart isn't actually used, deactivate the Cart add-on so single bookings take the non-cart path. Option (b) must be tested in Stripe test mode first.
2. Open a ticket with Repute (BookingPress) support. Include: versions above, the table in §1, the log rows in §2 (Stripe log 4289–4301, Appointment log 131183–131187), and the statement "single-appointment Stripe Checkout bookings are flagged `custom=<id>|1` and `bookingpress_confirm_booking` exits after the transaction-id log since ~Pro 6.1/Cart 4.9+". Ask for a fix or a version to roll back to.
3. Ask the host for the PHP `error_log` for 29 Sep 09:37 UTC, 30 Sep 15:13 UTC, 5 Oct 10:51 UTC and 7 Oct 12:24 UTC, to confirm whether the cart branch fatals or returns quietly.
4. Consider turning off auto-updates for the four BookingPress plugins once fixed. Updates should go through a staging test.

## Root cause (session 3, 12 Oct 2026)

Found by reading the plugin source in WP admin's Plugin File Editor (view only, nothing saved).

1. On 2026-09-21 the Stripe add-on's Vue 3 code was rewritten onto a new "payment layer" (`bookingpress-stripe/src/Vue3/StripeFeature.php` header: "All removed 2026-09-21"). This matches the 21–29 Sep window when bookings started failing.
2. The new code builds the Stripe metadata as `custom = entry_id|(is_shared_payment ? 1 : 0)` (`StripeGateway::metadata_for`).
3. `is_shared_payment()` comes from `bookingpress-appointment-booking/src/Vue3/Payments/Contexts/BookingFormContext.php:368`:
   `'group_mode' => has_filter( Hooks::FILTER_SUBMIT_PAYMENT_GROUP ) ? GROUP_SHARED : GROUP_PER_BOOKING`.
   That checks whether *any* plugin has hooked the filter, not whether this booking is a multi-item cart.
4. The Cart add-on (`bookingpress-cart/src/Vue3/CartFeature.php:119`) always hooks `bookingpress_form_v3_submit_payment_group`. Its own docs say a single item should stay `is_cart=0`. So while Cart is active, **every** booking-form payment is marked shared and sent to Stripe as `entry|1`.
5. Stripe Checkout is still settled by the legacy listener (`?bookingpress-listener=bpa_pro_stripe_url` → `bookingpress_StripeEventListener`). It reads `|1` as a cart order and calls `bookingpress_confirm_booking(..., is_cart=1)`. There is no cart order for a single entry, so it writes nothing.
6. Nothing else hooks that filter. I scanned all 151 Pro `src/` files, all 538 core `src/` files and the Stripe add-on; only Cart does.

**Cart is not used:** 0 of 1,070 BookingPress payments in 2026 are cart orders (`is_cart` = 0 and `order_id` = 0 on every row).

### Fix
**Deactivate the "BookingPress - Cart Addon" plugin.** Then `has_filter` is false, payments are `per_booking`, metadata is `entry|0`, and the webhook takes the non-cart confirmation path. That path saves bookings every day (e.g. entry 3140) and saved card bookings up to 20 Sep. The only visible change is that the booking form loses its unused "cart / add another service" step. It is fully reversible: reactivate the plugin.

Status:
- Fresh UpdraftPlus backup (database + files, also uploaded to Google Drive): **12 Oct 2026 09:58, done.**
- No new card payments since 10 Oct (Stripe log checked 12 Oct), so no further bookings were lost after entry 3139.
- **Cart add-on deactivated by the owner on 12 Oct 2026** (confirmed inactive on the Plugins page).
- **Verified fixed, 12 Oct 2026.** Live test card booking, Cold Plunge AED 85, entry 3180 (Dubai time 10:30–10:31). Stripe log 4314–4328: both webhook events have `bp_is_cart "0"`, followed by "before insert appointment", "before insert payment", "Payment Successed". The Appointment log for 3180 goes on past "transaction id" to "appointment_booking_fields" and "… before insert", the step where 3117 and 3139 had stopped. The owner then removed the test booking and refunded it. The refund doesn't appear in the BookingPress Stripe log, so it was done in the Stripe Dashboard; confirm it shows as *Refunded* there.
- Report the `has_filter` bug to Repute support (point 3 above), so the Cart add-on can be reactivated safely later if it's ever wanted.

## Customer follow-up (owner)
- **Done (12 Oct 2026):** the owner reports all affected customers have been contacted and dealt with.
- Support ticket draft for BookingPress: see `BOOKINGPRESS-SUPPORT-TICKET.md`.

- **Four paid website bookings are missing (not one).** Each needs contact and a rebooking or refund: entry 3074 (Intro Offer, paid 29 Sep, was for 30 Sep 18:30), 3087 (Cold Plunge, paid 30 Sep, was for 1 Oct 12:00; the customer used a dummy phone number, so this may have been a test payment), 3117 (Intro Offer + towel, paid 5 Oct, was for 8 Oct 07:00), 3139 (below). Look up the customer and Stripe payment for each entry in BookingPress / Stripe (Stripe metadata `bookingpress_entry_id`). None of these slots has an appointment in BookingPress.
- Entry 3139's customer paid but had no booking (session was 10 Oct 12:00). Contact her and rebook all 3 sessions.
- Check every AED 350 "Intro Offer" Stripe payment against BookingPress appointments.

## Follow-up 14 Oct 2026: Intro Offer booking reported as "cancelled" (read-only check)
- The only website card booking since the fix is entry 3182 / appointment 3064: Intro Offer, room Tub, 14 Oct 08:30, AED 350. It was booked 12 Oct 13:46 and paid 13:48 (Dubai). The Stripe webhook had `bp_is_cart "0"` and the appointment and payment were saved with status 1 (Approved). The confirmation email to the customer was sent 12 Oct 13:48.
- On 14 Oct the Appointments list, the Calendar (month view and popover) and the Payments data all show it as **Approved**, paid by card.
- No "Appointment Canceled" email was sent for it, to the customer or to the Tub room. The cancellation emails on 12 Oct (12:28 Barrel, 17:24 Tub) were for other services (1 Person / 2 Person Contrast Therapy). The debug logs show no other change to the appointment.
- Conclusion: in BookingPress this appointment was never cancelled, or if someone changed it, it was set back without any notification. The "cancelled" status was most likely seen somewhere else (e.g. Fresha, another booking, or a different screen). Waiting for the owner to say where they saw it.
