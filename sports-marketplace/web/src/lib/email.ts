import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

export type Mail = { to: string; subject: string; html: string; text: string; headers?: Record<string, string> };

// EMAIL_DRIVER=dev writes each email to OUTBOX_DIR as a JSON file instead of sending it.
// EMAIL_DRIVER=resend sends through Resend (resend.com).
function driver(): "dev" | "resend" {
  const d = process.env.EMAIL_DRIVER === "resend" ? "resend" : "dev";
  if (d === "dev" && process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_EMAIL !== "1") {
    throw new Error("EMAIL_DRIVER=dev is not allowed in production. Set EMAIL_DRIVER=resend.");
  }
  return d;
}

export async function sendEmail(mail: Mail) {
  if (driver() === "resend") {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!key || !from) throw new Error("Set RESEND_API_KEY and EMAIL_FROM to send email");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, html: mail.html, text: mail.text, headers: mail.headers }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text().catch(() => "")}`);
    return;
  }
  const dir = path.resolve(process.env.OUTBOX_DIR || "./.outbox");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${Date.now()}-${randomBytes(3).toString("hex")}.json`);
  await writeFile(file, JSON.stringify({ ...mail, sentAt: new Date().toISOString() }, null, 2));
  console.log(`[dev email] to ${mail.to}: ${mail.subject} (${file})`);
}
