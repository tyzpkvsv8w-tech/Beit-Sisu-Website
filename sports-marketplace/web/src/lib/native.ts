// The iPhone app (Capacitor) injects window.Capacitor into the page. These helpers talk to its
// native plugins when present, and do nothing in a normal browser.

type Listener = { remove: () => Promise<void> };
type PushPlugin = {
  checkPermissions(): Promise<{ receive: "granted" | "denied" | "prompt" | "prompt-with-rationale" }>;
  requestPermissions(): Promise<{ receive: string }>;
  register(): Promise<void>;
  unregister?(): Promise<void>;
  addListener(event: string, cb: (data: unknown) => void): Promise<Listener>;
};
type SharePlugin = { share(o: { title?: string; text?: string; url?: string; dialogTitle?: string }): Promise<unknown> };
type Cap = { isNativePlatform?: () => boolean; getPlatform?: () => string; Plugins?: { PushNotifications?: PushPlugin; Share?: SharePlugin } };

export function capacitor(): Cap | null {
  if (typeof window === "undefined") return null;
  const cap = (window as unknown as { Capacitor?: Cap }).Capacitor;
  return cap?.isNativePlatform?.() ? cap : null;
}

export const nativePush = () => capacitor()?.Plugins?.PushNotifications ?? null;
export const nativeShare = () => capacitor()?.Plugins?.Share ?? null;

/** Asks iOS for a device token. Resolves with it, or null if registration fails. */
export async function nativePushToken(push: PushPlugin): Promise<string | null> {
  return new Promise(async (resolve) => {
    const subs: Listener[] = [];
    const finish = (v: string | null) => { subs.forEach((s) => s.remove()); resolve(v); };
    subs.push(await push.addListener("registration", (d) => finish((d as { value: string }).value)));
    subs.push(await push.addListener("registrationError", () => finish(null)));
    setTimeout(() => finish(null), 15000);
    await push.register();
  });
}
