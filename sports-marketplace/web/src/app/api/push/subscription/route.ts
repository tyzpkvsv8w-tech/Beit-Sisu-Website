import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionId, getUser } from "@/lib/auth";
import { isAllowedEndpoint } from "@/lib/push";
import { isApnsToken } from "@/lib/apns";

// Turns notifications on or off for this device. Used by the account page, the chat
// prompt, and the service worker when the browser renews a subscription.

const subSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(20).max(200), auth: z.string().min(8).max(100) }),
});

/** Only accept calls made by our own pages (blocks other sites from changing someone's settings). */
function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return !!origin && !!host && new URL(origin).host === host;
}

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ active: false });
  const endpoint = new URL(req.url).searchParams.get("endpoint") ?? "";
  const sub = await db.pushSubscription.findUnique({ where: { endpoint } });
  return NextResponse.json({ active: !!sub && sub.userId === user.id });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const [user, sessionId] = await Promise.all([getUser(), getSessionId()]);
  if (!user || !sessionId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const json = await req.json().catch(() => null);
  // The iPhone app registers an Apple device token instead of a web push subscription.
  if (json?.kind === "apns") {
    const token = String(json.token ?? "");
    if (!isApnsToken(token)) return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    const endpoint = `apns:${token.toLowerCase()}`;
    await db.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: user.id, sessionId, kind: "apns" },
      create: { userId: user.id, sessionId, endpoint, kind: "apns", p256dh: "", auth: "" },
    });
    return NextResponse.json({ active: true });
  }
  const parsed = subSchema.safeParse(json);
  if (!parsed.success || !isAllowedEndpoint(parsed.data.endpoint)) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  // If this device was used by someone else before, it now belongs to whoever is logged in.
  await db.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: user.id, sessionId, p256dh: keys.p256dh, auth: keys.auth },
    create: { userId: user.id, sessionId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });
  return NextResponse.json({ active: true });
}

export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const endpoint = String((await req.json().catch(() => ({})))?.endpoint ?? "");
  await db.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
  return NextResponse.json({ active: false });
}
