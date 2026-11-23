// iPhone app icon (1024px, no transparency, as Apple requires) and launch screen images.
// Usage: node scripts/make-ios-icons.cjs
const { chromium } = require("playwright");
const path = require("path");
const IOS = path.join(__dirname, "..", "..", "ios", "ios", "App", "App", "Assets.xcassets");

const ICON = (size) => `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@1,800&display=swap" rel="stylesheet">
<style>html,body{margin:0;width:${size}px;height:${size}px;background:#0f1a2b;display:grid;place-items:center;overflow:hidden}
.mark{width:${size * 0.62}px;height:${size * 0.48}px;background:#d9f24a;border-radius:${size * 0.05}px;transform:skewX(-8deg);display:grid;place-items:center;
font:italic 800 ${size * 0.38}px "Barlow Condensed",sans-serif;color:#1b2400;letter-spacing:-0.02em}.mark span{transform:skewX(8deg) translateY(-2%)}</style></head>
<body><div class="mark"><span>RK</span></div></body></html>`;

const SPLASH = `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@1,800&display=swap" rel="stylesheet">
<style>html,body{margin:0;width:2732px;height:2732px;background:#0f1a2b;display:grid;place-items:center}
.logo{font:italic 800 300px "Barlow Condensed",sans-serif;color:#f3f5f8}.logo b{background:#d9f24a;color:#1b2400;padding:0 30px;border-radius:24px}</style></head>
<body><div class="logo">Re<b>Kit</b></div></body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1024, height: 1024 } });
  await p.setContent(ICON(1024), { waitUntil: "networkidle" });
  // JPEG-quality capture would lose sharpness; PNG without omitBackground has an opaque background.
  await p.screenshot({ path: path.join(IOS, "AppIcon.appiconset", "AppIcon-512@2x.png") });
  const s = await b.newPage({ viewport: { width: 2732, height: 2732 } });
  await s.setContent(SPLASH, { waitUntil: "networkidle" });
  for (const f of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) await s.screenshot({ path: path.join(IOS, "Splash.imageset", f) });
  await b.close();
  console.log("iOS icon and splash written");
})();
