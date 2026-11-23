import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money, timeAgo } from "@/lib/format";
import { Thumb } from "@/components/Thumb";
import { ProfileForm } from "@/components/SmallForms";
import { setListingStatus } from "@/app/actions/listings";
import { logout } from "@/app/actions/auth";
import { ConfirmDelete } from "@/components/ConfirmDelete";

export const metadata = { title: "My account" };

export default async function Account({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const me = await requireUser("/account");
  const sp = await searchParams;
  const [user, listings] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: me.id } }),
    db.listing.findMany({
      where: { sellerId: me.id, status: { not: "REMOVED" } },
      orderBy: { createdAt: "desc" },
      include: { photos: { orderBy: { position: "asc" }, take: 1 }, _count: { select: { conversations: true, favorites: true } } },
    }),
  ]);
  return (
    <div className="wrap section" style={{ display: "grid", gap: 22 }}>
      <div className="toolbar">
        <div><h1>My ads</h1><div className="count">{listings.length} {listings.length === 1 ? "ad" : "ads"}</div></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {me.role === "ADMIN" && <Link className="btn btn-ghost" href="/admin">Admin</Link>}
          <Link className="btn btn-ghost m-only" href="/saved">Saved</Link>
          <Link className="btn btn-primary" href="/sell">+ Post an ad</Link>
        </div>
      </div>
      {sp.deleted && <div className="banner-ok">Ad deleted.</div>}
      {listings.length ? (
        <div className="mylist">
          {listings.map((l) => (
            <div className="myrow" key={l.id}>
              <Thumb sport={l.sport} photoKey={l.photos[0]?.key} alt="" />
              <div style={{ minWidth: 0 }}>
                <Link className="t" href={`/listing/${l.id}`}>{l.title}</Link>
                <div className="s">
                  <span className={`status-pill status-${l.status}`}>{l.status === "ACTIVE" ? "Live" : "Sold"}</span>
                  <strong className="price">{money(l.price)}</strong>
                  <span>{timeAgo(l.createdAt)}</span>
                  <span>{l.views} views · {l._count.favorites} saves · {l._count.conversations} chats</span>
                </div>
              </div>
              <div className="acts">
                <Link className="btn btn-ghost btn-sm" href={`/listing/${l.id}/edit`}>Edit</Link>
                <form action={setListingStatus}>
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="status" value={l.status === "SOLD" ? "ACTIVE" : "SOLD"} />
                  <button className="btn btn-ghost btn-sm" type="submit">{l.status === "SOLD" ? "Relist" : "Mark sold"}</button>
                </form>
                <ConfirmDelete id={l.id} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty"><h3>No ads yet</h3><p>Got gear you don&apos;t use? Post it in two minutes.</p><Link className="btn btn-primary" href="/sell">Post an ad, free</Link></div>
      )}
      <div style={{ maxWidth: 620 }}><ProfileForm user={user} /></div>
      <form action={logout}><button className="btn btn-ghost" type="submit">Log out</button></form>
    </div>
  );
}
