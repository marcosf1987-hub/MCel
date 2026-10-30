import type { Metadata, Viewport } from "next";
import { DM_Sans, Libre_Caslon_Text } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";

const libreCaslon = Libre_Caslon_Text({
  subsets: ["latin"],
  variable: "--font-libre-caslon",
  weight: ["400", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const APP_NAME = "CeliApp";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: "CeliApp — Productos sin gluten evaluados por la comunidad",
    template: "%s | CeliApp",
  },
  description:
    "Descubrí, evaluá y puntuá productos aptos para celíacos. Opiniones reales de la comunidad en Argentina.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CeliApp",
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
  themeColor: "#ED6C52",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es-AR"
      className={`${libreCaslon.variable} ${dmSans.variable}`}
    >
      <body className="flex min-h-screen flex-col antialiased font-[family-name:var(--font-body)]">
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
