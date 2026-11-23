import "server-only";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { supabaseAuth } from "./supabase";

// SMS_DRIVER=dev: no text is sent; the code is shown on screen and in the server log.
// SMS_DRIVER=supabase: Supabase Auth texts and checks the code.
export function smsDriver(): "dev" | "supabase" {
  const d = process.env.SMS_DRIVER === "supabase" ? "supabase" : "dev";
  if (d === "dev" && process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_SMS !== "1") {
    // Showing codes on screen in production would let anyone log in as anyone.
    throw new Error("SMS_DRIVER=dev is not allowed in production. Set SMS_DRIVER=supabase.");
  }
  return d;
}

const hash = (code: string) => createHash("sha256").update(code).digest();

/** Sends a code. Returns the code itself only in dev mode, so the screen can show it. */
export async function sendCode(phone: string): Promise<{ codeHash: string | null; devCode?: string }> {
  if (smsDriver() === "supabase") {
    await supabaseAuth.sendOtp(phone);
    return { codeHash: null };
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  console.log(`[dev sms] code for ${phone}: ${code}`);
  return { codeHash: hash(code).toString("hex"), devCode: code };
}

export async function checkCode(phone: string, code: string, codeHash: string | null) {
  if (smsDriver() === "supabase") return supabaseAuth.verifyOtp(phone, code);
  if (!codeHash) return false;
  return timingSafeEqual(hash(code), Buffer.from(codeHash, "hex"));
}

/** Accepts 05X XXX XXXX, 5XXXXXXXX, 9715XXXXXXXX or +9715XXXXXXXX. Returns +9715XXXXXXXX or null. */
export function normalizeUaeMobile(input: string) {
  const digits = input.replace(/[^\d+]/g, "").replace(/^\+/, "").replace(/^00/, "");
  let local = digits;
  if (local.startsWith("971")) local = local.slice(3);
  if (local.startsWith("0")) local = local.slice(1);
  return /^5\d{8}$/.test(local) ? `+971${local}` : null;
}
