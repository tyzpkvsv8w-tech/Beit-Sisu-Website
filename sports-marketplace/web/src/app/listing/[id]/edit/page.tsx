import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ListingForm } from "@/components/ListingForm";

export const metadata = { title: "Edit ad" };

export default async function EditListing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/listing/${id}/edit`);
  const l = await db.listing.findUnique({ where: { id }, include: { photos: { orderBy: { position: "asc" } } } });
  if (!l || l.sellerId !== user.id || l.status === "REMOVED") notFound();
  return (
    <div className="wrap" style={{ maxWidth: 820, paddingBlock: 24 }}>
      <ListingForm existing={{ ...l, photos: l.photos.map((p) => ({ id: p.id, key: p.key })) }} />
    </div>
  );
}
