import type { Metadata, Viewport } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { InstallPrompt } from "@/components/pwa/install-prompt";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const APP_NAME = "Celíacos AR";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: "Celíacos AR — Productos sin gluten evaluados por la comunidad",
    template: "%s | Celíacos AR",
  },
  description:
    "Descubrí, evaluá y puntuá productos aptos para celíacos. Opiniones reales de la comunidad en Argentina.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Celíacos AR",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#F9A826",
  width: "device-width",
  initialScale: 1,
};

/** La app usa Supabase en cada vista; evita prerender en build sin variables de entorno. */
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col antialiased font-[family-name:var(--font-body)]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <InstallPrompt />
      </body>
    </html>
  );
}
