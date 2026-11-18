# Homepage redesign: "Cedar & Stone" (mockup, not live)

- **Mockup (private canvas):** https://claude.ai/artifact/1qD4RptMe31DZLWDpJBeAJ. The source is in `homepage-mockup.dc.html`.
- **Direction (owner, 18 Nov 2026):** warm editorial "Cedar & Stone". Hot vs cold is the organising idea: ember #B3361F for heat, plunge #3E5B66 for cold, on stone #EEEDEB / paper #F6F4F0, with charcoal #191715 sections. No gradients and no boxes; structure comes from space, photos, type and hairline rules.
- **Fonts:** Instrument Serif (headlines; italic for Heat/Cold), Hanken Grotesk (body and buttons), DM Mono (labels, temperatures, prices; replaced IBM Plex Mono on 18 Nov at owner request for a smoother feel).
- **Layout:** phone-first single column (20 px margins, 8-px spacing scale). Laptop: 12-column grid to 1240 px, uneven 5/7 splits, photos to the screen edge.
- **Section order:**
  1. Sticky header with "Book a suite" (full-screen menu on phones)
  2. Hero
  3. Manifesto
  4. Inside the suite (01 cold / 02 infrared / 03 red light, 3 benefits each)
  5. How a session works
  6. Prices: sessions, Intro Offer, memberships
  7. Reviews (6 real quotes, one at a time)
  8. Ice bath rental
  9. Journal
  10. Visit (hours per day, valet, WhatsApp)
  11. Footer, with Instagram as a link
- **Motion:** fade-up 12 px on scroll, hero settles from 1.04×, header background appears on scroll, temperature line ember → plunge, arrows nudge 4 px, reviews cross-fade. All of it is off when the visitor's device asks for reduced motion; nothing runs on a timer.

## Decisions made in the mockup
- **H1** is the descriptive "Private contrast therapy suites in Dubai Media City", which is better for Google. "Heat. Cold. Total privacy." is the large display line over the photo.
- **Health claims:** "dopamine 250%", "800 calories in 40 minutes" and "heavy metal detox" were replaced with modest wording. The Heraclitus quote was removed.
- **Benefits:** 19 blocks cut to 3 per element.
- **Prices:** single-session prices are shown on the homepage for the first time.

## Placeholders to confirm
1. How members book after joining.
2. Instagram handle: `@beitsisu` is assumed.
3. The map: a placeholder in the mockup, a Google Map embed on the live site.
4. Opening hours: taken from the Contact page. Confirm they match the booking system.

## Next steps (after approval)
1. Build it as an update to the `beit-sisu` theme on a **staging copy**, never on the live site. Keep every page address, the Yoast settings, BookingPress and tracking.
2. Test booking, phone, iPad, speed and forms on staging.
3. Switch the live site over, then watch Search Console and Site Kit for a few weeks.
