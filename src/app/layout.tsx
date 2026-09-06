import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AnalyticsNoScript, AnalyticsScripts } from "@/components/analytics";
import { SITE } from "@/config/site";
import { fontVariables } from "@/lib/fonts";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: SITE.title,
  description: SITE.description,
  authors: [{ name: SITE.candidateLegalName }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.ogDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.ogDescription,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: SITE.themeColor,
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Os fornecedores exigem o fallback sem-JS logo após a abertura do <body>. */}
        <AnalyticsNoScript />
        {children}
        <AnalyticsScripts />
      </body>
    </html>
  );
}
