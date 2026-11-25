import "server-only";
import http2 from "node:http2";
import { createPrivateKey, sign } from "node:crypto";

// Apple Push Notification service, for the iPhone app (web push doesn't work inside native apps).
// Token-based auth with a .p8 key from developer.apple.com > Keys. Set:
//   APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY (the .p8 file's contents), IOS_BUNDLE_ID,
//   APNS_SANDBOX=1 for development builds from Xcode (TestFlight and App Store use production).

export function apnsConfigured() {
  return !!(process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID && process.env.APNS_PRIVATE_KEY);
}

const allowLocal = () => process.env.NODE_ENV !== "production" || process.env.ALLOW_DEV_PUSH === "1";
function host() {
  if (process.env.APNS_HOST && allowLocal()) return process.env.APNS_HOST; // test stand-in only
  return process.env.APNS_SANDBOX === "1" ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com";
}

let cached: { token: string; at: number } | null = null;
/** Apple's auth token: an ES256-signed JWT, reused for up to 50 minutes (Apple allows 20-60). */
function authToken() {
  if (cached && Date.now() - cached.at < 50 * 60e3) return cached.token;
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "ES256", kid: process.env.APNS_KEY_ID })}.${b64({ iss: process.env.APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) })}`;
  const key = createPrivateKey(process.env.APNS_PRIVATE_KEY!.replace(/\\n/g, "\n"));
  const sig = sign("sha256", Buffer.from(unsigned), { key, dsaEncoding: "ieee-p1363" }).toString("base64url");
  cached = { token: `${unsigned}.${sig}`, at: Date.now() };
  return cached.token;
}

export const isApnsToken = (t: string) => /^[0-9a-f]{64,200}$/i.test(t);

/** Sends one notification. Returns Apple's status code and reason (e.g. 410 "Unregistered"). */
export function sendApns(deviceToken: string, payload: object, collapseId: string): Promise<{ status: number; reason?: string }> {
  return new Promise((resolve) => {
    const session = http2.connect(host());
    const done = (r: { status: number; reason?: string }) => { session.close(); resolve(r); };
    session.on("error", (e) => done({ status: 0, reason: e.message }));
    const req = session.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${authToken()}`,
      "apns-topic": process.env.IOS_BUNDLE_ID || "ae.rekit.app",
      "apns-push-type": "alert",
      "apns-priority": "10",
      "apns-expiration": String(Math.floor(Date.now() / 1000) + 24 * 3600),
      "apns-collapse-id": collapseId.slice(0, 64),
      "content-type": "application/json",
    });
    let status = 0;
    let body = "";
    req.setTimeout(10_000, () => { req.close(); done({ status: 0, reason: "timeout" }); });
    req.on("response", (h) => { status = Number(h[":status"]); });
    req.on("data", (c) => { body += c; });
    req.on("end", () => {
      let reason: string | undefined;
      try { reason = body ? JSON.parse(body).reason : undefined; } catch { reason = body; }
      done({ status, reason });
    });
    req.on("error", (e) => done({ status: 0, reason: e.message }));
    req.end(JSON.stringify(payload));
  });
}
