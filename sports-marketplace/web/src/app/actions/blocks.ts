"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/** Blocks the other person in a conversation, optionally reporting the chat to the admin. */
export async function blockFromChat(form: FormData) {
  const conversationId = String(form.get("conversationId"));
  const me = await requireUser(`/messages/${conversationId}`);
  const c = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!c || (c.buyerId !== me.id && c.sellerId !== me.id)) redirect("/messages");
  const otherId = c.buyerId === me.id ? c.sellerId : c.buyerId;
  await db.block.upsert({ where: { blockerId_blockedId: { blockerId: me.id, blockedId: otherId } }, update: {}, create: { blockerId: me.id, blockedId: otherId } });
  if (form.get("report") === "on") {
    await db.report.upsert({
      where: { listingId_reporterId: { listingId: c.listingId, reporterId: me.id } },
      update: { reason: "Abusive or scam messages", details: `Reported from chat ${c.id}`, resolved: false },
      create: { listingId: c.listingId, reporterId: me.id, reason: "Abusive or scam messages", details: `Reported from chat ${c.id}` },
    });
  }
  revalidatePath("/messages");
  redirect("/messages?blocked=1");
}

export async function unblock(form: FormData) {
  const me = await requireUser("/account");
  await db.block.deleteMany({ where: { blockerId: me.id, blockedId: String(form.get("userId")) } });
  revalidatePath("/account");
  const back = String(form.get("back") ?? "");
  if (back.startsWith("/messages/")) redirect(back);
}
