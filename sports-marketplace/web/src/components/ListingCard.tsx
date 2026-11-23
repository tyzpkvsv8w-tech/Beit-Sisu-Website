import Link from "next/link";
import { getI18n, fmt } from "@/i18n";
import { money, timeAgo } from "@/lib/format";
import { Thumb } from "./Thumb";
import { FavButton } from "./FavButton";

export type CardListing = {
  id: string;
  title: string;
  sport: string;
  price: number;
  negotiable: boolean;
  condition: string;
  city: string;
  area: string | null;
  status: string;
  createdAt: Date;
  sponsoredUntil: Date | null;
  photos: { key: string }[];
  seller: { name: string };
  _count?: { photos: number };
};

export async function ListingCard({ l, saved }: { l: CardListing; saved?: boolean }) {
  const { m, locale } = await getI18n();
  // Paid placements are labelled wherever they appear.
  const sponsored = !!l.sponsoredUntil && l.sponsoredUntil > new Date();
  const fresh = !sponsored && Date.now() - l.createdAt.getTime() < 12 * 3600 * 1000;
  const sold = l.status === "SOLD";
  const n = l._count?.photos ?? 0;
  return (
    <Link className={`card${sponsored ? " sponsored" : ""}${sold ? " is-sold" : ""}`} href={`/listing/${l.id}`}>
      <Thumb sport={l.sport} photoKey={l.photos[0]?.key} alt={l.title} countLabel={n > 1 ? fmt(m.common.photos, { n }) : undefined} />
      <div className="tag-row">
        {sponsored && <span className="chip chip-sponsor">{m.card.sponsored}</span>}
        {fresh && !sold && <span className="chip chip-new">{m.card.new}</span>}
        {sold && <span className="chip chip-cond">{m.card.sold}</span>}
      </div>
      {!sponsored && <FavButton listingId={l.id} initial={!!saved} />}
      <div className="body">
        <div className="pr price">{money(l.price, locale)}{l.negotiable && <small>{m.common.neg}</small>}</div>
        <div className="ti" dir="auto">{l.title}</div>
        <div className="meta">
          {m.conditions[l.condition] && <span className="chip chip-cond">{m.conditions[l.condition]}</span>}
          <span>{l.area && <><bdi>{l.area}</bdi>{locale === "ar" ? "، " : ", "}</>}{m.cities[l.city] ?? l.city}</span>
        </div>
        <div className="meta">{sponsored ? l.seller.name : timeAgo(l.createdAt, locale)}</div>
      </div>
    </Link>
  );
}
