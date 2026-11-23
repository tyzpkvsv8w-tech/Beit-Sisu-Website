import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ListingForm } from "@/components/ListingForm";
import { getI18n } from "@/i18n";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.sell.titleEdit };
}

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
