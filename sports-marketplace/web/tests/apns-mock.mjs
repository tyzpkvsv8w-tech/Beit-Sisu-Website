// A stand-in for Apple Push Notification service (HTTP/2, no TLS), so the iPhone app's
// notifications can be tested without Apple. Checks the ES256 auth token like Apple does.
// Usage: APNS_PUBLIC_KEY_FILE=key.pem APNS_LOG_FILE=log.json node tests/apns-mock.mjs [port]
// Device tokens starting with "dead" answer 410 Unregistered.
import http2 from "node:http2";
import fs from "node:fs";
import { createPublicKey, verify } from "node:crypto";

const PORT = Number(process.argv[2] || 12333);
const pub = createPublicKey(fs.readFileSync(process.env.APNS_PUBLIC_KEY_FILE));
const LOG = process.env.APNS_LOG_FILE;
const log = [];
fs.writeFileSync(LOG, "[]");

function checkJwt(auth) {
  const [scheme, jwt] = (auth || "").split(" ");
  if (scheme !== "bearer" || !jwt) return "MissingProviderToken";
  const [h, p, s] = jwt.split(".");
  const header = JSON.parse(Buffer.from(h, "base64url"));
  const claims = JSON.parse(Buffer.from(p, "base64url"));
  if (header.alg !== "ES256" || !header.kid || !claims.iss || !claims.iat) return "InvalidProviderToken";
  const ok = verify("sha256", Buffer.from(`${h}.${p}`), { key: pub, dsaEncoding: "ieee-p1363" }, Buffer.from(s, "base64url"));
  return ok ? null : "InvalidProviderToken";
}

http2.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const token = req.url.replace("/3/device/", "");
    const problem = checkJwt(req.headers.authorization);
    const status = problem ? 403 : token.startsWith("dead") ? 410 : 200;
    log.push({ token, status, headers: { topic: req.headers["apns-topic"], pushType: req.headers["apns-push-type"], collapseId: req.headers["apns-collapse-id"] }, body: body ? JSON.parse(body) : null });
    fs.writeFileSync(LOG, JSON.stringify(log));
    res.writeHead(status, { "content-type": "application/json", "apns-id": "test" });
    res.end(status === 200 ? "" : JSON.stringify({ reason: problem ?? "Unregistered" }));
  });
}).listen(PORT, () => console.log(`APNs mock on :${PORT}`));
