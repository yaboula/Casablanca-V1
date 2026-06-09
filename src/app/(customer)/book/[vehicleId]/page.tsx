import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import { requireAuthenticatedUser } from "@/lib/auth/route-guards";
import { getVehicleDetail } from "@/features/catalog/vehicle-service";
import { BookingShell } from "@/features/booking/BookingShell";

type BookingPageProps = {
  params: Promise<{
    vehicleId: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: BookingPageProps): Promise<Metadata> {
  const { vehicleId } = await params;

  try {
    const vehicle = await getVehicleDetail(vehicleId);

    if (!vehicle) {
      return { title: "Vehicle not found" };
    }

    return {
      title: `Reserve ${vehicle.name}`,
      description: `Reserve the ${vehicle.name} at Casablanca Mohammed V Airport. Enter your trip dates and contact details to create a reservation.`,
    };
  } catch {
    return { title: "Reserve a vehicle" };
  }
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { vehicleId } = await params;

  // Auth is required — unauthenticated users are redirected to login.
  // The route path is preserved so the user lands back here after sign-in.
  await requireAuthenticatedUser(`/book/${vehicleId}`);

  let vehicle;

  try {
    vehicle = await getVehicleDetail(vehicleId);
  } catch (error) {
    if (error instanceof ApiError && error.payload.kind === "not-found") {
      notFound();
    }

    // Other errors (network, server) bubble to the error boundary.
    throw error;
  }

  if (!vehicle) {
    notFound();
  }

  return <BookingShell vehicle={vehicle} />;
}
