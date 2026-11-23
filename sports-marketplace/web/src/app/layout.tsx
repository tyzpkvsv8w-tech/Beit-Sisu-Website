import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: { default: "ReKit: second-hand sports gear in the UAE", template: "%s · ReKit" },
  description: "Buy and sell second-hand sports equipment in the UAE. Free to post, free to buy, no commission.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;1,800&family=Inter:wght@400;500;600;700&display=swap" />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <footer className="foot">
          <div className="wrap">
            <div><strong style={{ color: "var(--fg)" }}>ReKit</strong> · Second-hand sports gear, free for everyone. Funded by clearly labelled ads.</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link href="/advertise">Advertise with us</Link><Link href="/safety">Safety tips</Link><Link href="/sell">Post an ad</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
