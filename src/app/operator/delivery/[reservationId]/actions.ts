"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const API_URL = process.env.API_URL ?? "http://localhost:3001/api/v1";

export async function completeReservation(reservationId: string) {
  const jar = await cookies();
  const token = jar.get("nexus_token")?.value;
  if (!token) throw new Error("No auth token");

  const res = await fetch(`${API_URL}/operator/reservations/${reservationId}/complete`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Failed to complete reservation: ${res.status}`);

  revalidatePath("/operator/dashboard");
  revalidatePath(`/operator/delivery/${reservationId}`);
}
