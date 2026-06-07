"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SERVER_API_BASE } from "@/lib/config";

const API_URL = SERVER_API_BASE;

export async function completeReservation(reservationId: string) {
  const jar = await cookies();
  const token = jar.get("nexus_token")?.value;
  if (!token) throw new Error("No auth token");

  const res = await fetch(`${API_URL}/operator/delivery/${reservationId}/checkin`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Failed to complete reservation: ${res.status}`);

  revalidatePath("/operator/dashboard");
  revalidatePath(`/operator/delivery/${reservationId}`);
}
