// A stand-in push service (like Google's or Apple's), so notifications can be tested
// without a real browser push service. Records what the server sends.
// Usage: node tests/push-mock.mjs [port]. Endpoint /push/gone answers 410 (subscription expired).
import http from "node:http";

const PORT = Number(process.argv[2] || 12222);
const received = [];

http.createServer((req, res) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/__log") { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify(received)); }
    if (req.method === "POST" && url.pathname.startsWith("/push/")) {
      const id = url.pathname.slice(6);
      received.push({ id, headers: req.headers, body: Buffer.concat(chunks).toString("base64"), at: Date.now() });
      res.writeHead(id === "gone" ? 410 : 201);
      return res.end();
    }
    res.writeHead(404); res.end();
  });
}).listen(PORT, () => console.log(`Push mock on :${PORT}`));
