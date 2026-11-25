# App Store Connect: App Privacy answers

App Store Connect → your app → **App Privacy**. These match the Privacy Policy (`/privacy`);
update both if the app changes. Have your lawyer check them with the Privacy Policy.

**Do you or your third-party partners collect data from this app?** Yes

**Tracking:** ReKit does **not** track users (no advertising IDs, no data shared with data
brokers or for targeted ads across other apps). Ads are chosen by the page's sport and emirate.
So answer **No** to "used to track you" for every data type, and don't show the tracking
(ATT) prompt.

| Apple data type | Collected? | Linked to the user? | Purposes |
|---|---|---|---|
| Contact Info → Name | Yes | Yes | App Functionality |
| Contact Info → Email Address | Yes (optional) | Yes | App Functionality |
| Contact Info → Phone Number | Yes | Yes | App Functionality |
| User Content → Photos or Videos | Yes (photos in ads) | Yes | App Functionality |
| User Content → Emails or Text Messages | Yes (in-app chats) | Yes | App Functionality |
| User Content → Other User Content | Yes (ads, reports) | Yes | App Functionality |
| Location → Coarse Location | Yes (the emirate or city the user picks) | Yes | App Functionality |
| Purchases → Purchase History | Yes (ad bookings, businesses only, on the website) | Yes | App Functionality |
| Identifiers → User ID | Yes | Yes | App Functionality |

**Not collected:** precise location, contacts, health, financial info (card details are
entered on Stripe's website), browsing history, search history, usage data or analytics,
diagnostics and crash data, advertising identifiers, sensitive info.

Answer **Not collected** for "Device ID": the push notification token is used only to deliver
notifications and isn't an advertising identifier.
