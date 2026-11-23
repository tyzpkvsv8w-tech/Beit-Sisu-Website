import type { LegalDoc } from "./company";

// Placeholders in {braces} are filled from company.ts.
// DRAFT: must be reviewed by a lawyer qualified in the UAE before launch. See LEGAL-NOTES.md.

export const termsEn: LegalDoc = {
  title: "Terms of Use",
  intro: [
    "These terms are the agreement between you and {legalName} (\"ReKit\", \"we\", \"us\"), which runs the ReKit website and apps. By creating an account or using ReKit, you agree to these terms. Please read them together with our Privacy Policy, which explains how we handle your personal data.",
  ],
  sections: [
    {
      id: "about",
      h: "What ReKit is",
      blocks: [
        "ReKit is a free online classifieds marketplace where people in the United Arab Emirates buy and sell second-hand sports equipment.",
        "We are not a party to any sale. We don't own, inspect or sell the items listed, and we don't handle payment or delivery. Any sale is a contract directly between the buyer and the seller.",
        "ReKit is free for buyers and sellers. We earn money from businesses that advertise on ReKit. Paid placements are always labelled \"Ad\" or \"Sponsored\".",
      ],
    },
    {
      id: "accounts",
      h: "Your account",
      blocks: [
        {
          list: [
            "You must be at least 18 years old to create an account.",
            "You can sign up with a UAE mobile number, which we verify by sending a code by text message, or with an email address and password.",
            "Give accurate information and keep it up to date. Each person may have one personal account.",
            "Keep your login secure and never share your verification codes. You're responsible for activity on your account. If you think someone else has used it, tell us at {email}.",
            "If you sell as a business, you must say so in your profile or ads, and follow the consumer protection rules that apply to traders in the UAE.",
          ],
        },
      ],
    },
    {
      id: "listing",
      h: "Posting ads",
      blocks: [
        {
          list: [
            "Only list items that you own or have the right to sell, that are in the UAE, and that you can hand over.",
            "Describe items honestly, including their condition, size, any faults and anything missing. Use your own photos of the actual item.",
            "Show the real price in UAE dirhams.",
            "Don't post ads for items you aren't actually selling, ads that collect people's contact details, or ads that send people to other websites.",
            "Mark items as sold, or delete the ad, as soon as they're no longer available.",
            "We may limit the number of ads you can post, currently 20 per day, to keep ReKit useful for everyone.",
          ],
        },
      ],
    },
    {
      id: "prohibited",
      h: "Items you can't sell",
      blocks: [
        "You must not list:",
        {
          list: [
            "weapons and anything that needs a licence or permit to own, such as firearms, air guns, airsoft and paintball guns, crossbows, spearguns, and hunting or combat knives;",
            "ammunition, explosives, fireworks and marine distress flares;",
            "medicines, prescription drugs, steroids and other performance-enhancing substances, and supplements that aren't registered for sale in the UAE;",
            "counterfeit or replica goods, or stolen goods;",
            "recalled products, and safety equipment that is no longer safe, such as helmets that have been in a crash;",
            "live animals;",
            "event tickets or memberships whose terms don't allow resale;",
            "anything else that is illegal in the UAE, or that we reasonably consider offensive or harmful.",
          ],
        },
        "We may remove ads that break these rules without notice, and we may report illegal activity to the authorities.",
      ],
    },
    {
      id: "buying",
      h: "Buying and meeting safely",
      blocks: [
        {
          list: [
            "Inspect the item in person before you pay. ReKit doesn't check or guarantee any item, description or user.",
            "Meet in a busy public place. Never send a deposit, or pay by transfer, to someone you haven't met.",
            "ReKit will never ask for your password, verification code or bank details.",
            "If something goes wrong with a sale, please try to resolve it with the other person. You can report the ad or user to us and we will review it, but we can't refund money, cancel a sale or make anyone complete one.",
          ],
        },
      ],
    },
    {
      id: "conduct",
      h: "How you treat others",
      blocks: [
        {
          list: [
            "Use ReKit chat for genuine questions about listings. Don't send spam, unwanted marketing, threats or harassment, or abusive, discriminatory or sexual content.",
            "Don't share anyone else's personal information without their permission.",
            "Don't pretend to be someone else, or create accounts for other people without their permission.",
            "Don't try to get around our safety features, copy content from ReKit in bulk, use bots, or interfere with how ReKit works.",
          ],
        },
      ],
    },
    {
      id: "content",
      h: "Your content",
      blocks: [
        "You own the ads, photos and messages you post. To run and promote ReKit, you give us a worldwide, non-exclusive, royalty-free licence to host, copy, display, resize, adapt and share that content, for as long as it stays on ReKit. Copies may remain in backups for a limited time after you delete it.",
        "By posting content, you confirm that you have the right to post it, including the photos.",
        "We may make small changes, such as resizing photos or moving an ad to the right category, and we may remove content that breaks these terms.",
      ],
    },
    {
      id: "advertising",
      h: "Advertising",
      blocks: [
        "ReKit shows ads and sponsored listings from businesses, and they are always labelled. We aren't responsible for advertisers' products, services or websites. If you follow a link to another website, its own terms apply.",
        "Businesses that buy advertising agree separate advertising terms with us.",
      ],
    },
    {
      id: "moderation",
      h: "Reports, suspension and closing your account",
      blocks: [
        "Anyone can report an ad. We review reports. We may remove ads, limit features, or suspend or close accounts that break these terms or the law, or that put other users at risk. Where it's reasonable and safe to do so, we'll tell you why.",
        "You can delete your account at any time from your account page. This permanently deletes your ads, photos, saved items and conversations, as described in our Privacy Policy.",
      ],
    },
    {
      id: "service",
      h: "Our service",
      blocks: [
        "We work to keep ReKit running and safe, but we provide it \"as is\". We can't promise that it will always be available or free of errors, or that listings are accurate.",
        "We may change, add or remove features. If we decide to stop offering ReKit, we'll give reasonable notice where we can.",
      ],
    },
    {
      id: "liability",
      h: "Our responsibility to you",
      blocks: [
        "Nothing in these terms limits any liability that can't be limited under UAE law.",
        "Within that, we are not responsible for items bought or sold through ReKit, for what other users or advertisers do, or for indirect losses such as lost profits or lost opportunities.",
        "Because ReKit is free to use, our total liability to you for all claims connected with ReKit is limited to AED {liabilityCap}.",
        "If you break these terms or the law and someone makes a claim against us as a result, you agree to cover our reasonable losses and costs, to the extent the law allows.",
      ],
    },
    {
      id: "changes",
      h: "Changes to these terms",
      blocks: [
        "We may update these terms from time to time. The date at the top shows when they last changed. If a change is significant, we'll let you know on ReKit or by text message or email before it takes effect. If you keep using ReKit after that, you accept the new terms. If you don't agree, you can delete your account.",
      ],
    },
    {
      id: "law",
      h: "Law and disputes",
      blocks: [
        "These terms are governed by the federal laws of the United Arab Emirates and the laws of the Emirate of {emirate}.",
        "If you have a complaint, please contact us first at {email} so we can try to resolve it. If we can't, the courts of the Emirate of {emirate} will have jurisdiction.",
      ],
    },
    {
      id: "language",
      h: "Language",
      blocks: ["These terms are available in English and Arabic. If the two versions differ, the {prevailing} version prevails."],
    },
    {
      id: "contact",
      h: "Contact us",
      blocks: [
        { rows: [["Company", "{legalName}"], ["Address", "{address}"], ["Trade licence", "{licence}, issued by {authority}"], ["Email", "{email}"]] },
      ],
    },
  ],
};
