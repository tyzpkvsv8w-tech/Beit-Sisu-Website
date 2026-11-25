import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { cardInclude } from "@/lib/queries";
import { fmt, getI18n } from "@/i18n";
import { ListingCard } from "@/components/ListingCard";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.savedPage.title };
}

export default async function Saved() {
  const user = await requireUser("/saved");
  const { m } = await getI18n();
  const t = m.savedPage;
  const favs = await db.favorite.findMany({
    where: { userId: user.id, listing: { status: { not: "REMOVED" } } },
    orderBy: { createdAt: "desc" },
    include: { listing: { include: cardInclude } },
  });
  return (
    <div className="wrap section">
      <div className="toolbar"><div><h1>{t.title}</h1><div className="count">{fmt(t.count, { n: favs.length })}</div></div></div>
      {favs.length ? <div className="grid">{favs.map((f) => <ListingCard key={f.listingId} l={f.listing} saved />)}</div> : (
        <div className="empty"><h3>{t.emptyTitle}</h3><p>{t.emptyText}</p><Link className="btn btn-primary" href="/browse">{t.browse}</Link></div>
      )}
    </div>
  );
}
