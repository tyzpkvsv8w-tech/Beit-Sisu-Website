import "server-only";
import { cookies } from "next/headers";

export const APP_COOKIE = "rk_app";

/**
 * True inside the Google Play app. Google Play has strict rules on taking payments inside apps,
 * so by default ad bookings and promotions are website-only there. After checking Google Play's
 * Payments policy for your case, set ANDROID_ALLOW_PAYMENTS=1 to allow them in the app too.
 */
export async function paymentsBlockedInApp() {
  if (process.env.ANDROID_ALLOW_PAYMENTS === "1") return false;
  return (await cookies()).get(APP_COOKIE)?.value === "android";
}
