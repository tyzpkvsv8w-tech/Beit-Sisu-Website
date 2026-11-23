import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Header } from "@/components/Header";
import { getI18n } from "@/i18n";
import { I18nProvider } from "@/i18n/client";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: { default: m.meta.title, template: "%s · ReKit" }, description: m.meta.description };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

const FONTS = {
  en: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;1,800&family=Inter:wght@400;500;600;700&display=swap",
  // Barlow stays for the Latin logo and numbers; Cairo and IBM Plex Sans Arabic cover Arabic text.
  ar: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;1,800&family=Cairo:wght@600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { m, locale } = await getI18n();
  return (
    <html lang={locale} dir={m.dir}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={FONTS[locale]} />
      </head>
      <body>
        <I18nProvider locale={locale} m={m}>
          <Header />
          <main>{children}</main>
          <footer className="foot">
            <div className="wrap">
              <div><strong style={{ color: "var(--fg)" }}>ReKit</strong> · {m.common.footer}</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <Link href="/advertise">{m.common.advertiseWithUs}</Link><Link href="/safety">{m.common.safetyTips}</Link>
                <Link href="/terms">{m.common.terms}</Link><Link href="/privacy">{m.common.privacy}</Link>
              </div>
            </div>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
