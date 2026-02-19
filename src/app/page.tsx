import HomeClient from "@/components/shared/HomeClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEXUS · Alquiler de Coches en CMN  Aeropuerto Mohammed V",
  description:
    "Reserva tu coche premium en el Aeropuerto de Casablanca. Check-in digital, entrega en 3 minutos. Solo 10e para asegurar tu reserva.",
  openGraph: {
    title: "NEXUS · Alquiler Premium en CMN",
    description: "Aterriza. Escanea QR. Conduce. El alquiler mas rapido de Marruecos.",
    type: "website",
  },
};

export default function Home() {
  return <HomeClient />;
}
