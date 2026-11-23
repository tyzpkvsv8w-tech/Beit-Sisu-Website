import type { LegalDoc } from "./company";

// Written to match what the app actually does (see LEGAL-NOTES.md for the mapping).
// If you add analytics, ad tracking, emails or new providers, update this policy first.
// DRAFT: must be reviewed by a lawyer qualified in the UAE before launch.

export const privacyEn: LegalDoc = {
  title: "Privacy Policy",
  intro: [
    "This policy explains what personal data ReKit collects, why we collect it, who we share it with, and the choices you have.",
    "{legalName} (\"ReKit\", \"we\", \"us\") is responsible for your personal data. We process it in line with UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data, and other laws that apply to us.",
  ],
  sections: [
    {
      id: "summary",
      h: "The short version",
      blocks: [
        {
          list: [
            "We collect only what we need to run the marketplace and keep it safe.",
            "We don't sell your personal data.",
            "We don't use advertising trackers or analytics cookies. The ads you see depend on the page you're on, such as the sport or emirate, not on a profile of you.",
            "Other users can't see your phone number unless you choose to show it.",
            "You can delete your account, and the data that goes with it, at any time.",
          ],
        },
      ],
    },
    {
      id: "collect",
      h: "What we collect",
      blocks: [
        "Information you give us:",
        {
          list: [
            "Account details: your mobile number (verified with a text-message code), your name, and your emirate or city. If you sign up with email, we also collect your email address and password. You can also add an email address for alerts, which we only use once you confirm it from a link we send you. We store passwords only in a scrambled (hashed) form, so we can't see them. We also store your language choice.",
            "Your ads: title, description, price, condition, brand, size, area and photos. Ads are public. Photos are resized in your browser before upload, which normally removes hidden location data. Even so, check that your photos don't show anything personal.",
            "Messages you send and receive in ReKit chat.",
            "Items you save, and ads you report, including the reason you give.",
            "If you contact our ad team: your name, business name, email address and message.",
            "If you buy advertising: your ad, the dates and placement you booked, and payment records (amount, VAT, date and status). Card payments are handled by Stripe, so we never receive your card details.",
          ],
        },
        "Information collected automatically:",
        {
          list: [
            "Cookies that keep you logged in and remember your language. See \"Cookies\" below.",
            "Technical data such as your IP address, browser type, the pages you request and when. Our hosting provider records this in server logs. We use it for security, for example to limit repeated login attempts and code requests.",
            "How many times each ad is viewed, and how many times each advertiser's ad is shown and clicked. Advertising counts are totals and aren't linked to you.",
          ],
        },
      ],
    },
    {
      id: "use",
      h: "How we use it, and why",
      blocks: [
        {
          rows: [
            ["Create your account, log you in with a text-message code, and keep your account secure", "Needed to provide the service you signed up for"],
            ["Publish your ads, run chat, and keep your saved items", "Needed to provide the service you signed up for"],
            ["Prevent fraud, spam and abuse, review reports, and enforce our Terms of Use", "Needed to keep ReKit safe for users, and to meet our legal obligations"],
            ["Answer your questions and advertising enquiries", "Needed to respond to your request"],
            ["Email you when someone messages you, if you've confirmed an email address and kept alerts on", "Part of the service you signed up for. Turn these emails off at any time on your account page or with the link in each email."],
            ["Send password-reset and email confirmation links", "Needed to provide the service you asked for"],
            ["Send service messages, such as login codes or notice of important changes", "Needed to provide the service. We won't send you marketing without your consent."],
            ["Show advertisers overall figures, such as the number of live ads or members", "Only totals, never your personal data"],
            ["Respond to lawful requests from UAE authorities", "Needed to comply with the law"],
          ],
        },
      ],
    },
    {
      id: "public",
      h: "What other users can see",
      blocks: [
        {
          list: [
            "Your ads, including photos, area and emirate. Anyone can see these, including people who aren't logged in.",
            "Your display name, the month you joined, and how many active ads you have.",
            "Your mobile number, only if you turn on \"Show my number on my ads\". Even then, only logged-in users can see it.",
            "Your email address is never shown to other users.",
            "Messages are visible only to you and the person you're chatting with. We may look at messages when investigating a report, fraud or abuse.",
          ],
        },
      ],
    },
    {
      id: "sharing",
      h: "Who we share it with",
      blocks: [
        "We use service providers that process data on our instructions and only for the purposes in this policy:",
        {
          rows: [
            ["Supabase", "Database, photo storage, and checking login codes. Supabase keeps its own record of the phone numbers that codes are sent to."],
            ["{smsProvider}", "Sends login codes to your phone by text message"],
            ["Vercel", "Hosts the website"],
            ["Resend", "Sends our emails, such as password resets and new-message alerts"],
            ["Stripe", "Takes card payments for advertising and listing promotions"],
            ["Google Fonts", "Supplies the site's fonts, so Google receives your IP address when pages load"],
          ],
        },
        "We may also share data with authorities when the law requires it, with our professional advisers, or with a buyer if our business is sold. A buyer would have to protect your data in the same way. We never sell personal data or give it to advertisers.",
      ],
    },
    {
      id: "transfers",
      h: "Data stored outside the UAE",
      blocks: [
        "Some of our providers store or process data outside the UAE. In particular, our database and photos are stored in {dataRegion}. When data leaves the UAE, we only transfer it as UAE data protection law allows, for example to countries with adequate protection, or with contractual safeguards in place.",
      ],
    },
    {
      id: "retention",
      h: "How long we keep it",
      blocks: [
        {
          rows: [
            ["Account details", "Until you delete your account"],
            ["Ads and photos", "Until you delete the ad or your account. Photos are removed from storage when the ad is deleted."],
            ["Conversations", "Until you or the other person deletes their account. The whole conversation is then deleted for both of you."],
            ["Login codes", "Deleted once used. Unused codes expire after 10 minutes and are cleared regularly."],
            ["Login sessions", "Up to 30 days, or until you log out"],
            ["Password-reset and confirmation links", "Work for 1 hour (reset) or 24 hours (confirmation). Records of them are deleted with your account."],
            ["Reports you make", "Until the ad is deleted, or up to 2 years"],
            ["Advertising enquiries", "Up to 2 years"],
            ["Payment records", "As long as UAE tax law requires (at least 5 years), even if you delete your account"],
            ["Server logs and backups", "A limited period set by our providers"],
          ],
        },
        "We keep data for longer only where the law requires it.",
      ],
    },
    {
      id: "rights",
      h: "Your rights",
      blocks: [
        "Under UAE data protection law, you can ask us to:",
        {
          list: [
            "tell you what personal data we hold about you, and give you a copy;",
            "correct data that's wrong;",
            "delete your data;",
            "stop or limit how we use your data, or object to a use;",
            "send your data to you or another provider in a commonly used format;",
            "stop using data that we process because you agreed to it (you can withdraw consent at any time).",
          ],
        },
        "You can change your name and city on your account page, delete ads at any time, and delete your whole account from your account page. For anything else, email {privacyEmail}. We reply within 30 days, and we may need to confirm it's really you first.",
        "If you're not happy with how we've handled your data, you can complain to the UAE Data Office.",
      ],
    },
    {
      id: "cookies",
      h: "Cookies",
      blocks: [
        "We use only the cookies ReKit needs to work:",
        {
          rows: [
            ["rk_session", "Keeps you logged in. Lasts 30 days, or until you log out."],
            ["rk_otp", "Remembers a login that's in progress while you enter your code. Lasts 15 minutes."],
            ["rk_lang", "Remembers whether you chose English or Arabic. Lasts 1 year."],
          ],
        },
        "We don't use analytics or advertising cookies. If we ever want to add cookies that aren't needed for ReKit to work, we'll ask you first.",
      ],
    },
    {
      id: "security",
      h: "Security",
      blocks: [
        "We protect your data with encrypted connections (HTTPS), hashed passwords and login tokens, login codes that expire after 10 minutes and allow only a few tries, and limits on who can access our systems. No system is completely secure. If you notice a problem, please tell us at {email}. If a data breach affects you, we'll tell you and the authorities as the law requires.",
      ],
    },
    {
      id: "children",
      h: "Children",
      blocks: ["ReKit is for people aged 18 and over. We don't knowingly collect personal data from children. If you think a child has created an account, please contact us and we'll delete it."],
    },
    {
      id: "changes",
      h: "Changes to this policy",
      blocks: ["We'll update this policy if what we do with your data changes. The date at the top shows the latest version. If a change is significant, we'll let you know on ReKit or by text message or email before it takes effect."],
    },
    {
      id: "contact",
      h: "Contact us",
      blocks: [
        { rows: [["Company", "{legalName}"], ["Address", "{address}"], ["Privacy questions", "{privacyEmail}"], ["Everything else", "{email}"]] },
      ],
    },
  ],
};
