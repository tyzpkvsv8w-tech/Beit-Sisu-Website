"use client";

import { useEffect } from "react";

/**
 * Remembers that the site is running inside the Google Play app. The app opens
 * /?source=twa, and Android also reports an android-app:// referrer.
 */
export function AppMode() {
  useEffect(() => {
    const fromApp = new URLSearchParams(location.search).get("source") === "twa" || document.referrer.startsWith("android-app://");
    if (fromApp && !document.cookie.includes("rk_app=android")) {
      document.cookie = "rk_app=android; path=/; max-age=31536000; samesite=lax";
      location.reload(); // so server-rendered pages pick it up straight away
    }
  }, []);
  return null;
}
