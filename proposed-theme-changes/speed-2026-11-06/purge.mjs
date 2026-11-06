import { PurgeCSS } from 'purgecss';
import fs from 'fs';
const res = await new PurgeCSS().purge({
  content: ['content/*'],
  css: ['bootstrap.min.orig.css'],
  rejected: true,
  safelist: {
    standard: [/^show$/, /^showing$/, /^hiding$/, /^collapse$/, /^collapsing$/, /^collapsed$/, /^collapse-horizontal$/, /^fade$/, /^active$/, /^disabled$/, /^was-validated$/],
    greedy: [/accordion/, /navbar/],
    deep: [/accordion/, /navbar/, /collapse/],
  },
});
const css = res[0].css;
const header = '/* Beit Sisu, 6 Nov 2026: Bootstrap 5.2.3 trimmed to the rules this site uses (speed). Full original: bootstrap.css in this folder. */\n';
fs.writeFileSync('bootstrap.min.purged.css', header + css);
fs.writeFileSync('rejected.txt', (res[0].rejected || []).join('\n'));
console.log('original', fs.statSync('bootstrap.min.orig.css').size, 'purged', Buffer.byteLength(header + css), 'rejected selectors', (res[0].rejected || []).length);
