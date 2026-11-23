"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";

type Status = "loading" | "unconfigured" | "unsupported" | "ios-install" | "blocked" | "on" | "off";

const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

function keyToBytes(base64url: string) {
  const b64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function registration() {
  // Normally registered on page load; registering again just returns the same one.
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

/** Whether this device gets notifications for the logged-in user, and switches to change it. */
export function usePush(publicKey: string | null) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    if (!publicKey) return setStatus("unconfigured");
    if (isIos() && !isStandalone()) return setStatus("ios-install");
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setStatus("unsupported");
    if (Notification.permission === "denied") return setStatus("blocked");
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return setStatus("off");
    // The browser may still hold a subscription from a previous login; ask the server whose it is.
    const res = await fetch(`/api/push/subscription?endpoint=${encodeURIComponent(sub.endpoint)}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({ active: false }));
    setStatus(res.active ? "on" : "off");
  }, [publicKey]);

  useEffect(() => { refresh(); }, [refresh]);

  const turnOn = useCallback(async () => {
    if (!publicKey) return false;
    setBusy(true); setFailed(false);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus(permission === "denied" ? "blocked" : "off"); return false; }
      const reg = await registration();
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) }));
      const res = await fetch("/api/push/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      if (!res.ok) throw new Error(`Server said ${res.status}`);
      setStatus("on");
      return true;
    } catch {
      setFailed(true);
      return false;
    } finally {
      setBusy(false);
    }
  }, [publicKey]);

  const turnOff = useCallback(async () => {
    setBusy(true);
    try {
      const sub = await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscription", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe().catch(() => {});
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }, []);

  return { status, busy, failed, turnOn, turnOff };
}

/** Account page card. */
export function PushSettings({ publicKey }: { publicKey: string | null }) {
  const { m } = useI18n();
  const t = m.push;
  const { status, busy, failed, turnOn, turnOff } = usePush(publicKey);
  const message: Partial<Record<Status, string>> = {
    unconfigured: t.notConfigured, unsupported: t.unsupported, "ios-install": t.iosInstall, blocked: t.blocked, on: t.on, off: t.off,
  };
  return (
    <div className="panel" style={{ maxWidth: 620 }} data-testid="push-settings" data-status={status}>
      <h2 style={{ fontSize: 22 }}>{t.heading}</h2>
      <p style={{ margin: 0 }}>{t.text}</p>
      {status !== "loading" && <p className={status === "on" ? "ok" : "note"} style={{ margin: 0 }}>{message[status]}</p>}
      {status === "off" && <button type="button" className="btn btn-primary" style={{ justifySelf: "start" }} onClick={turnOn} disabled={busy}>{busy ? t.working : t.turnOn}</button>}
      {status === "on" && <button type="button" className="btn btn-ghost" style={{ justifySelf: "start" }} onClick={turnOff} disabled={busy}>{busy ? t.working : t.turnOff}</button>}
      {failed && <p className="err" style={{ margin: 0 }}>{t.failed}</p>}
      <p className="hint" style={{ margin: 0 }}>{t.privacyNote}</p>
    </div>
  );
}

const PROMPT_KEY = "rk_push_prompt_dismissed";

/** Shown in a chat right after you send a message, if this device could get notifications but doesn't. */
export function ChatPushPrompt({ publicKey, show }: { publicKey: string | null; show: boolean }) {
  const { m } = useI18n();
  const { status, busy, turnOn } = usePush(publicKey);
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => { try { setDismissed(!!localStorage.getItem(PROMPT_KEY)); } catch { setDismissed(false); } }, []);
  if (!show || dismissed || status !== "off" || (typeof Notification !== "undefined" && Notification.permission !== "default")) return null;
  const hide = () => { try { localStorage.setItem(PROMPT_KEY, "1"); } catch { /* ignore */ } setDismissed(true); };
  return (
    <div className="push-prompt" role="status">
      <span>🔔 {m.push.chatPrompt}</span>
      <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => turnOn().then(hide)}>{m.push.chatYes}</button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={hide}>{m.push.chatNo}</button>
    </div>
  );
}
