"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { SERVER_API_BASE } from "@/lib/config";

const BASE = SERVER_API_BASE;

async function getOperatorToken(): Promise<string> {
  const token = (await cookies()).get("nexus_token")?.value;
  if (!token) throw new Error("Unauthorized");
  return token;
}

export async function checkinReservation(reservationId: string): Promise<void> {
  const token = await getOperatorToken();
  const res = await fetch(
    `${BASE}/operator/delivery/${reservationId}/checkin`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error(`Checkin failed: ${res.status}`);
  revalidatePath("/operator/dashboard");
}

export async function completeReservation(reservationId: string): Promise<void> {
  const token = await getOperatorToken();
  const res = await fetch(
    `${BASE}/operator/delivery/${reservationId}/checkin`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error(`Complete failed: ${res.status}`);
  revalidatePath("/operator/dashboard");
}
