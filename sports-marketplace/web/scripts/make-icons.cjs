// Renders the app icons from HTML, so they can be regenerated if the logo changes.
// Usage: node scripts/make-icons.cjs
const { chromium } = require("playwright");
const path = require("path");

const NAVY = "#0f1a2b", VOLT = "#d9f24a", VOLT_INK = "#1b2400";
// `pad` keeps the mark inside the safe zone for "maskable" icons, which Android crops to a circle.
const page = (size, pad, rounded) => `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@1,800&display=swap" rel="stylesheet">
<style>html,body{margin:0;width:${size}px;height:${size}px;overflow:hidden;background:transparent}
.bg{width:${size}px;height:${size}px;background:${NAVY};border-radius:${rounded ? size * 0.22 : 0}px;display:grid;place-items:center}
.mark{width:${size * (1 - pad * 2) * 0.78}px;height:${size * (1 - pad * 2) * 0.62}px;background:${VOLT};border-radius:${size * 0.05}px;transform:skewX(-8deg);
display:grid;place-items:center;font:italic 800 ${size * (1 - pad * 2) * 0.5}px "Barlow Condensed",sans-serif;color:${VOLT_INK};letter-spacing:-0.02em;line-height:1}
.mark span{transform:skewX(8deg) translateY(-2%)}</style></head>
<body><div class="bg"><div class="mark"><span>RK</span></div></div></body></html>`;

(async () => {
  const out = path.join(__dirname, "..", "public", "icons");
  const browser = await chromium.launch();
  const jobs = [
    ["icon-192.png", 192, 0.08, false],
    ["icon-512.png", 512, 0.08, false],
    ["maskable-512.png", 512, 0.18, false],
    ["apple-touch-icon.png", 180, 0.1, false],
    ["favicon-32.png", 32, 0.02, true],
  ];
  for (const [name, size, pad, rounded] of jobs) {
    const p = await browser.newPage({ viewport: { width: size, height: size } });
    await p.setContent(page(size, pad, rounded), { waitUntil: "networkidle" });
    await p.screenshot({ path: path.join(out, name), omitBackground: true });
    await p.close();
  }
  await browser.close();
  console.log("Icons written to public/icons");
})();
