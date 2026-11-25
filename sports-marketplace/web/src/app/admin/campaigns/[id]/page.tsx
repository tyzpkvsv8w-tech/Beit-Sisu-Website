import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { uaeDate } from "@/lib/pricing";
import { AdminCampaignForm } from "@/components/AdminCampaignForm";

export const metadata = { title: "Edit campaign" };

export default async function EditCampaign({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const c = await db.adCampaign.findUnique({ where: { id: (await params).id } });
  if (!c) notFound();
  return (
    <div className="wrap section" style={{ maxWidth: 760, display: "grid", gap: 14 }} dir="ltr">
      <Link href="/admin" className="note">← Admin</Link>
      <h1 style={{ fontSize: 36, textTransform: "uppercase" }}>Edit campaign</h1>
      <AdminCampaignForm c={c} today={uaeDate()} />
    </div>
  );
}
