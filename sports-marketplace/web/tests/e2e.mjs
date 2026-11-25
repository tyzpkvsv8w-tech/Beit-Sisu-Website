// End-to-end check of the main journeys. Start the app first (npm run build && npm start),
// with a freshly seeded database (npm run db:reset). Usage: node tests/e2e.mjs [baseUrl] [screenshotDir]
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.argv[2] || "http://localhost:3000";
const SHOTS = process.argv[3];
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
let passed = 0, failed = 0;
const check = (name, ok, extra = "") => { ok ? passed++ : failed++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`); };
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png` });

const browser = await chromium.launch();
const errors = [];
const newPage = async (opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  return page;
};

const FIXED_CODE = process.env.E2E_SMS_CODE; // set when testing against the Supabase mock
const randomMobile = () => "05" + String(Math.floor(10_000_000 + Math.random() * 89_999_999));
async function phoneCode(page) {
  if (FIXED_CODE) return FIXED_CODE;
  const text = await page.getByTestId("dev-code").textContent();
  return text.match(/\d{6}/)[0];
}
/** Number -> code. Leaves the page on the next step (profile form, or redirected). */
async function phoneLogin(page, mobile) {
  await page.fill("#phone", mobile);
  await page.click("form.form-card button[type=submit]");
  await page.locator("#code").waitFor();
  await page.fill("#code", await phoneCode(page));
  await page.click("form.form-card button[type=submit]");
}

