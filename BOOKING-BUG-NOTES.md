# Bug: paid Intro Offer bookings never appear in BookingPress

Investigation notes, 10 Oct 2026. They're here so the next session can pick up from this point.

## Symptom
Customers pay for **Intro Offer (1 Person)** (BookingPress service_id 1, AED 350) through Stripe Checkout. Stripe shows the payment as succeeded, but no appointment or payment record is created in BookingPress. The owner reports that card bookings for other services work.

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

## Customer follow-up (owner)
- Entry 3139's customer paid but had no booking (session was 10 Oct 12:00). Contact her and rebook all 3 sessions.
- Check every AED 350 "Intro Offer" Stripe payment against BookingPress appointments.
