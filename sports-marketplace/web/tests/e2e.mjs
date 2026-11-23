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

// 2. Seller signs up and posts an ad with a photo
const seller = await newPage();
const email = `seller${Date.now()}@example.com`;
await seller.goto(`${BASE}/signup?next=/sell`);
await seller.fill("#name", "Test Seller");
await seller.fill("#email", email);
await seller.fill("#password", "short");
await seller.selectOption("#city", "Dubai");
await seller.check("#terms");
await seller.click("form.form-card button[type=submit]");
check("weak password rejected", await seller.getByText("Use at least 8 characters").waitFor({ timeout: 5000 }).then(() => true, () => false));
await seller.fill("#password", "a-strong-password");
await seller.click("form.form-card button[type=submit]");
await seller.waitForURL(BASE + "/sell");
check("signup logs in and returns to /sell", true);
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
const imgRes = await seller.request.get(BASE + imgSrc);
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
await buyer.goto(`${BASE}/login?next=/listing/${listingId}`);
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
await outsider.goto(`${BASE}/login`);
await outsider.fill("#email", "james@rekit.test");
await outsider.fill("#password", "rekit-demo-123");
await outsider.click("form.form-card button[type=submit]");
await outsider.waitForURL(BASE + "/");
const convoId = convoUrl.split("/").pop();
check("outsiders can't read the chat (page)", (await outsider.goto(convoUrl)).status() === 404);
check("outsiders can't read the chat (API)", (await outsider.request.get(`${BASE}/api/conversations/${convoId}/messages`)).status() === 404);
check("guests can't read the chat (API)", (await guest.request.get(`${BASE}/api/conversations/${convoId}/messages`)).status() === 401);
await guest.goto(`${BASE}/login?next=//evil.example.com`);
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
await guest.click("#enquire button[type=submit]");
check("advertiser enquiry sent", await guest.getByText("Enquiry sent").waitFor({ timeout: 5000 }).then(() => true, () => false));

const admin = await newPage();
await admin.goto(`${BASE}/login?next=/admin`);
await admin.fill("#email", "admin@rekit.test");
await admin.fill("#password", "rekit-demo-123");
await admin.click("form.form-card button[type=submit]");
await admin.waitForURL(BASE + "/admin");
check("admin sees enquiry", await admin.getByText("Test Padel Club").isVisible());
check("admin sees ad impressions", (await admin.locator("table.data td.num").first().textContent()) !== "0");
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

check("no browser errors", errors.length === 0, errors.join(" | "));
console.log(`\n${passed} passed, ${failed} failed`);
await browser.close();
process.exit(failed ? 1 : 0);
