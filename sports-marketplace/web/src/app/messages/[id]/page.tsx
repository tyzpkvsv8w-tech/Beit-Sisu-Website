import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { Thumb } from "@/components/Thumb";
import { Chat } from "@/components/Chat";
import { vapidPublicKey } from "@/lib/push";
import { fmt, getI18n } from "@/i18n";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.chat.title };
}
export const dynamic = "force-dynamic";

export default async function Conversation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/messages/${id}`);
  const { m, locale } = await getI18n();
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
  const quick = (iAmBuyer ? m.chat.buyerQuick : m.chat.sellerQuick).map((q) => fmt(q, { name: other.split(" ")[0], price: money(offer, locale) }));
  return (
    <div className="wrap" style={{ maxWidth: 820 }}>
      <div className="chat-page">
        <header>
          <Link href="/messages" className="linkbtn" aria-label={m.chat.backLabel}>{m.common.back}</Link>
          <Thumb sport={l.sport} photoKey={l.photos[0]?.key} alt="" />
          <div style={{ minWidth: 0 }}>
            <strong dir="auto">{other}</strong>
            <div className="note" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              <Link href={`/listing/${l.id}`}><bdi>{l.title}</bdi></Link> · {money(l.price, locale)}{l.status === "SOLD" ? m.chat.soldSuffix : ""}
            </div>
          </div>
        </header>
        <Chat conversationId={c.id} quickReplies={quick} pushKey={vapidPublicKey()}
          initial={c.messages.map((m) => ({ id: m.id, body: m.body, mine: m.senderId === user.id, at: m.createdAt.toISOString() }))} />
      </div>
    </div>
  );
}
