import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "@/components/layout/LayoutShell";

export const metadata: Metadata = {
  title: "NEXUS. — Alquiler de Coches Aeropuerto Casablanca CMN",
  description:
    "Reserva tu coche al llegar al Aeropuerto Mohammed V. Rápido, seguro y sin sorpresas. Recogida en 30 segundos.",
  metadataBase: new URL("https://nexus-cmn.vercel.app"),
  openGraph: {
    title: "NEXUS. — Alquiler de Coches en CMN",
    description:
      "Reserva tu coche al llegar al Aeropuerto Mohammed V. Rápido, seguro, sin sorpresas.",
    url: "https://nexus-cmn.vercel.app",
    siteName: "NEXUS.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "NEXUS. Alquiler CMN" }],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXUS. — Alquiler de Coches Aeropuerto Casablanca",
    description: "Reserva tu coche al llegar al Aeropuerto Mohammed V.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#2563EB" />
      </head>
      <body className="min-h-screen bg-brand-bg text-brand-dark antialiased flex flex-col">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
