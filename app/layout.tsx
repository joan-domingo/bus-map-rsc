import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleTagManager } from "../lib/components/GoogleTagManager";
import { StructuredData } from "../lib/components/StructuredData";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://quantriga.com"),
  title: {
    default: "Moventis temps real| QuanTriga.com",
    template: "%s | QuanTriga.com",
  },
  description:
    "Moventis en temps real i tiempo real: mapa interactiu amb parades, horaris i línies N80, C30, E3, N65, N62, X30, C18 i 806.",
  keywords: [
    "bus",
    "autobús",
    "temps real",
    "tiempo real",
    "mapa busos",
    "mapa autobuses",
    "parada bus",
    "parada autobús",
    "Moventis",
    "moventis bus",
    "moventis autobús",
    "moventis temps real",
    "moventis tiempo real",
    "moventis e3 tiempo real",
    "e3 tiempo real",
    "e3 temps real",
    "n80",
    "bus n80",
    "c30",
    "bus c30",
    "c18",
    "bus c18",
    "n65",
    "n62",
    "x30",
    "806",
    "bus 806",
    "cerdanyola del vallès",
    "cerdanyola",
    "barcelona",
    "sabadell",
    "terrassa",
    "sant cugat",
    "sant cugat del vallès",
    "badalona",
    "barberà del vallès",
    "barbera del valles",
    "castellbisbal",
    "bellaterra",
    "vallès occidental",
    "vallès oriental",
    "àrea metropolitana barcelona",
    "área metropolitana barcelona",
    "transports públics",
    "transporte público",
    "horaris bus",
    "horarios autobús",
    "quan arriba el bus",
    "cuándo llega el autobús",
  ],
  authors: [{ name: "Joan Domingo" }],
  creator: "Joan Domingo",
  publisher: "QuanTriga.com",
  applicationName: "QuanTriga.com",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ca_ES",
    url: "https://quantriga.com",
    siteName: "QuanTriga.com",
    title: "Moventis temps real | QuanTriga.com",
    description:
      "Moventis en temps real: mapa interactiu amb parades, horaris i línies N80, C30, E3, N65, N62, X30, C18 i 806.",
    images: [
      {
        url: "/og-image",
        width: 1200,
        height: 630,
        alt: "QuanTriga.com - Mapa de temps real d'autobusos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moventis temps real | QuanTriga.com",
    description:
      "Moventis en temps real: mapa interactiu amb parades, horaris i línies N80, C30, E3, N65, N62, X30, C18 i 806.",
    images: ["/og-image"],
  },
  alternates: {
    canonical: "https://quantriga.com",
  },
  category: "transport",
  classification: "Transport Públic",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QuanTriga",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#088b9f" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ca">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleTagManager />
        <StructuredData />
        {children}
      </body>
    </html>
  );
}
