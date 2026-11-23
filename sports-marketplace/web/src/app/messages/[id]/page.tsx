import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { Thumb } from "@/components/Thumb";
import { Chat } from "@/components/Chat";

export const metadata = { title: "Chat" };
export const dynamic = "force-dynamic";

export default async function Conversation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/messages/${id}`);
  const c = await db.conversation.findUnique({
    where: { id },
    include: {
      listing: { include: { photos: { orderBy: { position: "asc" }, take: 1 } } },
      buyer: { select: { name: true } },
      seller: { select: { name: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 500 },
    },
  });
  if (!c || (c.buyerId !== user.id && c.sellerId !== user.id)) notFound();
  await db.message.updateMany({ where: { conversationId: id, senderId: { not: user.id }, readAt: null }, data: { readAt: new Date() } });
  const iAmBuyer = c.buyerId === user.id;
  const other = iAmBuyer ? c.seller.name : c.buyer.name;
  const l = c.listing;
  const offer = Math.round((l.price * 0.85) / 10) * 10;
  const quick = iAmBuyer
    ? [`Hi ${other.split(" ")[0]}, is this still available?`, `Would you take ${money(offer)}?`, "Where can we meet to see it?"]
    : ["Yes, it's still available.", "Happy to meet this week.", "Sorry, it's been sold."];
  return (
    <div className="wrap" style={{ maxWidth: 820 }}>
      <div className="chat-page">
        <header>
          <Link href="/messages" className="linkbtn" aria-label="Back to messages">←</Link>
          <Thumb sport={l.sport} photoKey={l.photos[0]?.key} alt="" />
          <div style={{ minWidth: 0 }}>
            <strong>{other}</strong>
            <div className="note" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              <Link href={`/listing/${l.id}`}>{l.title}</Link> · {money(l.price)}{l.status === "SOLD" ? " · Sold" : ""}
            </div>
          </div>
        </header>
        <Chat conversationId={c.id} quickReplies={quick}
          initial={c.messages.map((m) => ({ id: m.id, body: m.body, mine: m.senderId === user.id, at: m.createdAt.toISOString() }))} />
      </div>
    </div>
  );
}
