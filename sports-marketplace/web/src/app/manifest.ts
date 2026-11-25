import type { MetadataRoute } from "next";
import { getI18n } from "@/i18n";

// The web app manifest: what makes ReKit installable, and how it looks once installed.
// Name and shortcuts follow the visitor's language.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { m, locale } = await getI18n();
  const icon = [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }];
  return {
    id: "/",
    name: "ReKit",
    short_name: "ReKit",
    description: m.meta.description,
    lang: locale,
    dir: m.dir as "ltr" | "rtl",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f1a2b",
    theme_color: "#0f1a2b",
    categories: ["shopping", "sports", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: m.app.shortcutSell, url: "/sell?source=shortcut", icons: icon },
      { name: m.app.shortcutSearch, url: "/browse?source=shortcut", icons: icon },
      { name: m.app.shortcutMessages, url: "/messages?source=shortcut", icons: icon },
    ],
  };
}
