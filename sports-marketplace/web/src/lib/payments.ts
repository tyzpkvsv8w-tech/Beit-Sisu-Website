import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// PAYMENT_DRIVER=dev: a pretend checkout page on this site (refused in production).
// PAYMENT_DRIVER=stripe: Stripe Checkout. Card details never touch our servers.
export function paymentDriver(): "dev" | "stripe" {
  const d = process.env.PAYMENT_DRIVER === "stripe" ? "stripe" : "dev";
  if (d === "dev" && process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_PAYMENTS !== "1") {
    throw new Error("PAYMENT_DRIVER=dev is not allowed in production. Set PAYMENT_DRIVER=stripe.");
  }
  return d;
}

const base = () => (process.env.STRIPE_API_BASE || "https://api.stripe.com").replace(/\/$/, "");

async function stripe(path: string, method: "GET" | "POST", params?: Record<string, string>) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  const res = await fetch(base() + path, {
    method,
    headers: { Authorization: `Bearer ${key}`, ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: params ? new URLSearchParams(params).toString() : undefined,
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${body?.error?.message ?? "request failed"}`);
  return body;
}

export type CheckoutInput = {
  orderId: string;
  lines: { name: string; amount: number }[]; // amounts in fils
  customerEmail?: string | null;
  successUrl: string;
  cancelUrl: string;
  expiresInMinutes: number;
};

export async function createCheckout(i: CheckoutInput): Promise<{ sessionId: string; url: string }> {
  if (paymentDriver() === "dev") return { sessionId: `dev_${i.orderId}`, url: `/pay/dev/${i.orderId}` };
  const p: Record<string, string> = {
    mode: "payment",
    client_reference_id: i.orderId,
    "metadata[orderId]": i.orderId,
    "payment_intent_data[metadata][orderId]": i.orderId,
    success_url: i.successUrl,
    cancel_url: i.cancelUrl,
    expires_at: String(Math.floor(Date.now() / 1000) + Math.max(30, i.expiresInMinutes) * 60),
  };
  if (i.customerEmail) p.customer_email = i.customerEmail;
  i.lines.forEach((l, n) => {
    p[`line_items[${n}][quantity]`] = "1";
    p[`line_items[${n}][price_data][currency]`] = "aed";
    p[`line_items[${n}][price_data][unit_amount]`] = String(l.amount);
    p[`line_items[${n}][price_data][product_data][name]`] = l.name;
  });
  const s = await stripe("/v1/checkout/sessions", "POST", p);
  return { sessionId: s.id, url: s.url };
}

/** Asks Stripe directly whether a checkout was paid (in case the webhook is late). */
export async function checkoutStatus(sessionId: string): Promise<{ paid: boolean; expired: boolean; paymentId?: string }> {
  if (paymentDriver() === "dev") return { paid: false, expired: false };
  const s = await stripe(`/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, "GET");
  return { paid: s.payment_status === "paid", expired: s.status === "expired", paymentId: s.payment_intent ?? undefined };
}

export async function expireCheckout(sessionId: string) {
  if (paymentDriver() === "dev") return;
  await stripe(`/v1/checkout/sessions/${encodeURIComponent(sessionId)}/expire`, "POST", {}).catch(() => {});
}

export async function refundPayment(paymentId: string) {
  if (paymentDriver() === "dev") return;
  await stripe("/v1/refunds", "POST", { payment_intent: paymentId });
}

/** Checks the Stripe-Signature header, so only Stripe can mark orders as paid. */
export function verifyStripeWebhook(rawBody: string, header: string | null, toleranceSec = 300) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return null;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=", 2)).filter((kv) => kv.length === 2)) as Record<string, string>;
  const signatures = header.split(",").filter((kv) => kv.startsWith("v1=")).map((kv) => kv.slice(3));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSec) return null;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex"));
  const ok = signatures.some((sig) => { const b = Buffer.from(sig); return b.length === expected.length && timingSafeEqual(b, expected); });
  if (!ok) return null;
  try { return JSON.parse(rawBody) as { type: string; data: { object: Record<string, unknown> } }; } catch { return null; }
}
