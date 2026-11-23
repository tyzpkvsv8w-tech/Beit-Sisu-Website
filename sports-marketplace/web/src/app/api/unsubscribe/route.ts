import { db } from "@/lib/db";
import { verifySignature } from "@/lib/app";

// One-click unsubscribe (RFC 8058): mail apps POST here from their own "Unsubscribe" button.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("u") ?? "";
  if (!verifySignature(`unsub:${userId}`, url.searchParams.get("s") ?? "")) return new Response("Invalid link", { status: 400 });
  await db.user.updateMany({ where: { id: userId }, data: { notifyMessages: false } });
  return new Response("Unsubscribed", { status: 200 });
}
