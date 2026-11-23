import "server-only";
import { en, type Messages } from "@/i18n/en";
import { ar } from "@/i18n/ar";
import { fmt } from "@/i18n/fmt";
import type { Mail } from "./email";

const dict = (locale: string): Messages => (locale === "ar" ? ar : en);

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Fills placeholders, escaping the values (names, titles and messages come from users). */
const fmtHtml = (s: string, vars: Record<string, string>) =>
  esc(s).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? `<strong>${esc(vars[k])}</strong>` : `{${k}}`));

type Part = { html: string; text: string };

/** One layout for every email: works in light and dark mail apps, and right-to-left for Arabic. */
function layout(locale: string, parts: Part[], button: { label: string; url: string }, footerExtra?: Part): Pick<Mail, "html" | "text"> {
  const m = dict(locale);
  const dir = m.dir;
  const align = dir === "rtl" ? "right" : "left";
  const font = dir === "rtl" ? "Tahoma, 'Segoe UI', Arial, sans-serif" : "-apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
  const html = `<!doctype html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light dark"></head>
<body style="margin:0;padding:0;background:#f3f5f8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f8;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:10px;border:1px solid #d5dbe4;" dir="${dir}">
<tr><td style="padding:22px 26px 0;text-align:${align};" dir="ltr"><span style="font:italic 800 26px 'Arial Narrow',Arial,sans-serif;color:#0f1a2b;">Re<span style="background:#d9f24a;color:#1b2400;padding:0 5px;border-radius:3px;">Kit</span></span></td></tr>
<tr><td style="padding:18px 26px 6px;font:15px/1.6 ${font};color:#0f1a2b;text-align:${align};">
${parts.map((p) => `<p style="margin:0 0 14px;">${p.html}</p>`).join("\n")}
<p style="margin:22px 0;"><a href="${esc(button.url)}" style="display:inline-block;background:#1747c9;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:8px;">${esc(button.label)}</a></p>
<p style="margin:0 0 6px;font-size:12px;color:#5a6679;">${esc(m.email.linkFallback)}</p>
<p style="margin:0 0 10px;font-size:12px;word-break:break-all;" dir="ltr"><a href="${esc(button.url)}" style="color:#1747c9;">${esc(button.url)}</a></p>
</td></tr>
<tr><td style="padding:14px 26px 22px;border-top:1px solid #e8ecf2;font:12px/1.5 ${font};color:#5a6679;text-align:${align};">${footerExtra ? footerExtra.html + "<br>" : ""}${esc(m.email.footer)}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [...parts.map((p) => p.text), "", `${button.label}: ${button.url}`, "", ...(footerExtra ? [footerExtra.text] : []), m.email.footer].join("\n\n");
  return { html, text };
}

const para = (s: string, vars: Record<string, string> = {}): Part => ({ html: fmtHtml(s, vars), text: fmt(s, vars) });

export function resetPasswordEmail(o: { to: string; name: string; locale: string; url: string }): Mail {
  const m = dict(o.locale).email;
  return {
    to: o.to,
    subject: m.resetSubject,
    ...layout(o.locale, [para(m.greeting, { name: o.name }), para(m.resetIntro), para(m.resetExpiry)], { label: m.resetButton, url: o.url }),
  };
}

export function verifyEmail(o: { to: string; name: string; locale: string; url: string }): Mail {
  const m = dict(o.locale).email;
  return {
    to: o.to,
    subject: m.verifySubject,
    ...layout(o.locale, [para(m.greeting, { name: o.name }), para(m.verifyIntro), para(m.verifyExpiry)], { label: m.verifyButton, url: o.url }),
  };
}

export function newMessageEmail(o: {
  to: string; name: string; locale: string; sender: string; title: string; preview: string; url: string; unsubscribeUrl: string; oneClickUrl: string;
}): Mail {
  const m = dict(o.locale).email;
  const short = o.title.length > 60 ? o.title.slice(0, 57) + "…" : o.title;
  const preview = o.preview.length > 300 ? o.preview.slice(0, 297) + "…" : o.preview;
  const quote: Part = {
    html: `<span dir="auto" style="display:block;border-${dict(o.locale).dir === "rtl" ? "right" : "left"}:3px solid #d9f24a;padding:4px 12px;color:#334155;white-space:pre-line;">${esc(preview)}</span>`,
    text: preview.split("\n").map((l) => `> ${l}`).join("\n"),
  };
  return {
    to: o.to,
    subject: fmt(m.messageSubject, { sender: o.sender, title: short }),
    ...layout(
      o.locale,
      [para(m.greeting, { name: o.name }), para(m.messageIntro, { sender: o.sender, title: o.title }), quote, para(m.messageNote)],
      { label: m.messageButton, url: o.url },
      { html: `<a href="${esc(o.unsubscribeUrl)}" style="color:#5a6679;">${esc(m.unsubscribe)}</a>`, text: `${m.unsubscribe}: ${o.unsubscribeUrl}` },
    ),
    // Lets mail apps show their own one-click "Unsubscribe" button (RFC 8058).
    headers: { "List-Unsubscribe": `<${o.oneClickUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  };
}
