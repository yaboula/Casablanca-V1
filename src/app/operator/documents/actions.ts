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

export async function approveDocument(docId: string): Promise<void> {
  const token = await getOperatorToken();
  const res = await fetch(`${BASE}/operator/documents/${docId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Approve failed: ${res.status}`);
  revalidatePath("/operator/documents");
}

export async function rejectDocument(docId: string, reason: string): Promise<void> {
  const token = await getOperatorToken();
  const res = await fetch(`${BASE}/operator/documents/${docId}/reject`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(`Reject failed: ${res.status}`);
  revalidatePath("/operator/documents");
}
