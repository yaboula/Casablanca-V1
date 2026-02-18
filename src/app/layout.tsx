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
      <body className="bg-slate-100 text-brand-dark antialiased flex justify-center min-h-screen">
        <div
          id="app-container"
          className="relative w-full max-w-md min-h-screen bg-brand-bg shadow-2xl overflow-x-hidden flex flex-col"
        >
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
