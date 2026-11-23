"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function resolveReport(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const removeListing = form.get("remove") === "1";
  const report = await db.report.update({ where: { id }, data: { resolved: true } });
  if (removeListing) {
    await db.listing.update({ where: { id: report.listingId }, data: { status: "REMOVED" } });
    await db.report.updateMany({ where: { listingId: report.listingId }, data: { resolved: true } });
  }
  revalidatePath("/admin");
}

export async function markEnquiryHandled(form: FormData) {
  await requireAdmin();
  await db.adEnquiry.update({ where: { id: String(form.get("id")) }, data: { handled: true } });
  revalidatePath("/admin");
}

export async function toggleCampaign(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const c = await db.adCampaign.findUnique({ where: { id } });
  if (c) await db.adCampaign.update({ where: { id }, data: { active: !c.active } });
  revalidatePath("/admin");
}
