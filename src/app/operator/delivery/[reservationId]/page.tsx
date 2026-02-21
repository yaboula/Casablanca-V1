import { notFound } from "next/navigation";
import Link from "next/link";
import { serverFetch } from "@/lib/server-api";
import type { OperatorDelivery } from "@/types";
import DeliveryCheckClient from "./DeliveryCheckClient";

interface Props {
  params: Promise<{ reservationId: string }>;
}

export default async function DeliveryPage({ params }: Props) {
  const { reservationId } = await params;

  const res = await serverFetch<{ data: OperatorDelivery[]; total: number }>("/operator/deliveries");
  const delivery = (res.data ?? []).find((d) => d.id === reservationId);

  if (!delivery) {
    return (
      <div className="max-w-lg mx-auto px-5 pt-12 text-center">
        <p className="text-slate-900 text-lg font-bold">Reserva no encontrada</p>
        <Link href="/operator/dashboard" className="text-blue-600 text-sm mt-2 inline-block">
          ← Volver al dashboard
        </Link>
      </div>
    );
  }

  return <DeliveryCheckClient delivery={delivery} />;
}
