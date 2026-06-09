import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRouteRole } from "@/lib/auth/route-guards";
import { getDeliveryDetail } from "@/features/operator/operator-service";
import { OperatorDeliveryDetailView } from "@/features/operator/OperatorDeliveryDetailView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Delivery Detail — Nexus Mobility Operator",
  description: "Manage vehicle handoff and check-in.",
};

type OperatorDeliveryPageProps = {
  params: {
    reservationId: string;
  };
};

export default async function OperatorDeliveryPage({
  params,
}: OperatorDeliveryPageProps) {
  // 1. Enforce OPERATOR or ADMIN role
  const result = await requireRouteRole(
    ["OPERATOR", "ADMIN"],
    `/operator/delivery/${params.reservationId}`,
  );

  if (result.forbidden) {
    // Basic forbidden fallback (consistent with other operator routes)
    return (
      <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-6 py-16">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
          Forbidden
        </p>
        <h1 className="mt-4 text-4xl font-black text-neutral-950">
          Operator access required
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-700">
          You are signed in, but your role does not grant access to the operator
          console.
        </p>
      </section>
    );
  }

  // 2. Fetch delivery detail
  let delivery;
  try {
    delivery = await getDeliveryDetail(params.reservationId);
  } catch (error) {
    // Let the error boundary catch major failures
    throw error;
  }

  // If the reservationId doesn't match any delivery for today, 404.
  // This matches business logic: you can only handoff today's deliveries.
  if (!delivery) {
    notFound();
  }

  // 3. Render client view
  return <OperatorDeliveryDetailView delivery={delivery} />;
}
