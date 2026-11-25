import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { paymentDriver } from "@/lib/payments";
import { aed } from "@/lib/pricing";
import { devCancel, devPay } from "@/app/actions/ads";

export const metadata = { title: "Test payment" };

// Stands in for Stripe's checkout page while testing. Refused when PAYMENT_DRIVER=stripe or in production.
export default async function DevPay({ params }: { params: Promise<{ orderId: string }> }) {
  if (paymentDriver() !== "dev") notFound();
  const { orderId } = await params;
  const me = await requireUser(`/pay/dev/${orderId}`);
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== me.id || order.status !== "PENDING") notFound();
  return (
    <div className="wrap auth" dir="ltr" lang="en">
      <div className="form-card">
        <div className="legal-draft">Test mode. No real payment is taken.</div>
        <h1>Pay {aed(order.total)}</h1>
        <p style={{ margin: 0 }}>{order.description}</p>
        <form action={devPay}><input type="hidden" name="orderId" value={order.id} /><button className="btn btn-primary btn-block" type="submit">Pay (test)</button></form>
        <form action={devCancel}><input type="hidden" name="orderId" value={order.id} /><button className="btn btn-ghost btn-block" type="submit">Cancel</button></form>
      </div>
    </div>
  );
}
