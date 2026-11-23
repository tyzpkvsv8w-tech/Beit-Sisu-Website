import "server-only";
import webpush from "web-push";
import { db } from "./db";

// Web Push with VAPID keys. Generate a key pair once with `npm run vapid` and set:
// VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT (mailto: or https: contact).
// Messages are encrypted for each device, so push services (Google, Apple, Mozilla) can't read them.

export function vapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || null;
}

let configured = false;
function configure() {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:support@example.com", pub, priv);
  configured = true;
  return true;
}

// We only ever send to the browser makers' push services. A subscription is a URL supplied by
// the browser, so without this check someone could make our server send requests anywhere.
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];
const allowLocal = () => process.env.NODE_ENV !== "production" || process.env.ALLOW_DEV_PUSH === "1";

export function isAllowedEndpoint(endpoint: string) {
  let url: URL;
  try { url = new URL(endpoint); } catch { return false; }
  if (url.protocol === "https:" && PUSH_HOSTS.some((h) => h.test(url.hostname))) return true;
  // Local test push service (tests/push-mock.mjs), never in production.
  return allowLocal() && url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
}

export type PushPayload = { title: string; body: string; url: string; tag: string; lang: string; dir: string };

/** Sends to every device the user has turned notifications on for. Dead subscriptions are removed. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!configure()) return 0;
  const subs = await db.pushSubscription.findMany({ where: { userId } });
  let sent = 0;
  await Promise.all(subs.map(async (s) => {
    if (!isAllowedEndpoint(s.endpoint)) { await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {}); return; }
    try {
      // web-push encrypts the message and signs the request; we send it ourselves with fetch.
      const req = webpush.generateRequestDetails({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), {
        TTL: 24 * 3600, urgency: "high", topic: payload.tag.slice(0, 32).replace(/[^A-Za-z0-9_-]/g, ""),
      });
      const res = await fetch(req.endpoint, {
        method: req.method, headers: req.headers as Record<string, string>, body: req.body ? new Uint8Array(req.body) : undefined,
        redirect: "error", signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) {
        sent++;
        await db.pushSubscription.update({ where: { id: s.id }, data: { lastSentAt: new Date() } }).catch(() => {});
      } else if (res.status === 404 || res.status === 410) {
        // The browser has unsubscribed or the subscription expired.
        await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
      } else {
        console.error("Push failed", res.status, await res.text().catch(() => ""));
      }
    } catch (e) {
      console.error("Push failed", (e as Error).message);
    }
  }));
  return sent;
}
