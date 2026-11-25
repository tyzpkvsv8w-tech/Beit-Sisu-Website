import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

// Polled by the chat screen every few seconds for new messages.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = await params;
  const convo = await db.conversation.findUnique({ where: { id } });
  if (!convo || (convo.buyerId !== user.id && convo.sellerId !== user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const after = new URL(req.url).searchParams.get("after");
  const messages = await db.message.findMany({
    where: { conversationId: id, ...(after ? { createdAt: { gt: new Date(after) } } : {}) },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  await db.message.updateMany({
    where: { conversationId: id, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({
    messages: messages.map((m) => ({ id: m.id, body: m.body, mine: m.senderId === user.id, at: m.createdAt.toISOString() })),
  });
}
