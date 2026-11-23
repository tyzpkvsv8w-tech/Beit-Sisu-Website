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
await guest.locator("footer").getByRole("link", { name: "Terms" }).click();
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

check("no browser errors", errors.length === 0, errors.join(" | "));
console.log(`\n${passed} passed, ${failed} failed`);
await browser.close();
process.exit(failed ? 1 : 0);
