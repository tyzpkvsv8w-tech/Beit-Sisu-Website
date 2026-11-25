# Google Play: Data safety and content rating answers

These answers match what the app does today and the Privacy Policy (`/privacy`). If the app
changes (e.g. analytics, crash reporting or new providers), update both. Have your lawyer
check them along with the Privacy Policy.

## Data collection and security

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS only) |
| Do you provide a way for users to request that their data is deleted? | **Yes**: in the app (Account → Delete my account) and at `https://rekit.ae/delete-account` |

"Shared" means given to another company for its own use. Service providers that process data
on our behalf (Supabase, the SMS provider, Vercel, Resend, Stripe, push services) don't count
as sharing under Google's definitions, so **nothing is shared**.

## Data types collected

| Data type | Collected | Shared | Optional? | Why |
|---|---|---|---|---|
| **Personal info → Name** | Yes | No | Required | App functionality, account management |
| **Personal info → Email address** | Yes | No | Optional (email sign-up or alerts) | Account management, developer communications |
| **Personal info → Phone number** | Yes | No | Required for phone login | Account management, fraud prevention and security |
| **Personal info → User IDs** | Yes | No | Required | Account management |
| **Location → Approximate location** | Yes: the emirate or city the user chooses, and the area typed in ads | No | Required | App functionality |
| **Financial info → Purchase history** | Yes: ad bookings and promotions, for businesses only | No | Optional | App functionality, account management |
| **Messages → Other in-app messages** | Yes: chats between buyers and sellers | No | Optional | App functionality, fraud prevention and security |
| **Photos and videos → Photos** | Yes: photos added to ads | No | Optional | App functionality |
| **App activity → Other user-generated content** | Yes: ads, reports | No | Optional | App functionality |
| **App activity → Other actions** | Yes: saved items | No | Optional | App functionality |
| **Device or other IDs** | Yes: push notification address, if notifications are turned on | No | Optional | App functionality |

Not collected: precise location, contacts, calendar, health, files, audio, web browsing,
app performance or crash data, advertising ID. Card details are entered on Stripe's page, and
in-app payments are off by default.

Processing is ephemeral? **No** for all of the above.

## Content rating questionnaire (IARC)

| Topic | Answer |
|---|---|
| Category | Reference, news or educational? No. Choose **All other app types** (marketplace) |
| Violence, sexuality, language, controlled substances, gambling | **No** (prohibited by the Terms of Use) |
| Do users interact or exchange content? | **Yes**: users message each other and post ads |
| Does the app share the user's current location with other users? | **No** (only the emirate and area they type) |
| Can users buy digital goods? | **No** in the Android app (ad bookings are website-only by default) |
| Does the app contain ads? | **Yes** |

The expected rating is suitable for most ages. ReKit itself is for adults (18+, see Target audience).

## Target audience and content

- Target age: **18 and over**
- Appeals to children? **No**
- Ads: **Yes**, sponsored listings and banners from sports businesses, labelled "Ad" or "Sponsored"
- User-generated content: users can **report** ads (⚑ on each ad) and **block and report** people (Block in each chat). Reports go to the admin queue.
