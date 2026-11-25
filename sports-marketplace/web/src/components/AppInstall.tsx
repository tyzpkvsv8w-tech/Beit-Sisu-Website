"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useI18n } from "@/i18n/client";

// Chrome, Edge and Samsung Internet fire `beforeinstallprompt` when the site can be installed.
// We keep that event so our own button can show the browser's install dialog later.
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferred: InstallEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as InstallEvent; emit(); });
  window.addEventListener("appinstalled", () => { deferred = null; installed = true; emit(); });
}

function useInstallState() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => (installed ? "installed" : deferred ? "ready" : "none"),
    () => "none",
  );
}

const isStandalone = () =>
  typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
const isIosSafari = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
};

async function promptInstall() {
  if (!deferred) return;
  const e = deferred;
  deferred = null;
  emit();
  await e.prompt();
  const { outcome } = await e.userChoice;
  if (outcome === "accepted") { installed = true; emit(); }
}

const DISMISS_KEY = "rk_install_dismissed";
const VIEWS_KEY = "rk_views";
const DISMISS_DAYS = 30;
const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* storage blocked: ignore */ } },
};

/** Registers the service worker (production builds only, so development never serves stale files). */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

/**
 * A small bar suggesting installation, from the second page a visitor views.
 * Android/desktop get an Install button; iPhone Safari gets the Share-menu steps.
 * "Not now" hides it for 30 days.
 */
export function InstallBanner() {
  const { m } = useI18n();
  const state = useInstallState();
  const [eligible, setEligible] = useState(false);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    const dismissed = Number(store.get(DISMISS_KEY) || 0);
    if (Date.now() - dismissed < DISMISS_DAYS * 86400e3) return;
    const views = Number(store.get(VIEWS_KEY) || 0) + 1;
    store.set(VIEWS_KEY, String(views));
    if (views < 2) return;
    setIos(isIosSafari());
    setEligible(true);
  }, []);

  if (hidden || !eligible || (state !== "ready" && !ios)) return null;
  const dismiss = () => { store.set(DISMISS_KEY, String(Date.now())); setHidden(true); };
  return (
    <div className="install-bar" role="dialog" aria-label={ios ? m.app.iosTitle : m.app.installTitle}>
      <img src="/icons/icon-192.png" alt="" width={44} height={44} />
      <div className="install-copy">
        <strong>{ios ? m.app.iosTitle : m.app.installTitle}</strong>
        <span>{ios ? m.app.iosSteps : m.app.installText}</span>
      </div>
      <div className="install-actions">
        {!ios && <button type="button" className="btn btn-primary btn-sm" onClick={() => promptInstall().then(() => setHidden(true))}>{m.app.install}</button>}
        <button type="button" className="btn btn-ghost btn-sm" onClick={dismiss}>{m.app.notNow}</button>
      </div>
    </div>
  );
}

/** "Install the app" on the account page: always available, even after "Not now". */
export function InstallButton() {
  const { m } = useI18n();
  const state = useInstallState();
  const [mode, setMode] = useState<"standalone" | "ios" | "other" | null>(null);
  useEffect(() => setMode(isStandalone() ? "standalone" : isIosSafari() ? "ios" : "other"), []);
  if (mode === "standalone" || state === "installed") return <p className="ok" style={{ margin: 0 }}>{m.app.installed}</p>;
  if (mode === "ios") return <p className="note" style={{ margin: 0 }}>{m.app.iosAccount}</p>;
  if (state === "ready") return <button type="button" className="btn btn-volt" style={{ justifySelf: "start" }} onClick={() => promptInstall()}>{m.app.installApp}</button>;
  return null;
}
