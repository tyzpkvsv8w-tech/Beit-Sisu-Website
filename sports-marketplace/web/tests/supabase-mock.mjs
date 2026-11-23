// A stand-in for the parts of Supabase the app uses (Auth SMS codes and Storage),
// so the "supabase" drivers can be tested without a real project.
// Usage: node tests/supabase-mock.mjs [port]   Every SMS code is 123456.
import http from "node:http";

const PORT = Number(process.argv[2] || 54321);
const ANON = "test-anon-key", SERVICE = "test-service-key", CODE = "123456";
const sent = new Set();
const objects = new Map();
const log = [];

const body = (req) => new Promise((r) => { const c = []; req.on("data", (d) => c.push(d)); req.on("end", () => r(Buffer.concat(c))); });
const json = (res, status, data) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const key = req.headers.apikey;
  const raw = await body(req);
  log.push({ method: req.method, path: url.pathname, key: key === SERVICE ? "service" : key === ANON ? "anon" : "none" });

  if (url.pathname === "/__log") return json(res, 200, { log, objects: [...objects.keys()] });

  if (req.method === "POST" && url.pathname === "/auth/v1/otp") {
    if (key !== ANON) return json(res, 401, { msg: "Invalid API key" });
    const { phone } = JSON.parse(raw);
    if (!/^\+\d{10,15}$/.test(phone)) return json(res, 400, { code: 400, error_code: "validation_failed", msg: "Invalid phone" });
    sent.add(phone);
    return json(res, 200, {});
  }
  if (req.method === "POST" && url.pathname === "/auth/v1/verify") {
    if (key !== ANON) return json(res, 401, { msg: "Invalid API key" });
    const { type, phone, token } = JSON.parse(raw);
    if (type !== "sms" || !sent.has(phone) || token !== CODE) return json(res, 403, { code: 403, error_code: "otp_expired", msg: "Token has expired or is invalid" });
    sent.delete(phone);
    return json(res, 200, { access_token: "x", token_type: "bearer", user: { id: "u1", phone: phone.slice(1) } });
  }
  let m;
  if (req.method === "POST" && (m = url.pathname.match(/^\/storage\/v1\/object\/([^/]+)\/(.+)$/))) {
    if (key !== SERVICE || req.headers.authorization !== `Bearer ${SERVICE}`) return json(res, 403, { message: "Unauthorized" });
    objects.set(`${m[1]}/${m[2]}`, { data: raw, type: req.headers["content-type"] });
    return json(res, 200, { Key: `${m[1]}/${m[2]}` });
  }
  if (req.method === "DELETE" && (m = url.pathname.match(/^\/storage\/v1\/object\/([^/]+)$/))) {
    if (key !== SERVICE) return json(res, 403, { message: "Unauthorized" });
    for (const p of JSON.parse(raw).prefixes) objects.delete(`${m[1]}/${p}`);
    return json(res, 200, []);
  }
  if (req.method === "GET" && (m = url.pathname.match(/^\/storage\/v1\/object\/public\/(.+)$/))) {
    const o = objects.get(m[1]);
    if (!o) return json(res, 404, { message: "Object not found" });
    res.writeHead(200, { "Content-Type": o.type });
    return res.end(o.data);
  }
  json(res, 404, { message: "not found" });
}).listen(PORT, () => console.log(`Supabase mock on :${PORT}`));
