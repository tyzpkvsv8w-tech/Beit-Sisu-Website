"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { nativePush } from "@/lib/native";

/** In the iPhone app: tapping a notification opens the conversation it's about. */
export function NativeBridge() {
  const router = useRouter();
  useEffect(() => {
    const push = nativePush();
    if (!push) return;
    let sub: { remove: () => Promise<void> } | undefined;
    push.addListener("pushNotificationActionPerformed", (e) => {
      const url = (e as { notification?: { data?: { url?: unknown } } }).notification?.data?.url;
      if (typeof url === "string" && url.startsWith("/") && !url.startsWith("//")) router.push(url); // only pages on this site
    }).then((s) => { sub = s; });
    return () => { sub?.remove(); };
  }, [router]);
  return null;
}
