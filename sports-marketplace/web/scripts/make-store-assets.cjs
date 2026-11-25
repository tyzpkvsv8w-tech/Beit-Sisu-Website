// Produces store graphics from the running site (with sample data).
//   Google Play (default): phone screenshots 1080x1920, feature graphics 1024x500, 512px icon.
//   App Store (--ios):     iPhone 6.9" screenshots 1320x2868.
// All in English and Arabic.
// Usage: start the app with sample data (npm run db:reset && npm start), then
//   node scripts/make-store-assets.cjs [--ios] [baseUrl]
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const IOS = process.argv.includes("--ios");
const BASE = process.argv.slice(2).find((a) => !a.startsWith("--")) || "http://localhost:3000";
const OUT = path.join(__dirname, "..", "..", IOS ? "ios" : "android", "store-listing", "graphics");
// iPhone 6.9" (440x956 points at 3x) or a common Android phone (360x640 at 3x).
const SCREEN = IOS ? { width: 440, height: 956 } : { width: 360, height: 640 };
const IOS_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 ReKitApp-iOS/1.0";

const FEATURE = (lang) => `<!doctype html><html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}"><head>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@1,800&family=Cairo:wght@800&family=Inter:wght@500&family=IBM+Plex+Sans+Arabic:wght@500&display=swap" rel="stylesheet">
<style>html,body{margin:0;width:1024px;height:500px;overflow:hidden}
body{background:#0f1a2b;color:#f3f5f8;display:grid;grid-template-columns:1.25fr 1fr;align-items:center;padding:0 64px;box-sizing:border-box;gap:30px;
font-family:${lang === "ar" ? '"IBM Plex Sans Arabic"' : '"Inter"'},sans-serif}
.logo{font:italic 800 64px "Barlow Condensed",sans-serif;direction:ltr;display:inline-block}.logo b{background:#d9f24a;color:#1b2400;padding:0 10px;border-radius:6px}
h1{font:${lang === "ar" ? '800 50px/1.3 "Cairo"' : 'italic 800 66px/0.98 "Barlow Condensed"'},sans-serif;margin:22px 0 14px;text-transform:${lang === "ar" ? "none" : "uppercase"}}
h1 mark{background:#d9f24a;color:#1b2400;padding:0 .12em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
p{margin:0;font-size:22px;opacity:.85}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.grid span{aspect-ratio:1;border-radius:18px;display:grid;place-items:center;font-size:58px}</style></head><body>
<div><div class="logo">Re<b>Kit</b></div>
${lang === "ar" ? '<h1>معداتك القديمة، <mark>موسم جديد لشخص آخر</mark></h1><p>بِع واشترِ المعدات الرياضية المستعملة في الإمارات. مجانًا وبدون عمولة.</p>'
  : '<h1>Your old gear, <mark>someone\'s next season</mark></h1><p>Buy and sell second-hand sports gear in the UAE. Free, no commission.</p>'}</div>
<div class="grid">${[["🎾", "#c9e86b"], ["🚴", "#7fb3ff"], ["🏋️", "#ffb27a"], ["⚽", "#8fe0a8"], ["⛳", "#a8e6c8"], ["🏄", "#7fd8f0"], ["👟", "#ff9aa8"], ["🏏", "#f2d27a"], ["🥊", "#ff9b8f"]]
  .map(([e, c]) => `<span style="background:${c}">${e}</span>`).join("")}</div></body></html>`;

async function login(page, email, password) {
  await page.goto(`${BASE}/login/email`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("form.form-card button[type=submit]");
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  for (const lang of ["en", "ar"]) {
    if (!IOS) {
      const fg = await browser.newPage({ viewport: { width: 1024, height: 500 } });
      await fg.setContent(FEATURE(lang), { waitUntil: "networkidle" });
      await fg.screenshot({ path: path.join(OUT, `feature-graphic-${lang}.png`) });
      await fg.close();
    }

    // Looks like the installed app: the rk_app cookie (Android) or the app's user agent (iPhone).
    const ctx = await browser.newContext({ viewport: SCREEN, deviceScaleFactor: 3, isMobile: true, hasTouch: true, ...(IOS ? { userAgent: IOS_UA } : {}) });
    await ctx.addCookies([{ name: "rk_lang", value: lang, url: BASE }, ...(IOS ? [] : [{ name: "rk_app", value: "android", url: BASE }])]);
    const p = await ctx.newPage();
    const shot = async (n) => { await p.waitForTimeout(600); await p.screenshot({ path: path.join(OUT, `${IOS ? "iphone" : "phone"}-${lang}-${n}.png`) }); };
    await p.goto(BASE); await shot(1);
    await p.goto(`${BASE}/browse?sport=padel-tennis`); await shot(2);
    await p.goto(`${BASE}/browse?sport=cycling`);
    await p.goto(BASE + (await p.locator(".card").nth(1).getAttribute("href"))); await shot(3);
    await login(p, "priya@rekit.test", "rekit-demo-123");
    await p.goto(`${BASE}/messages`);
    await p.locator(".inbox a").first().click(); await p.waitForURL(/\/messages\//); await shot(4);
    await p.goto(`${BASE}/sell`);
    await p.fill("#title", lang === "ar" ? "مضرب بادل بابولات، استُخدم 3 أشهر" : "Babolat padel racket, used 3 months");
    await p.selectOption("#sport", "padel-tennis");
    await shot(5);
    await ctx.close();
  }
  if (!IOS) fs.copyFileSync(path.join(__dirname, "..", "public", "icons", "icon-512.png"), path.join(OUT, "icon-512.png"));
  await browser.close();
  console.log(`Store graphics written to ${OUT}`);
})();
