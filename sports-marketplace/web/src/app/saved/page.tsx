import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { cardInclude } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";

export const metadata = { title: "Saved" };

export default async function Saved() {
  const user = await requireUser("/saved");
  const favs = await db.favorite.findMany({
    where: { userId: user.id, listing: { status: { not: "REMOVED" } } },
    orderBy: { createdAt: "desc" },
    include: { listing: { include: cardInclude } },
  });
  return (
    <div className="wrap section">
      <div className="toolbar"><div><h1>Saved</h1><div className="count">{favs.length} saved {favs.length === 1 ? "item" : "items"}</div></div></div>
      {favs.length ? <div className="grid">{favs.map((f) => <ListingCard key={f.listingId} l={f.listing} saved />)}</div> : (
        <div className="empty"><h3>No saved items yet</h3><p>Tap the heart on any listing to keep it here.</p><Link className="btn btn-primary" href="/browse">Browse listings</Link></div>
      )}
    </div>
  );
}
