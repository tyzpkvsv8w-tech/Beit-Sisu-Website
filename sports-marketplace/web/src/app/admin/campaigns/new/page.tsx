import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { uaeDate } from "@/lib/pricing";
import { AdminCampaignForm } from "@/components/AdminCampaignForm";

export const metadata = { title: "New campaign" };

export default async function NewCampaign() {
  await requireAdmin();
  return (
    <div className="wrap section" style={{ maxWidth: 760, display: "grid", gap: 14 }} dir="ltr">
      <Link href="/admin" className="note">← Admin</Link>
      <h1 style={{ fontSize: 36, textTransform: "uppercase" }}>New campaign</h1>
      <AdminCampaignForm today={uaeDate()} />
    </div>
  );
}
