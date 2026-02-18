import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Casablanca — Alquiler de Coches",
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
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
