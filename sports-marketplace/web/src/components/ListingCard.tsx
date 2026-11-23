import Link from "next/link";
import { CONDITIONS } from "@/lib/constants";
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

export function ListingCard({ l, saved }: { l: CardListing; saved?: boolean }) {
  // Paid placements are labelled wherever they appear.
  const sponsored = !!l.sponsoredUntil && l.sponsoredUntil > new Date();
  const fresh = !sponsored && Date.now() - l.createdAt.getTime() < 12 * 3600 * 1000;
  const sold = l.status === "SOLD";
  return (
    <Link className={`card${sponsored ? " sponsored" : ""}${sold ? " is-sold" : ""}`} href={`/listing/${l.id}`}>
      <Thumb sport={l.sport} photoKey={l.photos[0]?.key} alt={l.title} count={l._count?.photos} />
      <div className="tag-row">
        {sponsored && <span className="chip chip-sponsor">Sponsored</span>}
        {fresh && !sold && <span className="chip chip-new">New</span>}
        {sold && <span className="chip chip-cond">Sold</span>}
      </div>
      {!sponsored && <FavButton listingId={l.id} initial={!!saved} />}
      <div className="body">
        <div className="pr price">{money(l.price)}{l.negotiable && <small>neg.</small>}</div>
        <div className="ti">{l.title}</div>
        <div className="meta">
          {(CONDITIONS as readonly string[]).includes(l.condition) && <span className="chip chip-cond">{l.condition}</span>}
          <span>{l.area ? `${l.area}, ` : ""}{l.city}</span>
        </div>
        <div className="meta">{sponsored ? l.seller.name : timeAgo(l.createdAt)}</div>
      </div>
    </Link>
  );
}
