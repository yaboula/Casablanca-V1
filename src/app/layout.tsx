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
      <body className="bg-brand-bg text-brand-dark antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
