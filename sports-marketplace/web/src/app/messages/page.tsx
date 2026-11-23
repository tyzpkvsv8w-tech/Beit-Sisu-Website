import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { Thumb } from "@/components/Thumb";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function Inbox() {
  const user = await requireUser("/messages");
  const convos = await db.conversation.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }], messages: { some: {} } },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: { select: { title: true, sport: true, photos: { orderBy: { position: "asc" }, take: 1 } } },
      buyer: { select: { name: true } },
      seller: { select: { name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { readAt: null, senderId: { not: user.id } } } } },
    },
  });
  return (
    <div className="wrap section" style={{ maxWidth: 820 }}>
      <div className="toolbar"><div><h1>Messages</h1></div></div>
      {convos.length ? (
        <div className="inbox">
          {convos.map((c) => {
            const other = c.buyerId === user.id ? c.seller.name : c.buyer.name;
            const last = c.messages[0];
            return (
              <Link key={c.id} href={`/messages/${c.id}`} className={c._count.messages ? "unread" : ""}>
                <Thumb sport={c.listing.sport} photoKey={c.listing.photos[0]?.key} alt="" />
                <div style={{ minWidth: 0 }}>
                  <div className="who">{other} {c._count.messages > 0 && <span className="badge">{c._count.messages}</span>}</div>
                  <div className="last">{c.listing.title}</div>
                  <div className="last">{last ? `${last.senderId === user.id ? "You: " : ""}${last.body}` : ""}</div>
                </div>
                <div className="when">{last && timeAgo(last.createdAt)}</div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty"><h3>No messages yet</h3><p>When you chat with a buyer or seller, it shows up here.</p><Link className="btn btn-primary" href="/browse">Browse listings</Link></div>
      )}
    </div>
  );
}
