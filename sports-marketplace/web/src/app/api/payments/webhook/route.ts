import { db } from "@/lib/db";
import { verifyStripeWebhook } from "@/lib/payments";
import { cancelOrder, markPaid } from "@/lib/campaigns";

// Stripe calls this when a checkout is paid or expires. Point the Stripe webhook here
// and subscribe to: checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.expired.
export async function POST(req: Request) {
  const raw = await req.text();
  const event = verifyStripeWebhook(raw, req.headers.get("stripe-signature"));
  if (!event) return new Response("Invalid signature", { status: 400 });
  const session = event.data.object as { id: string; payment_status?: string; payment_intent?: string };
  const order = await db.order.findUnique({ where: { providerSessionId: session.id } });
  if (!order) return new Response("ok"); // not ours, or already gone
  if ((event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") && session.payment_status === "paid") {
    await markPaid(order.id, session.payment_intent);
  } else if (event.type === "checkout.session.expired") {
    await cancelOrder(order.id);
  }
  return new Response("ok");
}
