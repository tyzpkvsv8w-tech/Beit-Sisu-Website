import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { getI18n } from "@/i18n";
import { Thumb } from "@/components/Thumb";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.chat.title };
}
export const dynamic = "force-dynamic";

export default async function Inbox() {
  const user = await requireUser("/messages");
  const { m, locale } = await getI18n();
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
      <div className="toolbar"><div><h1>{m.chat.title}</h1></div></div>
      {convos.length ? (
        <div className="inbox">
          {convos.map((c) => {
            const other = c.buyerId === user.id ? c.seller.name : c.buyer.name;
            const last = c.messages[0];
            return (
              <Link key={c.id} href={`/messages/${c.id}`} className={c._count.messages ? "unread" : ""}>
                <Thumb sport={c.listing.sport} photoKey={c.listing.photos[0]?.key} alt="" />
                <div style={{ minWidth: 0 }}>
                  <div className="who"><bdi>{other}</bdi> {c._count.messages > 0 && <span className="badge">{c._count.messages}</span>}</div>
                  <div className="last" dir="auto">{c.listing.title}</div>
                  <div className="last">{last ? <>{last.senderId === user.id ? m.chat.you : ""}<bdi>{last.body}</bdi></> : ""}</div>
                </div>
                <div className="when">{last && timeAgo(last.createdAt, locale)}</div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty"><h3>{m.chat.emptyTitle}</h3><p>{m.chat.emptyText}</p><Link className="btn btn-primary" href="/browse">{m.savedPage.browse}</Link></div>
      )}
    </div>
  );
}
