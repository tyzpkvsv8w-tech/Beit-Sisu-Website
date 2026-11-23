import "server-only";
import { db } from "./db";
import { appUrl, sign } from "./app";
import { sendEmail } from "./email";
import { createEmailToken } from "./tokens";
import { newMessageEmail, verifyEmail } from "./email-templates";

export const VERIFY_TTL_MS = 24 * 3600 * 1000;

/** Sends a confirmation link to `email` (a new address, or the one given at sign-up). */
export async function sendVerification(user: { id: string; name: string; locale: string }, email: string) {
  const token = await createEmailToken(user.id, "verify", VERIFY_TTL_MS, email);
  await sendEmail(verifyEmail({ to: email, name: user.name, locale: user.locale, url: `${appUrl()}/verify-email?token=${token}` }));
}

export function unsubscribeLinks(userId: string) {
  const q = `u=${encodeURIComponent(userId)}&s=${sign(`unsub:${userId}`)}`;
  return { page: `${appUrl()}/unsubscribe?${q}`, oneClick: `${appUrl()}/api/unsubscribe?${q}` };
}

/**
 * Emails the other person in a conversation about a new message, if they have a confirmed
 * email and alerts switched on. Only one email per conversation until they read it.
 */
export async function notifyNewMessage(messageId: string) {
  const msg = await db.message.findUnique({
    where: { id: messageId },
    include: { sender: { select: { name: true } }, conversation: { include: { listing: { select: { title: true } } } } },
  });
  if (!msg) return;
  const c = msg.conversation;
  const recipientId = msg.senderId === c.buyerId ? c.sellerId : c.buyerId;
  const recipient = await db.user.findUnique({ where: { id: recipientId } });
  if (!recipient?.email || !recipient.emailVerifiedAt || !recipient.notifyMessages) return;
  const earlierUnread = await db.message.count({
    where: { conversationId: c.id, senderId: msg.senderId, readAt: null, id: { not: msg.id }, createdAt: { lte: msg.createdAt } },
  });
  if (earlierUnread > 0) return; // already emailed about this batch
  const links = unsubscribeLinks(recipient.id);
  await sendEmail(newMessageEmail({
    to: recipient.email, name: recipient.name, locale: recipient.locale, sender: msg.sender.name, title: c.listing.title,
    preview: msg.body, url: `${appUrl()}/messages/${c.id}`, unsubscribeUrl: links.page, oneClickUrl: links.oneClick,
  }));
}
