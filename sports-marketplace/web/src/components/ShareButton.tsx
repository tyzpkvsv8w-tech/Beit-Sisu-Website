"use client";

import { useState } from "react";
import { nativeShare } from "@/lib/native";
import { useI18n } from "@/i18n/client";

/** Native share sheet in the iPhone app and on phones; copies the link elsewhere. */
export function ShareButton({ title, path }: { title: string; path: string }) {
  const { m } = useI18n();
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = location.origin + path;
    try {
      const native = nativeShare();
      if (native) return void (await native.share({ title, text: title, url, dialogTitle: m.share.button }));
      if (navigator.share) return void (await navigator.share({ title, url }));
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* cancelled or blocked: nothing to do */ }
  }
  return <button type="button" className="btn btn-ghost" onClick={share}>{copied ? m.share.copied : m.share.button}</button>;
}
