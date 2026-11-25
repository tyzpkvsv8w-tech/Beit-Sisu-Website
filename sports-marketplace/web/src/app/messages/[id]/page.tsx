import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { Thumb } from "@/components/Thumb";
import { Chat } from "@/components/Chat";
import { vapidPublicKey } from "@/lib/push";
import { BlockButton } from "@/components/BlockButton";
import { unblock } from "@/app/actions/blocks";
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
  const otherId = iAmBuyer ? c.sellerId : c.buyerId;
  const blocks = await db.block.findMany({ where: { OR: [{ blockerId: user.id, blockedId: otherId }, { blockerId: otherId, blockedId: user.id }] } });
  const iBlocked = blocks.some((b) => b.blockerId === user.id);
  const theyBlocked = blocks.some((b) => b.blockerId === otherId);
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
          {!iBlocked && <BlockButton conversationId={c.id} name={other} />}
        </header>
        {iBlocked || theyBlocked ? (
          <>
            <div className="msgs">{c.messages.map((msg) => <div key={msg.id} className={`msg ${msg.senderId === user.id ? "me" : "them"}`} dir="auto">{msg.body}</div>)}</div>
            <div className="blocked-bar">
              {iBlocked ? (
                <form action={unblock} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span>{fmt(m.block.youBlocked, { name: other })}</span>
                  <input type="hidden" name="userId" value={otherId} /><input type="hidden" name="back" value={`/messages/${c.id}`} />
                  <button className="btn btn-ghost btn-sm" type="submit">{m.block.unblock}</button>
                </form>
              ) : <span>{m.block.cantReply}</span>}
            </div>
          </>
        ) : <Chat conversationId={c.id} quickReplies={quick} pushKey={vapidPublicKey()}
          initial={c.messages.map((m) => ({ id: m.id, body: m.body, mine: m.senderId === user.id, at: m.createdAt.toISOString() }))} />}
      </div>
    </div>
  );
}
