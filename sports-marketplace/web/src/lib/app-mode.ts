import "server-only";
import { cookies, headers } from "next/headers";

export const APP_COOKIE = "rk_app";

/** "android" in the Google Play app, "ios" in the iPhone app, otherwise null (a browser). */
export async function inApp(): Promise<"android" | "ios" | null> {
  if (/ReKitApp-iOS\//.test((await headers()).get("user-agent") ?? "")) return "ios";
  return (await cookies()).get(APP_COOKIE)?.value === "android" ? "android" : null;
}

/**
 * Google Play and the App Store have strict rules on taking payments inside apps, so by default
 * ad bookings and promotions are website-only in the apps. After checking each store's payment
 * rules for your case, set ANDROID_ALLOW_PAYMENTS=1 and/or IOS_ALLOW_PAYMENTS=1.
 */
export async function paymentsBlockedInApp() {
  const app = await inApp();
  if (app === "android") return process.env.ANDROID_ALLOW_PAYMENTS !== "1";
  if (app === "ios") return process.env.IOS_ALLOW_PAYMENTS !== "1";
  return false;
}
