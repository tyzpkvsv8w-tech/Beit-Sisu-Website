# Support ticket for BookingPress (draft)

**Subject:** Single-appointment Stripe Checkout bookings are treated as cart orders and never saved when the Cart Addon is active (Pro 6.2.1 / Cart 5.0 / Stripe 2.7)

---

Hello BookingPress team,

Since about 21 September 2026, website bookings paid with Stripe Checkout on our site were charged successfully but **no appointment or payment record was created** in BookingPress. Four customers were affected before we found the cause. We've worked around it by deactivating the Cart Addon, but we need a proper fix so we can keep the plugins updated safely.

### Environment
- BookingPress Appointment Booking 1.6.7
- BookingPress Pro 6.2.1
- BookingPress Cart Addon 5.0 (now deactivated)
- BookingPress Stripe Payment Gateway Addon 2.7, payment method: **Stripe Checkout**
- Stripe webhook endpoint: `https://beitsisu.com/?bookingpress-listener=bpa_pro_stripe_url` (events `charge.succeeded`, `checkout.session.completed`)
- WordPress 7.1.3, PHP 8.1.34, LiteSpeed
- Booking form: Vue 3 form. The cart has never been used (no orders with `is_cart = 1` this year).

### What happens
1. A customer books **one** appointment and pays with Stripe Checkout.
2. The Checkout Session metadata contains `custom = "<entry_id>|1"`, so the booking is flagged as a cart order. Before 21 Sep it was `"<entry_id>|0"`.
3. The webhook arrives. The Stripe debug log shows `Webhook Log array` with `"bp_is_cart":"1"` and then "Payment Successed - Webhook".
4. `bookingpress_StripeEventListener` calls `bookingpress_pro_payment_gateways->bookingpress_confirm_booking(..., is_cart = 1, ...)`. The Appointment debug log shows "Booking form confirm booking data" and "Booking form confirm booking data -- transaction id", then **nothing more**. There is no "appointment_booking_fields" entry, and no appointment or payment row is created.
5. Before 21 Sep the same flow had `bp_is_cart "0"`, logged "before insert appointment" and "before insert payment", and saved the booking normally.

Affected entries on our site: 3074, 3087, 3117, 3139 (29 Sep – 7 Oct 2026). The last booking that saved correctly before the problem was entry 3014 (20 Sep).

### Cause we found
In `bookingpress-appointment-booking/src/Vue3/Payments/Contexts/BookingFormContext.php` (around line 368):

```php
'group_mode' => has_filter( Hooks::FILTER_SUBMIT_PAYMENT_GROUP )
    ? PaymentReference::GROUP_SHARED
    : PaymentReference::GROUP_PER_BOOKING,
```

This checks whether **any** plugin has hooked `bookingpress_form_v3_submit_payment_group`, not whether this particular booking is a multi-item cart order. The Cart Addon always hooks that filter (`bookingpress-cart/src/Vue3/CartFeature.php`, `payment_group`). So whenever the Cart Addon is active, every booking-form payment is "shared". `StripeGateway::metadata_for()` then writes `custom = entry_id|1`, and the legacy Stripe listener sends the booking down the cart branch of `bookingpress_confirm_booking`. There's no cart order for a single entry, so nothing is saved.

This contradicts the Cart Addon's own documented behaviour: "A SINGLE-item cart falls back to the normal single path (`is_cart=0`, `order_id=0`)".

The same line probably affects other gateways too (e.g. PayPal) whenever the Cart Addon is active. We have only confirmed it with Stripe Checkout.

### Confirmation
With the Cart Addon **deactivated**, `has_filter()` is false. We made a live test booking (entry 3180, 12 Oct 2026). Its webhook showed `bp_is_cart "0"`, and the appointment and payment were saved normally.

### What we're asking for
1. A fix so `group_mode` / `is_shared_payment()` is only `shared` for real multi-item cart orders. The `payment_group` filter result for the entry could be used instead of `has_filter()`.
2. Confirmation of which version contains the fix, so we can reactivate the Cart Addon safely if we ever need it.
3. Please also check that the legacy cart branch of `bookingpress_confirm_booking` logs an error when it can't find an order, instead of exiting silently after a successful payment.

We can provide the Stripe and Appointment debug log exports for these entries if that helps.

Thank you,
Beit Sisu