// Emails land in the outbox folder when EMAIL_DRIVER=dev.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
const OUTBOX = path.resolve(process.env.OUTBOX_DIR || ".outbox");
function emailsTo(to) {
  try {
    return readdirSync(OUTBOX).sort().map((f) => JSON.parse(readFileSync(path.join(OUTBOX, f), "utf8"))).filter((e) => e.to === to);
  } catch { return []; }
}
async function waitForEmail(to, count = 1) {
  for (let i = 0; i < 40; i++) {
    const list = emailsTo(to);
    if (list.length >= count) return list[count - 1];
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}
const linkIn = (mail, p) => mail?.text.match(new RegExp(`https?://\\S+${p}\\S*`))?.[0];

// A real JPEG to upload, made by screenshotting a coloured box.
const img = await newPage({ viewport: { width: 400, height: 300 } });
await img.setContent('<div style="width:400px;height:300px;background:linear-gradient(135deg,#1747c9,#d9f24a)"></div>');
const photo = await img.screenshot({ type: "jpeg" });

// 1. Guest browsing
const guest = await newPage();
await guest.goto(BASE);
check("home shows listings", (await guest.locator(".card").count()) >= 8);
check("home shows sponsored shop listings", (await guest.locator(".chip-sponsor").count()) >= 1);
check("home banner ad is served", await guest.locator(".ad-leader .brand").first().isVisible());
await shot(guest, "01-home");
await guest.goto(`${BASE}/browse?sport=cycling`);
const cyclingTitles = await guest.locator(".card .ti").allTextContents();
check("sport filter works", cyclingTitles.length >= 2 && (await guest.locator("h1").textContent()) === "Cycling");
await guest.goto(`${BASE}/browse?q=racket`);
check("keyword search finds rackets", (await guest.locator(".card .ti").allTextContents()).some((t) => /racket/i.test(t)));
await guest.goto(`${BASE}/browse?min=1000&sort=low`);
const prices = (await guest.locator(".card:not(.sponsored) .pr").allTextContents()).map((t) => +t.replace(/[^\d]/g, "").replace(/^(\d+?)$/, "$1"));
check("price filter and sort", prices.length > 0 && prices.every((p, i) => p >= 1000 && (i === 0 || p >= prices[i - 1])), prices.join(","));
await guest.locator(".card:not(.sponsored)").first().click();
await guest.waitForURL(/\/listing\//);
check("guest sees 'log in to chat'", await guest.getByText("Log in to chat with the seller").isVisible());
await guest.goto(`${BASE}/sell`);
check("posting requires login", guest.url().includes("/login?next=%2Fsell"));

// 2. Seller signs up with a mobile number and posts an ad with a photo
const seller = await newPage();
const sellerMobile = randomMobile();
await seller.goto(`${BASE}/login?next=/sell`);
await seller.fill("#phone", "12345");
await seller.click("form.form-card button[type=submit]");
check("invalid mobile rejected", await seller.getByText("Enter a UAE mobile number").waitFor({ timeout: 5000 }).then(() => true, () => false));
await seller.fill("#phone", sellerMobile);
await seller.click("form.form-card button[type=submit]");
await seller.locator("#code").waitFor();
const realCode = await phoneCode(seller);
check("code screen shows the number", await seller.getByText(sellerMobile.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3")).first().isVisible());
await seller.fill("#code", realCode === "000000" ? "111111" : "000000");
await seller.click("form.form-card button[type=submit]");
check("wrong code rejected", await seller.getByText("That code isn't right").waitFor({ timeout: 5000 }).then(() => true, () => false));
await seller.fill("#code", realCode);
await seller.click("form.form-card button[type=submit]");
await seller.locator("#name").waitFor();
check("new number asks for name and city", true);
await seller.fill("#name", "Test Seller");
await seller.click("form.form-card button[type=submit]");
check("city must be chosen", await seller.getByText("Choose your emirate or city").waitFor({ timeout: 5000 }).then(() => true, () => false));
await seller.selectOption("#city", "Dubai");
await seller.click("form.form-card button[type=submit]");
check("terms must be accepted", await seller.getByText("accept the terms").waitFor({ timeout: 5000 }).then(() => true, () => false));
await seller.selectOption("#city", "Dubai");
await seller.check("#terms");
await seller.click("form.form-card button[type=submit]");
await seller.waitForURL(BASE + "/sell");
check("phone signup logs in and returns to /sell", (await seller.locator(".user-menu").textContent()).includes("Test"));
await seller.fill("#title", "Babolat padel racket, used 3 months");
await seller.selectOption("#sport", "padel-tennis");
await seller.selectOption("#condition", "Like new");
await seller.fill("#brand", "Babolat Technical Viper");
await seller.fill("#description", "Great racket, a few small marks on the frame. Comes with cover.");
await seller.fill("#price", "700");
await seller.selectOption("#city", "Dubai");
await seller.fill("#area", "Dubai Marina");
await seller.setInputFiles("#picker", { name: "racket.jpg", mimeType: "image/jpeg", buffer: photo });
await seller.waitForSelector(".photos .slot img");
await shot(seller, "02-sell-form");
await seller.click("form.form-card button[type=submit]");
await seller.waitForURL(/\/listing\/.+\?posted=1/, { timeout: 20000 });
const listingUrl = seller.url().split("?")[0];
const listingId = listingUrl.split("/").pop();
check("ad published", await seller.getByText("Your ad is live").isVisible());
const imgSrc = await seller.locator(".gallery .main img").getAttribute("src");
const imgRes = await seller.request.get(new URL(imgSrc, BASE).toString());
check("photo stored and served", imgRes.ok() && imgRes.headers()["content-type"] === "image/jpeg", imgSrc);
await shot(seller, "03-listing-own");

// Edit
await seller.click("text=Edit ad");
await seller.fill("#price", "650");
await seller.click("form.form-card button[type=submit]");
await seller.waitForURL(/updated=1/);
check("edit saves new price", (await seller.locator(".d-price").textContent()).includes("650"));

// 3. A second user (seeded demo buyer) messages the seller
const buyer = await newPage();
await buyer.goto(`${BASE}/login/email?next=/listing/${listingId}`);
await buyer.fill("#email", "priya@rekit.test");
await buyer.fill("#password", "wrong-password");
await buyer.click("form.form-card button[type=submit]");
check("wrong password rejected", await buyer.getByText("don't match").waitFor({ timeout: 5000 }).then(() => true, () => false));
await buyer.fill("#password", "rekit-demo-123");
await buyer.click("form.form-card button[type=submit]");
await buyer.waitForURL(new RegExp(`/listing/${listingId}`));
await buyer.getByRole("button", { name: "♡ Save" }).click();
await buyer.getByRole("button", { name: "♥ Saved" }).waitFor();
await buyer.goto(`${BASE}/saved`);
check("saved item appears in Saved", await buyer.getByText("Babolat padel racket").first().isVisible());
await buyer.goto(listingUrl);
await buyer.click("text=Chat with seller");
await buyer.waitForURL(/\/messages\/.+/);
const convoUrl = buyer.url();
await buyer.getByRole("button", { name: /still available/ }).click();
await buyer.locator(".msg.me").first().waitFor();
check("buyer message sent", (await buyer.locator(".msg.me").count()) === 1);

// Seller sees an unread badge and replies; buyer receives it via polling
await seller.goto(BASE);
check("seller sees unread badge", (await seller.locator(".nav .badge").textContent()) === "1");
await seller.goto(`${BASE}/messages`);
await seller.locator(".inbox a").first().click();
await seller.fill("#chatIn", "Yes! Can meet at the Marina tonight.");
await seller.click(".compose button");
await seller.locator(".msg.me").first().waitFor();
await buyer.locator(".msg.them").first().waitFor({ timeout: 10000 });
check("buyer receives reply live", (await buyer.locator(".msg.them").textContent()).includes("Marina"));
await shot(buyer, "04-chat");

// 4. Security checks
const editByOther = await buyer.goto(`${listingUrl}/edit`);
check("other users can't edit the ad", editByOther.status() === 404);
const outsider = await newPage();
await outsider.goto(`${BASE}/login?next=/browse`);
await phoneLogin(outsider, "050 333 4455"); // James, a seeded account
await outsider.waitForURL(BASE + "/browse");
check("existing number logs straight in", (await outsider.locator(".user-menu").textContent()).includes("James"));
const convoId = convoUrl.split("/").pop();
check("outsiders can't read the chat (page)", (await outsider.goto(convoUrl)).status() === 404);
check("outsiders can't read the chat (API)", (await outsider.request.get(`${BASE}/api/conversations/${convoId}/messages`)).status() === 404);
check("guests can't read the chat (API)", (await guest.request.get(`${BASE}/api/conversations/${convoId}/messages`)).status() === 401);
await guest.goto(`${BASE}/login/email?next=//evil.example.com`);
check("no open redirect after login", (await guest.locator("input[name=next]").inputValue()) === "/");
check("path traversal blocked on uploads", (await guest.request.get(`${BASE}/uploads/..%2F.env`)).status() === 404);
const adminAsUser = await outsider.goto(`${BASE}/admin`);
check("non-admins can't open admin", !outsider.url().includes("/admin"));

// 5. Report -> admin removes the ad
await outsider.goto(listingUrl);
await outsider.click("text=Report this ad");
await outsider.selectOption("#reason", "Scam or fraud");
await outsider.click("dialog button[type=submit]");
check("report sent", await outsider.getByText("Our team will review").waitFor({ timeout: 5000 }).then(() => true, () => false));

// Advertiser enquiry
await guest.goto(`${BASE}/advertise`);
await guest.fill("#aName", "Sara");
await guest.fill("#aBiz", "Test Padel Club");
await guest.fill("#aEmail", "sara@example.com");
await guest.selectOption("#aSport", "padel-tennis");
await guest.click("#enquire button[type=submit]");
check("advertiser enquiry sent", await guest.getByText("Enquiry sent").waitFor({ timeout: 5000 }).then(() => true, () => false));

const admin = await newPage();
await admin.goto(`${BASE}/login/email?next=/admin`);
await admin.fill("#email", "admin@rekit.test");
await admin.fill("#password", "rekit-demo-123");
await admin.click("form.form-card button[type=submit]");
await admin.waitForURL(BASE + "/admin");
check("admin sees enquiry", await admin.getByText("Test Padel Club").isVisible());
const nums = (await admin.locator("table.data td.num").allTextContents()).map((t) => parseInt(t) || 0);
check("admin sees ad impressions", nums.some((n) => n > 0));
await shot(admin, "05-admin");
await admin.getByRole("button", { name: "Remove ad" }).first().click();
await admin.waitForLoadState("networkidle");
check("removed ad is gone", (await guest.goto(listingUrl)).status() === 404);

// Ad click tracking
const go = await guest.request.get(`${BASE}/go/${await admin.evaluate(() => "x")}`, { maxRedirects: 0 });
check("unknown ad id falls back safely", go.status() === 302 && go.headers().location.endsWith("/advertise"));

// 6. Phone layout: no sideways scrolling
const phone = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
for (const path of ["/", "/browse", `/listing/${(await guest.goto(`${BASE}/browse`), await guest.locator(".card:not(.sponsored)").first().getAttribute("href")).split("/").pop()}`, "/login", "/signup", "/advertise"]) {
  await phone.goto(BASE + path);
  const w = await phone.evaluate(() => document.documentElement.scrollWidth);
  check(`phone width fits ${path}`, w <= 390, `scrollWidth=${w}`);
}
await phone.goto(`${BASE}/browse`);
await shot(phone, "06-phone-browse");


// 7. SMS limits: a number can only request 3 codes in 10 minutes
const spammer = await newPage();
const spamNumber = randomMobile();
let limited = false;
for (let i = 0; i < 4; i++) {
  await spammer.goto(`${BASE}/login`);
  await spammer.fill("#phone", spamNumber);
  await spammer.click("form.form-card button[type=submit]");
  limited = await spammer.getByText("Too many codes requested").waitFor({ timeout: 3000 }).then(() => true, () => false);
  if (!limited) await spammer.locator("#code").waitFor();
}
check("4th code request in 10 minutes is refused", limited);

// 8. Email account adds and verifies a mobile number
const emailUser = await newPage();
await emailUser.goto(`${BASE}/signup`);
await emailUser.fill("#name", "Email Person");
const emailAddress = `email${Date.now()}@example.com`;
await emailUser.fill("#email", emailAddress);
await emailUser.fill("#password", "a-strong-password");
await emailUser.selectOption("#city", "Abu Dhabi");
await emailUser.check("#terms");
await emailUser.click("form.form-card button[type=submit]");
await emailUser.waitForURL(BASE + "/");
await emailUser.goto(`${BASE}/account/phone`);
await emailUser.fill("#phone", "050 123 4567"); // Omar's number
await emailUser.click("form.form-card button[type=submit]");
check("can't add someone else's number", await emailUser.getByText("already linked to another account").waitFor({ timeout: 5000 }).then(() => true, () => false));
await phoneLogin(emailUser, randomMobile());
await emailUser.waitForURL(/\/account\?phone=1/);
check("email account now has a verified mobile", await emailUser.getByText("✓ Verified").isVisible());

// 9. Arabic
const arabic = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await arabic.goto(BASE);
await arabic.getByRole("button", { name: "التبديل إلى العربية" }).click();
await arabic.waitForFunction(() => document.documentElement.dir === "rtl");
check("language switch turns on right-to-left", (await arabic.locator("html").getAttribute("lang")) === "ar");
check("home page is in Arabic", (await arabic.locator(".hero h1").textContent()).includes("معداتك القديمة"));
check("prices shown in dirhams", (await arabic.locator(".card .pr").first().textContent()).includes("درهم"));
await arabic.goto(`${BASE}/browse?sport=padel-tennis`);
check("sport names translated", (await arabic.locator("h1").textContent()) === "بادل وتنس");
check("Arabic listings searchable", (await arabic.goto(`${BASE}/browse?q=${encodeURIComponent("مضرب")}`), await arabic.locator(".card .ti").allTextContents()).some((t) => t.includes("مضرب")));
await shot(arabic, "07-arabic-browse");
for (const path of ["/", "/browse", "/login", "/advertise", "/safety"]) {
  await arabic.goto(BASE + path);
  const w = await arabic.evaluate(() => document.documentElement.scrollWidth);
  check(`Arabic phone width fits ${path}`, w <= 390, `scrollWidth=${w}`);
}
await arabic.goto(`${BASE}/login`);
await arabic.fill("#phone", "999");
await arabic.click("form.form-card button[type=submit]");
check("errors are in Arabic", await arabic.getByText("أدخل رقم جوال إماراتيًا").waitFor({ timeout: 5000 }).then(() => true, () => false));
await shot(arabic, "08-arabic-login");
await arabic.goto(BASE);
await shot(arabic, "09-arabic-home");
await arabic.getByRole("button", { name: "Switch to English" }).click();
await arabic.waitForFunction(() => document.documentElement.dir === "ltr");
check("switching back to English works", true);

// 10. Terms, privacy and account deletion
await guest.goto(BASE);
await guest.locator("footer").getByRole("link", { name: "Terms", exact: true }).click();
await guest.waitForURL(BASE + "/terms");
check("terms page has all sections", (await guest.locator(".legal-sections > li").count()) === 15);
check("terms page shows draft notice", await guest.locator(".legal-draft").isVisible());
await guest.goto(`${BASE}/privacy`);
check("privacy page lists the cookies", (await guest.locator("table").allTextContents()).join(" ").includes("rk_session"));
await guest.goto(`${BASE}/signup`);
check("sign-up links to the terms", (await guest.locator(".check a[href='/terms']").count()) === 1);
await arabic.goto(BASE);
await arabic.getByRole("button", { name: "التبديل إلى العربية" }).click();
await arabic.waitForFunction(() => document.documentElement.dir === "rtl");
await arabic.goto(`${BASE}/privacy`);
check("Arabic privacy policy", (await arabic.locator("h1").textContent()) === "سياسة الخصوصية" && (await arabic.locator(".legal-sections > li").count()) === 13);
const w2 = await arabic.evaluate(() => document.documentElement.scrollWidth);
check("Arabic privacy page fits phone width", w2 <= 390, `scrollWidth=${w2}`);
await shot(arabic, "10-arabic-privacy");

const leaver = await newPage();
const leaverMobile = randomMobile();
await leaver.goto(`${BASE}/login?next=/account`);
await phoneLogin(leaver, leaverMobile);
await leaver.locator("#name").waitFor();
await leaver.fill("#name", "Leaving User");
await leaver.selectOption("#city", "Dubai");
await leaver.check("#terms");
await leaver.click("form.form-card button[type=submit]");
await leaver.waitForURL(BASE + "/account");
await leaver.getByRole("button", { name: "Delete my account" }).click();
await leaver.getByRole("button", { name: "Yes, permanently delete everything" }).click();
await leaver.waitForURL(/\?bye=1/);
check("account deleted and logged out", await leaver.getByText("Your account and its data have been deleted").isVisible() && (await leaver.locator(".user-menu").textContent()).includes("Log in"));
await leaver.goto(`${BASE}/login`);
await phoneLogin(leaver, leaverMobile);
check("deleted number starts a fresh sign-up", await leaver.locator("#name").waitFor({ timeout: 5000 }).then(() => true, () => false));

// 11a. Email sign-up sends a confirmation link
const confirmMail = emailsTo(emailAddress).at(-1);
check("email sign-up sends a confirmation link", !!linkIn(confirmMail, "/verify-email"));
await emailUser.goto(linkIn(confirmMail, "/verify-email").replace("http://localhost:3000", BASE));
check("confirmation link works", await emailUser.getByText("is confirmed").isVisible());
await emailUser.goto(linkIn(confirmMail, "/verify-email").replace("http://localhost:3000", BASE));
check("confirmation link only works once", await emailUser.getByText("Link not valid").isVisible());

// 11b. A phone-only user adds an email for alerts
const sellerEmail = `seller${Date.now()}@example.com`;
await seller.goto(`${BASE}/account`);
await seller.fill("#newEmail", "priya@rekit.test");
await seller.getByRole("button", { name: "Send confirmation link" }).click();
check("can't use another account's email", await seller.getByText("already exists").waitFor({ timeout: 5000 }).then(() => true, () => false));
await seller.fill("#newEmail", sellerEmail);
await seller.getByRole("button", { name: "Send confirmation link" }).click();
await seller.getByText(`We've sent a confirmation link to ${sellerEmail}`).waitFor();
const addMail = await waitForEmail(sellerEmail);
await seller.goto(linkIn(addMail, "/verify-email").replace("http://localhost:3000", BASE));
await seller.goto(`${BASE}/account`);
check("added email is confirmed and alerts are on", await seller.locator("#pNotify").isChecked() && (await seller.locator(".form-card").last().textContent()).includes(sellerEmail));

// 11c. New-message alerts: one email per conversation until read, in the recipient's language
const chatter = await newPage();
await chatter.goto(`${BASE}/login?next=/browse`);
await phoneLogin(chatter, randomMobile());
await chatter.locator("#name").waitFor();
await chatter.fill("#name", "Curious Buyer");
await chatter.selectOption("#city", "Dubai");
await chatter.check("#terms");
await chatter.click("form.form-card button[type=submit]");
await chatter.waitForURL(BASE + "/browse");
await chatter.goto(`${BASE}/browse?q=${encodeURIComponent("دراجة جبلية")}`); // Hassan's listing; Hassan uses Arabic
await chatter.locator(".card").first().click();
await chatter.getByRole("button", { name: "Chat with seller" }).click();
await chatter.waitForURL(/\/messages\//);
await chatter.fill("#chatIn", "Hello, is the bike still for sale?");
await chatter.click(".compose button");
await chatter.locator(".msg.me").first().waitFor();
await chatter.fill("#chatIn", "Also, does it come with pedals?");
await chatter.click(".compose button");
await chatter.locator(".msg.me").nth(1).waitFor();
const alert = await waitForEmail("hassan@rekit.test");
await new Promise((r) => setTimeout(r, 1500));
check("recipient gets a new-message email", !!alert && alert.text.includes("Hello, is the bike still for sale?"));
check("email is in the recipient's language (Arabic)", !!alert && alert.subject.includes("رسالة جديدة من Curious Buyer") && alert.html.includes('dir="rtl"'));
check("only one email per conversation until it's read", emailsTo("hassan@rekit.test").length === 1);
check("email has one-click unsubscribe headers", !!alert?.headers?.["List-Unsubscribe-Post"]);
check("user content in the email is escaped", !alert.html.includes("<script"));
const oneClick = alert.headers["List-Unsubscribe"].slice(1, -1).replace("http://localhost:3000", BASE);
const tampered = await guest.request.post(oneClick.replace(/s=[^&]+/, "s=forged"));
check("forged unsubscribe link is refused", tampered.status() === 400);
await guest.goto(linkIn(alert, "/unsubscribe").replace("http://localhost:3000", BASE));
await guest.getByRole("button", { name: "Stop emails" }).click();
check("unsubscribe page works", await guest.getByText("You won't get new-message emails any more").waitFor({ timeout: 5000 }).then(() => true, () => false));
check("one-click unsubscribe endpoint works", (await guest.request.post(oneClick)).status() === 200);

// 11d. Password reset (run last: it changes Priya's password and logs her out everywhere)
const resetter = await newPage();
await resetter.goto(`${BASE}/login/email`);
await resetter.getByRole("link", { name: "Forgot your password?" }).click();
await resetter.waitForURL(BASE + "/forgot-password");
await resetter.fill("#email", "nobody-here@example.com");
await resetter.click("form.form-card button[type=submit]");
const sentText = "If there's an account with that email";
check("unknown email gets the same answer", await resetter.getByText(sentText).waitFor({ timeout: 5000 }).then(() => true, () => false));
check("no email sent to unknown address", emailsTo("nobody-here@example.com").length === 0);
await resetter.goto(`${BASE}/forgot-password`);
await resetter.fill("#email", "priya@rekit.test");
await resetter.click("form.form-card button[type=submit]");
await resetter.getByText(sentText).waitFor();
const resetLink = linkIn(emailsTo("priya@rekit.test").filter((e) => e.subject.includes("Reset")).at(-1), "/reset-password")?.replace("http://localhost:3000", BASE);
check("reset email sent with a link", !!resetLink);
await resetter.goto(resetLink);
await resetter.fill("#password", "new-password-123");
await resetter.fill("#confirm", "different-123");
await resetter.click("form.form-card button[type=submit]");
check("mismatched passwords rejected", await resetter.getByText("don't match").waitFor({ timeout: 5000 }).then(() => true, () => false));
await resetter.fill("#confirm", "new-password-123");
await resetter.click("form.form-card button[type=submit]");
await resetter.waitForURL(/\/account\?password=1/);
check("password reset logs you in", await resetter.getByText("Your password has been changed").isVisible());
await buyer.goto(`${BASE}/saved`);
check("other sessions are logged out after reset", buyer.url().includes("/login"));
await resetter.goto(resetLink);
check("reset link only works once", await resetter.getByText("expired or has already been used").isVisible());
const relog = await newPage();
await relog.goto(`${BASE}/login/email`);
await relog.fill("#email", "priya@rekit.test");
await relog.fill("#password", "new-password-123");
await relog.click("form.form-card button[type=submit]");
await relog.waitForURL(BASE + "/");
check("new password works", (await relog.locator(".user-menu").textContent()).includes("Priya"));

// 12. Ads: online booking, payment, review, refunds, admin campaigns, promotions
const STRIPE = process.env.E2E_PAYMENTS === "stripe";
const biz = await newPage();
await biz.goto(`${BASE}/login/email?next=/advertise/book`);
await biz.fill("#email", "bikes@rekit.test");
await biz.fill("#password", "rekit-demo-123");
await biz.click("form.form-card button[type=submit]");
await biz.waitForURL(BASE + "/advertise/book");
async function fillAd(page, { product = "SPORT_TAKEOVER", sport, weeks = 2, start } = {}) {
  await page.locator(`.choice:has(input[value=${product}])`).click();
  if (sport) await page.selectOption("#sport", sport);
  if (start) await page.fill("#start", start);
  await page.selectOption("#weeks", String(weeks));
  await page.fill("#advertiser", "Marina Bike Lab");
  await page.fill("#headline", "Run club shoes, 30% off");
  await page.fill("#body", "Fitted by experts in Al Quoz. Free gait check.");
  await page.fill("#ctaLabel", "Shop now");
  await page.fill("#ctaUrl", "https://example.com/run");
  await page.check("#adterms");
}
await biz.locator(".choice:has(input[value=SPORT_TAKEOVER])").click();
await biz.selectOption("#sport", "golf");
check("booked dates are shown for a taken sport", (await biz.locator(".booked .chip").count()) >= 1);
await fillAd(biz, { sport: "golf" });
await biz.getByRole("button", { name: "Continue to payment" }).click();
check("can't book dates another advertiser holds", await biz.locator(".err", { hasText: "already booked" }).waitFor({ timeout: 5000 }).then(() => true, () => false));
await biz.selectOption("#sport", "running");
check("price includes 5% VAT", (await biz.getByTestId("total").textContent()) === "AED 3,150");
await biz.fill("#ctaUrl", "http://insecure.example.com");
await biz.getByRole("button", { name: "Continue to payment" }).click();
check("ad links must be https", await biz.getByText("starting with https://").waitFor({ timeout: 5000 }).then(() => true, () => false));
await biz.fill("#ctaUrl", "https://example.com/run");
await biz.getByRole("button", { name: "Continue to payment" }).click();
await biz.getByRole("button", { name: "Pay (test)" }).waitFor();
check("payment page shows the total", (await biz.locator("h1").textContent()).includes("3,150"));
await biz.getByRole("button", { name: "Pay (test)" }).click();
await biz.waitForURL(/\/advertise\/bookings\/.+\?paid=1/);
check("paid booking goes to review", (await biz.getByTestId("booking-title").textContent()) === "Payment received");
const runningOrderUrl = biz.url().split("?")[0];
const receipt = await waitForEmail("bikes@rekit.test");
check("payment confirmation emailed", !!receipt && receipt.subject.startsWith("Payment received"));

// Cancelling at checkout releases the dates; an unpaid booking holds them meanwhile
await biz.goto(`${BASE}/advertise/book`);
await fillAd(biz, { sport: "basketball", weeks: 1 });
await biz.getByRole("button", { name: "Continue to payment" }).click();
await biz.getByRole("button", { name: "Pay (test)" }).waitFor();
const holdUrl = biz.url();
await biz.goto(`${BASE}/advertise/book`);
await fillAd(biz, { sport: "basketball", weeks: 1 });
await biz.getByRole("button", { name: "Continue to payment" }).click();
check("unpaid booking holds its dates", await biz.locator(".err", { hasText: "already booked" }).waitFor({ timeout: 5000 }).then(() => true, () => false));
await biz.goto(holdUrl);
await biz.getByRole("button", { name: "Cancel" }).click();
await biz.waitForURL(/cancelled=1/);
check("leaving checkout cancels the booking", (await biz.getByTestId("booking-title").textContent()) === "Payment cancelled");
await biz.goto(`${BASE}/advertise/book`);
await fillAd(biz, { sport: "basketball", weeks: 1 });
await biz.getByRole("button", { name: "Continue to payment" }).click();
check("cancelled dates can be booked again", await biz.getByRole("button", { name: "Pay (test)" }).waitFor({ timeout: 8000 }).then(() => true, () => false));
if (!STRIPE) {
  check("other people can't open your payment page", (await resetter.goto(biz.url())).status() === 404);
}

// Promotions: business sellers only
await biz.goto(`${BASE}/account`);
const bikeListing = await biz.locator(".myrow .t").first().getAttribute("href");
await biz.goto(`${BASE}${bikeListing}/promote`);
await biz.selectOption("#weeks", "1");
check("promotion price includes VAT", (await biz.locator("tr.total").textContent()).includes("AED 78.75"));
await biz.getByRole("button", { name: "Continue to payment" }).click();
await biz.getByRole("button", { name: "Pay (test)" }).click();
await biz.waitForURL(/paid=1/);
check("paid promotion is live straight away", (await biz.getByTestId("booking-title").textContent()) === "Your ad is promoted");
await outsider.goto(`${BASE}/browse?q=dumbbells`);
const jamesListing = await outsider.locator(".card").first().getAttribute("href");
await outsider.goto(`${BASE}${jamesListing}/promote`);
check("private sellers can't buy promotion", await outsider.getByText("Promotion is for business accounts").isVisible());

// Admin: review queue, refunds, and the campaign form
await admin.goto(`${BASE}/admin`);
check("paid bookings wait in the review queue", (await admin.locator(".review-list .panel").count()) === 2);
const runningPanel = admin.locator(".review-list .panel", { hasText: "Run club shoes" });
await runningPanel.getByRole("button", { name: "Approve" }).click();
await admin.locator(".review-list .panel").nth(1).waitFor({ state: "detached" });
const seededPanel = admin.locator(".review-list .panel", { hasText: "Winter bike service" });
await seededPanel.locator("input[name=note]").fill("The offer needs an end date.");
await seededPanel.getByRole("button", { name: "Reject and refund" }).click();
await admin.getByText("Nothing waiting.").waitFor();
check("review queue empties", (await admin.locator(".review-list .panel").count()) === 0);
const decisions = emailsTo("bikes@rekit.test").map((e) => e.subject);
check("advertiser emailed when approved", decisions.includes("Your ad is approved"));
check("advertiser emailed refund with reason", emailsTo("bikes@rekit.test").some((e) => e.subject === "Your ad booking wasn't approved" && e.text.includes("The offer needs an end date") && e.text.includes("AED 3,150")));
await biz.goto(runningOrderUrl);
check("advertiser sees the approval", (await biz.getByTestId("booking-title").textContent()) === "Your ad is approved");
await biz.goto(`${BASE}/advertise/bookings`);
check("bookings list shows refunded booking", (await biz.locator(".booking-row", { hasText: "Winter bike service" }).textContent()).includes("Not approved"));

await admin.goto(`${BASE}/admin/campaigns/new`);
await admin.selectOption("#placement", "HOME_BANNER");
await admin.fill("#advertiser", "Clash Test");
await admin.fill("#headline", "Should not save");
await admin.fill("#body", "Overlaps the booked homepage banner.");
await admin.fill("#ctaLabel", "Go");
await admin.fill("#ctaUrl", "https://example.com/x");
const plus = (d) => new Date(Date.now() + 4 * 3600e3 + d * 86400e3).toISOString().slice(0, 10);
await admin.fill("#end", plus(7));
await admin.click("form.form-card button[type=submit]");
check("admin can't double-book an exclusive slot", await admin.getByText("already holds this placement").waitFor({ timeout: 5000 }).then(() => true, () => false));
await admin.selectOption("#placement", "LISTING_SIDE");
await admin.selectOption("#sport", "combat");
await admin.fill("#advertiser", "Ring Ready Gym");
await admin.fill("#headline", "Boxing classes for beginners");
await admin.click("form.form-card button[type=submit]");
await admin.waitForURL(/\/admin\?saved=1/);
await guest.goto(`${BASE}/browse?sport=combat`);
await guest.locator(".card").first().click();
await guest.waitForURL(/\/listing\//);
check("admin-created campaign goes live", await guest.getByText("Ring Ready Gym").waitFor({ timeout: 5000 }).then(() => true, () => false));
check("revenue shows on admin page", (await admin.locator(".stat", { hasText: "ad revenue" }).textContent()).includes("AED 3,228.75"));

const forged = await guest.request.post(`${BASE}/api/payments/webhook`, {
  headers: { "Stripe-Signature": `t=${Math.floor(Date.now() / 1000)},v1=forged` },
  data: JSON.stringify({ type: "checkout.session.completed", data: { object: { id: "cs_any", payment_status: "paid" } } }),
});
check("forged payment notifications are refused", forged.status() === 400);

// Arabic booking page
await arabic.goto(`${BASE}/login/email?next=/advertise/book`);
await arabic.fill("#email", "sophie@rekit.test");
await arabic.fill("#password", "rekit-demo-123");
await arabic.click("form.form-card button[type=submit]");
await arabic.waitForURL(BASE + "/advertise/book");
check("booking page in Arabic", (await arabic.locator("h1").textContent()) === "احجز إعلانًا" && (await arabic.getByTestId("total").textContent()).includes("درهم"));
const w3 = await arabic.evaluate(() => document.documentElement.scrollWidth);
check("Arabic booking page fits phone width", w3 <= 390, `scrollWidth=${w3}`);
await shot(arabic, "15-arabic-booking");

// 13. Installable app
const mf = await (await guest.request.get(`${BASE}/manifest.webmanifest`)).json();
check("manifest describes an installable app", mf.name === "ReKit" && mf.display === "standalone" && mf.start_url.startsWith("/") && mf.icons.some((i) => i.sizes === "192x192") && mf.icons.some((i) => i.sizes === "512x512") && mf.icons.some((i) => i.purpose === "maskable"));
check("manifest has shortcuts", mf.shortcuts?.length === 3);
const arMf = await (await arabic.request.get(`${BASE}/manifest.webmanifest`)).json();
check("manifest follows the user's language", arMf.lang === "ar" && arMf.dir === "rtl" && arMf.shortcuts[0].name === "بِع شيئًا");
for (const [file, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["maskable-512.png", 512], ["apple-touch-icon.png", 180]]) {
  const r = await guest.request.get(`${BASE}/icons/${file}`);
  const b = await r.body();
  check(`icon ${file} is a ${size}px PNG`, r.ok() && b.readUInt32BE(16) === size && b.readUInt32BE(20) === size);
}
const swRes = await guest.request.get(`${BASE}/sw.js`);
check("service worker is never cached by browsers", swRes.ok() && /no-cache/.test(swRes.headers()["cache-control"] ?? ""));

const appCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const appPage = await appCtx.newPage();
appPage.on("pageerror", (e) => errors.push(e.message));
await appPage.goto(BASE);
await appPage.evaluate(() => navigator.serviceWorker.ready);
const cdp = await appCtx.newCDPSession(appPage);
const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors");
check("Chrome says the site is installable", installabilityErrors.length === 0, JSON.stringify(installabilityErrors));
await appPage.reload();
await appPage.goto(`${BASE}/browse`); // fetches the page's code so it's stored for later
const cached = await appPage.evaluate(async () => (await Promise.all((await caches.keys()).map(async (k) => (await (await caches.open(k)).keys()).map((r) => new URL(r.url))))).flat().map((u) => u.origin === location.origin ? u.pathname : u.hostname));
check("only shared files are stored on the device, never personal pages", cached.length > 0 && cached.every((p) => p.startsWith("/_next/static/") || p.startsWith("/icons/") || p === "/offline.html" || p.startsWith("fonts.")), cached.filter((p) => !p.startsWith("/_next/static/")).join(","));
await appCtx.setOffline(true);
await appPage.goto(`${BASE}/messages`).catch(() => {});
check("offline page shows when there's no connection", await appPage.getByText("You're offline").isVisible() && await appPage.getByText("أنت غير متصل بالإنترنت").isVisible());
await appCtx.setOffline(false);

// Install suggestion: from the second page view, with "Not now" remembered
const fakePrompt = () => { const e = new Event("beforeinstallprompt", { cancelable: true }); e.prompt = async () => { window.__prompted = true; }; e.userChoice = Promise.resolve({ outcome: "dismissed" }); window.dispatchEvent(e); };
const fresh = await browser.newContext({ viewport: { width: 390, height: 844 } });
const fp = await fresh.newPage();
await fp.goto(BASE);
await fp.evaluate(fakePrompt);
check("no install suggestion on the first page view", (await fp.locator(".install-bar").count()) === 0);
await fp.goto(`${BASE}/browse`);
await fp.evaluate(fakePrompt);
await fp.locator(".install-bar").waitFor({ timeout: 5000 }).catch(() => {});
check("install suggestion from the second page view", await fp.locator(".install-bar").isVisible());
await fp.getByRole("button", { name: "Install" }).click();
check("Install opens the browser's install dialog", await fp.evaluate(() => window.__prompted === true));
await fp.goto(`${BASE}/safety`);
await fp.evaluate(fakePrompt);
await fp.locator(".install-bar").waitFor({ timeout: 5000 });
await fp.getByRole("button", { name: "Not now" }).click();
await fp.goto(BASE);
await fp.evaluate(fakePrompt);
await fp.waitForTimeout(500);
check("\"Not now\" is remembered", (await fp.locator(".install-bar").count()) === 0);
await fresh.close();

const iphone = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" });
const ip = await iphone.newPage();
await ip.goto(BASE);
await ip.goto(`${BASE}/browse`);
await ip.locator(".install-bar").waitFor({ timeout: 5000 }).catch(() => {});
check("iPhone gets Add to Home Screen steps", (await ip.locator(".install-bar").textContent().catch(() => "")).includes("Add to Home Screen") && (await ip.getByRole("button", { name: "Install" }).count()) === 0);
await shot(ip, "18-iphone-install-tip");
await iphone.close();
await appCtx.close();

// 14. Push notifications for new messages
if (process.env.E2E_PUSH) {
  const { createECDH, randomBytes } = await import("node:crypto");
  const ece = require("http_ece");
  const PUSH = "http://localhost:12222";
  const fakeDevice = (id) => {
    const ecdh = createECDH("prime256v1"); ecdh.generateKeys();
    const auth = randomBytes(16);
    return { ecdh, auth, sub: { endpoint: `${PUSH}/push/${id}`, expirationTime: null, keys: { p256dh: ecdh.getPublicKey().toString("base64url"), auth: auth.toString("base64url") } } };
  };
  // Headless Chromium has no real push service, so the page gets a stand-in subscription
  // pointing at tests/push-mock.mjs. Everything after that (server, encryption, delivery) is real.
  const stubPush = (sub) => {
    const key = "fake_push_" + sub.endpoint;
    const make = () => ({ endpoint: sub.endpoint, options: {}, toJSON: () => sub, unsubscribe: async () => { localStorage.removeItem(key); return true; } });
    PushManager.prototype.subscribe = async function () { localStorage.setItem(key, "1"); return make(); };
    PushManager.prototype.getSubscription = async function () { return localStorage.getItem(key) ? make() : null; };
  };
  const pushesTo = async (id) => (await (await fetch(`${PUSH}/__log`)).json()).filter((p) => p.id === id);
  const waitPush = async (id, n) => { for (let i = 0; i < 40; i++) { const l = await pushesTo(id); if (l.length >= n) return l; await new Promise((r) => setTimeout(r, 250)); } return pushesTo(id); };
  const decrypt = (dev, p) => JSON.parse(ece.decrypt(Buffer.from(p.body, "base64"), { version: "aes128gcm", privateKey: dev.ecdh, authSecret: dev.auth }).toString());

  // The default headless browser has no notification support, so these checks use Chrome's newer headless mode.
  const pushBrowser = await chromium.launch({ channel: "chromium" });
  const priyaCtx = await pushBrowser.newContext({ viewport: { width: 1280, height: 900 } });
  await priyaCtx.grantPermissions(["notifications"], { origin: BASE });
  const phoneA = fakeDevice("priya-phone");
  await priyaCtx.addInitScript(stubPush, phoneA.sub);
  const priya = await priyaCtx.newPage();
  priya.on("pageerror", (e) => errors.push(e.message));
  await priya.goto(`${BASE}/login/email?next=/account`);
  await priya.fill("#email", "priya@rekit.test");
  await priya.fill("#password", "new-password-123");
  await priya.click("form.form-card button[type=submit]");
  await priya.waitForURL(BASE + "/account");
  await priya.locator('[data-testid=push-settings][data-status=off]').waitFor();
  await priya.getByRole("button", { name: "Turn on notifications" }).click();
  check("notifications can be turned on", await priya.locator('[data-testid=push-settings][data-status=on]').waitFor({ timeout: 8000 }).then(() => true, () => false));
  await priya.reload();
  check("the setting is remembered for this device", await priya.locator('[data-testid=push-settings][data-status=on]').waitFor({ timeout: 8000 }).then(() => true, () => false));

  const evil = await priya.request.post(`${BASE}/api/push/subscription`, { headers: { Origin: "https://evil.example.com" }, data: phoneA.sub });
  check("other websites can't change notification settings", evil.status() === 403);
  const ssrf = await priya.evaluate(async () => (await fetch("/api/push/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: "https://evil.example.com/hook", keys: { p256dh: "x".repeat(87), auth: "y".repeat(22) } }) })).status);
  check("only real push services are accepted", ssrf === 400);

  const omar = await newPage();
  // Email logins from here on: the run has used up the SMS limit for one network (10 codes an hour).
  await omar.goto(`${BASE}/login/email?next=/messages`);
  await omar.fill("#email", "omar@rekit.test");
  await omar.fill("#password", "rekit-demo-123");
  await omar.click("form.form-card button[type=submit]");
  await omar.waitForURL(BASE + "/messages");
  await omar.locator(".inbox a", { hasText: "Priya" }).click();
  await omar.waitForURL(/\/messages\//);
  const sendAsOmar = async (text) => { await omar.fill("#chatIn", text); await omar.click(".compose button"); await omar.locator(".msg.me", { hasText: text }).waitFor(); };
  await sendAsOmar("Still keen? I can do 600.");
  const [push1] = await waitPush("priya-phone", 1);
  const payload = push1 && decrypt(phoneA, push1);
  check("notification delivered when a message arrives", !!payload && payload.title === "Omar K. sent you a message" && payload.body.includes("Still keen? I can do 600.") && payload.url.startsWith("/messages/"));
  check("notifications are encrypted and signed", !!push1 && push1.headers["content-encoding"] === "aes128gcm" && /^vapid t=.+, k=.+/.test(push1.headers.authorization ?? ""));
  check("notifications for one chat share a tag", payload?.tag === `conv-${payload?.url.split("/").pop()}`);

  // The service worker shows it (pushed straight to it through Chrome's DevTools protocol)
  const cdpP = await priyaCtx.newCDPSession(priya);
  let registrationId;
  cdpP.on("ServiceWorker.workerRegistrationUpdated", (e) => { const r = e.registrations.find((x) => x.scopeURL.startsWith(BASE)); if (r) registrationId = r.registrationId; });
  await cdpP.send("ServiceWorker.enable");
  await priya.goto(`${BASE}/browse`);
  for (let i = 0; i < 20 && !registrationId; i++) await new Promise((r) => setTimeout(r, 100));
  const shown = async () => priya.evaluate(async () => (await (await navigator.serviceWorker.ready).getNotifications()).map((n) => ({ title: n.title, body: n.body, tag: n.tag })));
  await cdpP.send("ServiceWorker.deliverPushMessage", { origin: BASE, registrationId, data: JSON.stringify(payload) });
  await priya.waitForTimeout(800);
  const first = await shown();
  check("the phone shows the notification", first.length === 1 && first[0].title === "Omar K. sent you a message");
  await cdpP.send("ServiceWorker.deliverPushMessage", { origin: BASE, registrationId, data: JSON.stringify({ ...payload, body: "Second message" }) });
  await priya.waitForTimeout(800);
  const second = await shown();
  check("a new message in the same chat replaces the notification", second.length === 1 && second[0].body === "Second message");

  // Logging out stops notifications on that device
  await priya.goto(BASE);
  await priya.locator(".user-menu").getByRole("button", { name: "Log out" }).click();
  await priya.waitForURL(BASE + "/");
  await sendAsOmar("Are you there?");
  await new Promise((r) => setTimeout(r, 2000));
  check("logging out stops notifications on that device", (await pushesTo("priya-phone")).length === 1);

  // An expired subscription is removed the first time it fails
  const gone = fakeDevice("gone");
  await priyaCtx.addInitScript(stubPush, gone.sub);
  await priya.goto(`${BASE}/login/email?next=/account`);
  await priya.fill("#email", "priya@rekit.test");
  await priya.fill("#password", "new-password-123");
  await priya.click("form.form-card button[type=submit]");
  await priya.waitForURL(BASE + "/account");
  await priya.locator('[data-testid=push-settings][data-status=off]').waitFor();
  await priya.getByRole("button", { name: "Turn on notifications" }).click();
  await priya.locator('[data-testid=push-settings][data-status=on]').waitFor();
  await sendAsOmar("Last call!");
  await waitPush("gone", 1);
  await new Promise((r) => setTimeout(r, 500));
  const still = await priya.evaluate(async (ep) => (await (await fetch(`/api/push/subscription?endpoint=${encodeURIComponent(ep)}`)).json()).active, gone.sub.endpoint);
  check("expired subscriptions are cleaned up", still === false);

  // The prompt in chat, right after sending a message
  const askerCtx = await pushBrowser.newContext({ viewport: { width: 1280, height: 900 } });
  const asker = await askerCtx.newPage();
  await asker.goto(`${BASE}/signup?next=/browse`);
  await asker.fill("#name", "Prompt Tester");
  await asker.fill("#email", `prompt${Date.now()}@example.com`);
  await asker.fill("#password", "a-strong-password");
  await asker.selectOption("#city", "Dubai");
  await asker.check("#terms");
  await asker.click("form.form-card button[type=submit]");
  await asker.waitForURL(BASE + "/browse");
  await asker.goto(`${BASE}/browse?q=dumbbells`);
  await asker.locator(".card").first().click();
  await asker.getByRole("button", { name: "Chat with seller" }).click();
  await asker.waitForURL(/\/messages\//);
  const perm = await asker.evaluate(() => Notification.permission);
  check("no notification prompt before sending", (await asker.locator(".push-prompt").count()) === 0);
  await asker.fill("#chatIn", "Hi, are these still available?");
  await asker.click(".compose button");
  await asker.locator(".msg.me").first().waitFor();
  if (perm === "default") {
    check("chat offers notifications after you send", await asker.locator(".push-prompt").waitFor({ timeout: 5000 }).then(() => true, () => false));
    await asker.getByRole("button", { name: "No thanks" }).click();
    await asker.reload();
    await asker.fill("#chatIn", "Also, can you deliver?");
    await asker.click(".compose button");
    await asker.locator(".msg.me").nth(1).waitFor();
    await asker.waitForTimeout(800);
    check("\"No thanks\" is remembered", (await asker.locator(".push-prompt").count()) === 0);
  } else {
    console.log(`(skipped chat prompt checks: this browser reports notification permission "${perm}")`);
  }

  // iPhone outside the home-screen app
  const iphone2 = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" });
  const ip2 = await iphone2.newPage();
  await ip2.goto(`${BASE}/login/email?next=/account`);
  await ip2.fill("#email", "james@rekit.test");
  await ip2.fill("#password", "rekit-demo-123");
  await ip2.click("form.form-card button[type=submit]");
  await ip2.waitForURL(BASE + "/account");
  check("iPhone users are told to add ReKit to the home screen first", await ip2.locator('[data-testid=push-settings][data-status="ios-install"]').waitFor({ timeout: 5000 }).then(() => true, () => false));
  await iphone2.close();
  await pushBrowser.close();
}

// 15. Google Play requirements: blocking, account deletion page, app link, payments in the app
const victim = await newPage();
await victim.goto(`${BASE}/login/email?next=/messages`);
await victim.fill("#email", "omar@rekit.test");
await victim.fill("#password", "rekit-demo-123");
await victim.click("form.form-card button[type=submit]");
await victim.waitForURL(BASE + "/messages");
const pest = await newPage();
await pest.goto(`${BASE}/signup?next=/browse`);
await pest.fill("#name", "Pushy Buyer");
await pest.fill("#email", `pest${Date.now()}@example.com`);
await pest.fill("#password", "a-strong-password");
await pest.selectOption("#city", "Dubai");
await pest.check("#terms");
await pest.click("form.form-card button[type=submit]");
await pest.waitForURL(BASE + "/browse");
await pest.goto(`${BASE}/browse?q=Bullpadel`);
await pest.locator(".card").first().click();
await pest.waitForURL(/\/listing\//);
const omarListingUrl = pest.url();
await pest.getByRole("button", { name: "Chat with seller" }).click();
await pest.waitForURL(/\/messages\//);
const pestChat = pest.url();
await pest.fill("#chatIn", "Give it to me for 100 or else.");
await pest.click(".compose button");
await pest.locator(".msg.me").first().waitFor();
await victim.goto(`${BASE}/messages`);
await victim.locator(".inbox a", { hasText: "Pushy Buyer" }).click();
await victim.getByRole("button", { name: "Block" }).click();
await victim.check("#blockReport");
await victim.locator("dialog").getByRole("button", { name: "Block" }).click();
await victim.waitForURL(/\/messages\?blocked=1/);
check("blocking hides the chat from the inbox", await victim.getByText("Blocked. They can't message you").isVisible() && (await victim.locator(".inbox a", { hasText: "Pushy Buyer" }).count()) === 0);
await pest.goto(pestChat);
check("blocked person can't reply", await pest.getByText("You can't reply to this conversation").isVisible() && (await pest.locator("#chatIn").count()) === 0);
await pest.goto(omarListingUrl);
await pest.getByRole("button", { name: "Chat with seller" }).click();
await pest.waitForURL(/blocked=1/);
check("blocked person can't start a new chat", await pest.getByText("You can't message this seller").waitFor({ timeout: 5000 }).then(() => true, () => false));
await admin.goto(`${BASE}/admin`);
check("block and report reaches the admin", (await admin.locator("table.data", { hasText: "Abusive or scam messages" }).count()) === 1);
await victim.goto(`${BASE}/account`);
check("blocked people are listed on the account page", (await victim.getByTestId("blocked-people").textContent()).includes("Pushy Buyer"));
await victim.getByTestId("blocked-people").getByRole("button", { name: "Unblock" }).click();
await victim.waitForLoadState("networkidle");
await pest.goto(pestChat);
check("unblocking allows messages again", await pest.locator("#chatIn").waitFor({ timeout: 5000 }).then(() => true, () => false));

for (const lang of ["en", "ar"]) {
  const pc = await browser.newContext({ viewport: { width: 360, height: 640 } });
  await pc.addCookies([{ name: "rk_lang", value: lang, url: BASE }]);
  const pp = await pc.newPage();
  await pp.goto(`${BASE}/login/email?next=/messages`);
  await pp.fill("#email", "omar@rekit.test");
  await pp.fill("#password", "rekit-demo-123");
  await pp.click("form.form-card button[type=submit]");
  await pp.waitForURL(BASE + "/messages");
  await pp.locator(".inbox a").first().click();
  await pp.waitForURL(/\/messages\//);
  await pp.locator(".compose").waitFor();
  const [cw, sw] = await pp.evaluate(() => { const c = document.querySelector(".chat-page"); return [c.clientWidth, c.scrollWidth]; });
  check(`chat fits a phone screen (${lang})`, sw <= cw, `${sw} > ${cw}`);
  await pc.close();
}

await guest.goto(`${BASE}/delete-account`);
check("public account deletion page", (await guest.locator("h1").textContent()) === "Delete your ReKit account" && await guest.getByText("payment records").isVisible());
const links = await (await guest.request.get(`${BASE}/.well-known/assetlinks.json`)).json();
check("app link file names the Android app", links[0]?.target?.package_name === "ae.rekit.app" && links[0].target.sha256_cert_fingerprints.length === 1);

const droid = await browser.newContext({ viewport: { width: 390, height: 844 } });
const dp = await droid.newPage();
await dp.goto(`${BASE}/?source=twa`);
await dp.waitForFunction(() => document.cookie.includes("rk_app=android"));
await dp.waitForLoadState("networkidle");
check("the Google Play app hides the install suggestion", (await dp.locator(".install-bar").count()) === 0);
await dp.goto(`${BASE}/login/email?next=/advertise/book`);
await dp.fill("#email", "gym@rekit.test");
await dp.fill("#password", "rekit-demo-123");
await dp.click("form.form-card button[type=submit]");
await dp.waitForURL(BASE + "/advertise/book");
check("ad booking is website-only inside the Android app", await dp.getByTestId("web-only").isVisible() && (await dp.locator("#adterms").count()) === 0);
await dp.goto(`${BASE}/advertise`);
check("Advertise page hides Book online in the app", (await dp.getByRole("link", { name: "Book online" }).count()) === 0);
await droid.close();

// 16. Apple App Store requirements: iPhone app mode, Apple notifications, native share, universal links, content filter
await guest.goto(`${BASE}/help`);
check("help page shows contact details", (await guest.locator("h1").textContent()) === "Help and contact" && await guest.getByText("We reply within one working day").isVisible());
const aasa = await (await guest.request.get(`${BASE}/.well-known/apple-app-site-association`)).json();
check("universal links file names the iPhone app", aasa.applinks.details[0]?.appIDs[0] === "ABCDE12345.ae.rekit.app" && aasa.applinks.details[0].components.some((c) => c["/"] === "/go/*" && c.exclude));

// Post an ad for a banned item: blocked in English and Arabic
await seller.goto(`${BASE}/sell`);
await seller.fill("#title", "Testosterone vials, sealed");
await seller.selectOption("#sport", "gym");
await seller.fill("#description", "Never used, still in the box.");
await seller.fill("#price", "300");
await seller.click("form.form-card button[type=submit]");
check("ads for banned items are blocked", await seller.getByText("can't be sold on ReKit").waitFor({ timeout: 5000 }).then(() => true, () => false));
await seller.fill("#title", "Genuine Nike boots, not fake");
await seller.fill("#description", "Pistol grip pump included, bought in Dubai Mall.");
await seller.click("form.form-card button[type=submit]");
check("innocent ads aren't caught by the filter", await seller.waitForURL(/\/listing\/.+\?posted=1/, { timeout: 15000 }).then(() => true, () => false));

// The iPhone app: a stand-in for the native bridge Capacitor puts in the page
const IOS_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 ReKitApp-iOS/1.0";
const fakeCapacitor = (token) => {
  const listeners = {};
  window.__capListeners = listeners;
  let granted = localStorage.getItem("fake_apns") === "1";
  window.Capacitor = {
    isNativePlatform: () => true, getPlatform: () => "ios",
    Plugins: {
      PushNotifications: {
        checkPermissions: async () => ({ receive: granted ? "granted" : "prompt" }),
        requestPermissions: async () => { granted = true; localStorage.setItem("fake_apns", "1"); return { receive: "granted" }; },
        register: async () => { setTimeout(() => (listeners.registration || []).forEach((cb) => cb({ value: token })), 50); },
        addListener: async (ev, cb) => { (listeners[ev] ||= []).push(cb); return { remove: async () => { listeners[ev] = (listeners[ev] || []).filter((x) => x !== cb); } }; },
      },
      Share: { share: async (o) => { window.__shared = o; return {}; } },
    },
  };
};
const iosCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: IOS_UA });
const iosToken = "a1b2c3d4".repeat(8);
await iosCtx.addInitScript(fakeCapacitor, iosToken);
const ios = await iosCtx.newPage();
ios.on("pageerror", (e) => errors.push(e.message));
await ios.goto(`${BASE}/signup?next=/account`);
await ios.fill("#name", "iPhone Tester");
await ios.fill("#email", `iphone${Date.now()}@example.com`);
await ios.fill("#password", "a-strong-password");
await ios.selectOption("#city", "Dubai");
await ios.check("#terms");
await ios.click("form.form-card button[type=submit]");
await ios.waitForURL(BASE + "/account");
check("the iPhone app has no install suggestions", (await ios.locator(".install-bar").count()) === 0 && (await ios.getByRole("heading", { name: "Install the app" }).count()) === 0);
await ios.locator('[data-testid=push-settings][data-status=off]').waitFor({ timeout: 8000 });
await ios.getByRole("button", { name: "Turn on notifications" }).click();
check("Apple notifications can be turned on in the iPhone app", await ios.locator('[data-testid=push-settings][data-status=on]').waitFor({ timeout: 8000 }).then(() => true, () => false));
await ios.goto(`${BASE}/advertise/book`);
check("ad booking is website-only in the iPhone app", await ios.getByTestId("web-only").isVisible());

await ios.goto(`${BASE}/browse?q=Bullpadel`);
await ios.locator(".card").first().click();
await ios.waitForURL(/\/listing\//);
await ios.getByRole("button", { name: "Share" }).click();
check("Share uses the iPhone's native share sheet", await ios.waitForFunction(() => window.__shared?.url?.includes("/listing/"), null, { timeout: 3000 }).then(() => true, () => false));
await ios.getByRole("button", { name: "Chat with seller" }).click();
await ios.waitForURL(/\/messages\//);
const iosChat = new URL(ios.url()).pathname;
await ios.fill("#chatIn", "Hello from the iPhone app");
await ios.click(".compose button");
await ios.locator(".msg.me").first().waitFor();

const omar2 = await newPage();
await omar2.goto(`${BASE}/login/email?next=/messages`);
await omar2.fill("#email", "omar@rekit.test");
await omar2.fill("#password", "rekit-demo-123");
await omar2.click("form.form-card button[type=submit]");
await omar2.waitForURL(BASE + "/messages");
await omar2.locator(".inbox a", { hasText: "iPhone Tester" }).click();
await omar2.fill("#chatIn", "Yes, still available!");
await omar2.click(".compose button");
await omar2.locator(".msg.me", { hasText: "Yes, still available!" }).waitFor();
const apnsLog = async () => { try { return JSON.parse(readFileSync(process.env.APNS_LOG_FILE, "utf8")); } catch { return []; } };
let sentToIphone = [];
for (let i = 0; i < 40 && !sentToIphone.length; i++) { sentToIphone = (await apnsLog()).filter((e) => e.token === iosToken); if (!sentToIphone.length) await new Promise((r) => setTimeout(r, 250)); }
const apn = sentToIphone[0];
check("Apple notification sent when a message arrives", apn?.status === 200 && apn.body.aps.alert.title === "Omar K. sent you a message" && apn.body.aps.alert.body.includes("Yes, still available!") && apn.body.url === iosChat);
check("Apple notification is signed and addressed to the app", apn?.headers.topic === "ae.rekit.app" && apn.headers.pushType === "alert" && apn.headers.collapseId?.startsWith("conv-"));

// Tapping the notification opens the chat; links to other sites are ignored
await ios.goto(`${BASE}/browse`);
await ios.evaluate(() => (window.__capListeners.pushNotificationActionPerformed || []).forEach((cb) => cb({ notification: { data: { url: "//evil.example.com" } } })));
await ios.waitForTimeout(500);
check("notification taps can't open other sites", new URL(ios.url()).host === new URL(BASE).host);
await ios.evaluate((u) => (window.__capListeners.pushNotificationActionPerformed || []).forEach((cb) => cb({ notification: { data: { url: u } } })), iosChat);
check("tapping a notification opens the chat", await ios.waitForURL(BASE + iosChat, { timeout: 5000 }).then(() => true, () => false));

// A phone that deleted the app: Apple says "Unregistered", and the token is removed
const deadToken = "dead" + "0".repeat(60);
const deadReg = await ios.evaluate(async (t) => (await fetch("/api/push/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "apns", token: t }) })).status, deadToken);
await omar2.fill("#chatIn", "Are you still there?");
await omar2.click(".compose button");
await omar2.locator(".msg.me", { hasText: "Are you still there?" }).waitFor();
let deadHit = [];
for (let i = 0; i < 40 && !deadHit.length; i++) { deadHit = (await apnsLog()).filter((e) => e.token === deadToken); if (!deadHit.length) await new Promise((r) => setTimeout(r, 250)); }
await new Promise((r) => setTimeout(r, 500));
const deadActive = await ios.evaluate(async (t) => (await (await fetch(`/api/push/subscription?endpoint=apns:${t}`)).json()).active, deadToken);
check("uninstalled iPhones are removed after Apple's 410", deadReg === 200 && deadHit[0]?.status === 410 && deadActive === false);
const badToken = await ios.evaluate(async () => (await fetch("/api/push/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "apns", token: "not-a-token" }) })).status);
check("invalid Apple device tokens are rejected", badToken === 400);
await iosCtx.close();

// 17. Listing views: counted once per visitor per day, shown only to the seller
const statsOwner = await newPage();
await statsOwner.goto(`${BASE}/login/email?next=/account`);
await statsOwner.fill("#email", "aisha@rekit.test");
await statsOwner.fill("#password", "rekit-demo-123");
await statsOwner.click("form.form-card button[type=submit]");
await statsOwner.waitForURL(BASE + "/account");
check("My ads shows views this week", /\d+ views \(\d+ this week\)/.test(await statsOwner.getByTestId("my-ad-stats").first().textContent()));
const aishaAd = await statsOwner.locator(".myrow .t").first().getAttribute("href");
const readStats = async () => {
  await statsOwner.goto(BASE + aishaAd);
  return { total: +(await statsOwner.getByTestId("stat-total").textContent()), week: +(await statsOwner.getByTestId("stat-week").textContent()) };
};
const before = await readStats();
check("seller's own visits don't count", (await readStats()).total === before.total);
const visit = async (ua, times = 1) => {
  const c = await browser.newContext({ userAgent: ua });
  const vp = await c.newPage();
  for (let i = 0; i < times; i++) await vp.goto(BASE + aishaAd);
  const sees = await vp.getByTestId("listing-stats").count();
  await c.close();
  return sees;
};
const seenByVisitor = await visit("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 ViewTest/1", 3); // one person, three visits
await visit("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1 ViewTest/2");                       // a second person
await visit("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)");                    // a search engine
await visit("WhatsApp/2.23.20.0");                                                                          // a link preview
const after = await readStats();
check("each visitor counts once a day; refreshes and robots don't count", after.total === before.total + 2 && after.week === before.week + 2, `${before.total} -> ${after.total}`);
check("only the seller sees the stats", seenByVisitor === 0);
const bars = statsOwner.locator(".views-chart rect");
check("chart shows the last 14 days", (await bars.count()) === 14);
await bars.nth(0).hover();
const firstTip = await statsOwner.getByTestId("views-tip").textContent();
await bars.nth(13).hover();
const lastTip = await statsOwner.getByTestId("views-tip").textContent();
check("hovering a day shows its views", firstTip !== lastTip && /views?$/.test(lastTip));
check("chart numbers are available as a table for screen readers", (await statsOwner.locator(".views-chart table tr").count()) === 14);
await shot(statsOwner, "19-listing-stats");
const arStats = await browser.newContext({ viewport: { width: 390, height: 844 } });
await arStats.addCookies([{ name: "rk_lang", value: "ar", url: BASE }]);
const asp = await arStats.newPage();
await asp.goto(`${BASE}/login/email?next=${encodeURIComponent(aishaAd)}`);
await asp.fill("#email", "aisha@rekit.test");
await asp.fill("#password", "rekit-demo-123");
await asp.click("form.form-card button[type=submit]");
await asp.waitForURL(BASE + aishaAd);
check("stats in Arabic", await asp.getByText("أداء إعلانك").isVisible() && (await asp.evaluate(() => document.documentElement.scrollWidth)) <= 390);
await shot(asp, "20-listing-stats-ar");
await arStats.close();

// 18. Which searches found a listing (seller only)
const searcher = await browser.newContext({ userAgent: "Mozilla/5.0 (X11; Linux x86_64) Chrome/131.0 SearchTest/1" });
const sp = await searcher.newPage();
await sp.goto(`${BASE}/browse?q=Vaporfly`);
await sp.goto(`${BASE}/browse?q=vaporfly`); // same search again (different case): counts once
await sp.goto(`${BASE}/browse?q=${encodeURIComponent("call me 050 123 4567")}`); // looks like a phone number: never recorded
await sp.goto(`${BASE}/browse?q=${encodeURIComponent("seller@example.com")}`); // email: never recorded
await sp.goto(`${BASE}/browse?q=vaporfly`);
await sp.locator(".card", { hasText: "Vaporfly" }).first().click();
await sp.waitForURL(/\/listing\//);
const vaporflyUrl = new URL(sp.url()).pathname;
check("visitors don't see how listings were found", (await sp.getByTestId("found-by").count()) === 0);
await sp.goto(`${BASE}/browse?sport=running`);
await sp.locator(".card", { hasText: "Garmin" }).first().click(); // a view from browsing a sport
await sp.waitForURL(/\/listing\//);
await searcher.close();

await statsOwner.goto(BASE + vaporflyUrl);
const termsText = await statsOwner.getByTestId("found-terms").textContent();
const vaporflyRow = await statsOwner.getByTestId("found-terms").locator("li", { hasText: "vaporfly" }).textContent();
check("seller sees the search that found the ad", /vaporfly\s*shown 1 · 1 view/.test(vaporflyRow), vaporflyRow);
check("searches that look like phone numbers or emails aren't recorded", !/050|@/.test(termsText));
check("seller sees where views came from", (await statsOwner.getByTestId("found-sources").textContent()).includes("Searches"));
const garminUrl = await (async () => { await statsOwner.goto(`${BASE}/account`); return statsOwner.locator(".myrow .t", { hasText: "Garmin" }).getAttribute("href"); })();
await statsOwner.goto(BASE + garminUrl);
check("views from browsing a sport are counted", (await statsOwner.getByTestId("found-sources").textContent()).includes("Browsing a sport"));
await statsOwner.getByTestId("found-by").scrollIntoViewIfNeeded();
await statsOwner.getByTestId("found-by").screenshot({ path: SHOTS ? `${SHOTS}/21-found-by.png` : undefined }).catch(() => {});

check("no browser errors", errors.length === 0, errors.join(" | "));
console.log(`\n${passed} passed, ${failed} failed`);
await browser.close();
process.exit(failed ? 1 : 0);
