import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Nexus — Alquiler de Coches en Casablanca",
  description: "Reserva tu coche al llegar al Aeropuerto Mohammed V. Rápido, seguro y sin sorpresas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-brand-bg text-brand-dark antialiased flex flex-col">
        <Header />
        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
