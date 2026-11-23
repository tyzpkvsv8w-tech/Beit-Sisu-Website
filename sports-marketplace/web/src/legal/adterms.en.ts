import type { LegalDoc } from "./company";

// DRAFT: must be reviewed by a lawyer qualified in the UAE before launch. See LEGAL-NOTES.md.

export const adTermsEn: LegalDoc = {
  title: "Advertising Terms",
  intro: [
    "These terms apply when a business books advertising on ReKit, including banners, sport takeovers and promoted listings. They are an agreement between your business and {legalName} (\"ReKit\", \"we\"). Our Terms of Use also apply.",
  ],
  sections: [
    {
      id: "booking",
      h: "Booking and payment",
      blocks: [
        {
          list: [
            "Prices are shown in UAE dirhams before VAT. VAT is added at checkout where it applies.",
            "You pay in full when you book, by card through our payment provider, Stripe. We never see or store your card details.",
            "Your dates are held for 30 minutes while you pay. If you don't complete payment, they're released.",
            "A banner or sport takeover booking is confirmed once you've paid and we've approved the ad.",
          ],
        },
      ],
    },
    {
      id: "review",
      h: "Ad review",
      blocks: [
        "We check every banner and sport takeover against the ad rules below, usually within one working day and before the start date. If we can't approve your ad, we'll tell you why and refund you in full. You're welcome to book again with changes.",
      ],
    },
    {
      id: "rules",
      h: "Ad rules",
      blocks: [
        "Your ads, and the pages they link to, must:",
        {
          list: [
            "be about sport, fitness or outdoor activities;",
            "be accurate and not misleading, including prices, offers and claims about results;",
            "follow UAE law and UAE advertising standards;",
            "use names, logos, images and text that you have the right to use;",
            "link to a working, safe website that matches the ad.",
          ],
        },
        "We don't accept ads for gambling, alcohol, tobacco or vaping, adult content, weapons, unregistered supplements or medicines, or political or religious messages. We may also decline any ad that we reasonably believe would harm ReKit's users or reputation.",
      ],
    },
    {
      id: "responsibility",
      h: "Your responsibility",
      blocks: [
        "You're responsible for your ads, your offers, and the products and services you advertise. If a claim is made against us because of your ad or your website, you agree to cover our reasonable losses and costs, to the extent the law allows.",
      ],
    },
    {
      id: "delivery",
      h: "How ads are shown",
      blocks: [
        {
          list: [
            "Your ad runs from midnight UAE time on the start date to the end of the last booked day.",
            "Exclusive placements, such as the homepage banner or a sport takeover, show only your ad during your dates.",
            "We report the number of times your ad was shown and clicked. We don't guarantee a particular number of views or clicks unless we've agreed it in writing.",
            "If your ad doesn't run for more than 24 hours in total because of a fault on our side, we'll extend the campaign by the time lost or refund that part, whichever you prefer.",
            "Promoted listings show with a \"Sponsored\" label at the top of matching searches. The listing itself must keep to our Terms of Use.",
          ],
        },
      ],
    },
    {
      id: "cancel",
      h: "Changes, cancellations and refunds",
      blocks: [
        {
          list: [
            "To change your ad's text or link, email {email}. We'll review the change before it goes live.",
            "You can cancel a banner or sport takeover for a full refund up to 48 hours before the start date. After that, the booking can't be refunded.",
            "Listing promotions start straight away and can't be refunded once paid.",
            "If we remove your ad during a campaign because it breaks these terms, no refund is due for the remaining time.",
            "Refunds go back to the card you paid with and can take 5 to 10 working days to show.",
          ],
        },
      ],
    },
    {
      id: "invoices",
      h: "Invoices",
      blocks: ["We email a payment confirmation for each booking. For a VAT tax invoice showing our Tax Registration Number ({trn}), email {email} with your booking reference and your business details."],
    },
    {
      id: "liability",
      h: "Our responsibility to you",
      blocks: [
        "Nothing in these terms limits any liability that can't be limited under UAE law. Within that, our total liability for any booking is limited to the amount you paid for that booking, and we're not responsible for indirect losses such as lost profits or sales.",
      ],
    },
    {
      id: "general",
      h: "General",
      blocks: [
        "These terms are governed by the federal laws of the United Arab Emirates and the laws of the Emirate of {emirate}, and the courts of the Emirate of {emirate} have jurisdiction. They're available in English and Arabic. If the two versions differ, the {prevailing} version prevails. Questions: {email}.",
      ],
    },
  ],
};
