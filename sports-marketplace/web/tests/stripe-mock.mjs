// A stand-in for the parts of Stripe the app uses: Checkout Sessions, the hosted payment
// page, signed webhooks and refunds. Lets PAYMENT_DRIVER=stripe be tested without an account.
// Usage: WEBHOOK_URL=http://localhost:3000/api/payments/webhook node tests/stripe-mock.mjs [port]
import http from "node:http";
import { createHmac } from "node:crypto";

const PORT = Number(process.argv[2] || 12111);
const KEY = "sk_test_mock", WEBHOOK_SECRET = "whsec_mock";
const WEBHOOK_URL = process.env.WEBHOOK_URL || "http://localhost:3000/api/payments/webhook";
const sessions = new Map();
const refunds = [];
const log = [];
let n = 0;

const body = (req) => new Promise((r) => { const c = []; req.on("data", (d) => c.push(d)); req.on("end", () => r(Buffer.concat(c).toString())); });
const json = (res, status, data) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); };
const authed = (req) => req.headers.authorization === `Bearer ${KEY}`;

async function webhook(type, session) {
  const payload = JSON.stringify({ id: `evt_${++n}`, type, data: { object: session } });
  const t = Math.floor(Date.now() / 1000);
  const sig = createHmac("sha256", WEBHOOK_SECRET).update(`${t}.${payload}`).digest("hex");
  const res = await fetch(WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json", "Stripe-Signature": `t=${t},v1=${sig}` }, body: payload });
  log.push({ webhook: type, status: res.status });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const raw = await body(req);
  log.push({ method: req.method, path: url.pathname });
  let m;

  if (url.pathname === "/__log") return json(res, 200, { log, refunds, sessions: [...sessions.values()] });

  if (req.method === "POST" && url.pathname === "/v1/checkout/sessions") {
    if (!authed(req)) return json(res, 401, { error: { message: "Invalid API Key" } });
    const p = new URLSearchParams(raw);
    let total = 0;
    for (let i = 0; p.has(`line_items[${i}][price_data][unit_amount]`); i++) {
      if (p.get(`line_items[${i}][price_data][currency]`) !== "aed") return json(res, 400, { error: { message: "currency must be aed" } });
      total += Number(p.get(`line_items[${i}][price_data][unit_amount]`)) * Number(p.get(`line_items[${i}][quantity]`));
    }
    const id = `cs_test_${++n}`;
    const s = { id, object: "checkout.session", url: `http://localhost:${PORT}/checkout/${id}`, status: "open", payment_status: "unpaid", amount_total: total,
      currency: "aed", client_reference_id: p.get("client_reference_id"), metadata: { orderId: p.get("metadata[orderId]") },
      success_url: p.get("success_url"), cancel_url: p.get("cancel_url"), payment_intent: null };
    sessions.set(id, s);
    return json(res, 200, s);
  }
  if ((m = url.pathname.match(/^\/v1\/checkout\/sessions\/([^/]+)$/)) && req.method === "GET") {
    if (!authed(req)) return json(res, 401, { error: { message: "Invalid API Key" } });
    const s = sessions.get(m[1]);
    return s ? json(res, 200, s) : json(res, 404, { error: { message: "No such session" } });
  }
  if ((m = url.pathname.match(/^\/v1\/checkout\/sessions\/([^/]+)\/expire$/)) && req.method === "POST") {
    const s = sessions.get(m[1]);
    if (!s) return json(res, 404, { error: { message: "No such session" } });
    if (s.status !== "open") return json(res, 400, { error: { message: "Session is not open" } });
    s.status = "expired";
    return json(res, 200, s);
  }
  if (req.method === "POST" && url.pathname === "/v1/refunds") {
    if (!authed(req)) return json(res, 401, { error: { message: "Invalid API Key" } });
    const pi = new URLSearchParams(raw).get("payment_intent");
    refunds.push(pi);
    return json(res, 200, { id: `re_${++n}`, payment_intent: pi, status: "succeeded" });
  }
  // Hosted payment page (same button labels as the app's test page, so one e2e test covers both).
  if ((m = url.pathname.match(/^\/checkout\/([^/]+)$/)) && req.method === "GET") {
    const s = sessions.get(m[1]);
    if (!s || s.status !== "open") { res.writeHead(404); return res.end("Session not open"); }
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end(`<!doctype html><title>Mock Stripe Checkout</title><h1>Pay AED ${(s.amount_total / 100).toLocaleString("en-US")}</h1>
      <form method="post" action="/checkout/${s.id}/pay"><button type="submit">Pay (test)</button></form>
      <a href="${s.cancel_url}"><button type="button">Cancel</button></a>`);
  }
  if ((m = url.pathname.match(/^\/checkout\/([^/]+)\/pay$/)) && req.method === "POST") {
    const s = sessions.get(m[1]);
    if (!s || s.status !== "open") { res.writeHead(404); return res.end("Session not open"); }
    Object.assign(s, { status: "complete", payment_status: "paid", payment_intent: `pi_${s.id}` });
    await webhook("checkout.session.completed", s);
    res.writeHead(303, { Location: s.success_url });
    return res.end();
  }
  json(res, 404, { error: { message: "not found" } });
}).listen(PORT, () => console.log(`Stripe mock on :${PORT}`));
