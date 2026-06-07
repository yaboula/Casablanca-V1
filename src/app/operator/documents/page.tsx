import type { Metadata } from "next";
import { safeFetch } from "@/lib/safe-fetch";
import { PendingDocumentsResponseSchema } from "@/lib/schemas/operator.schemas";
import DocumentReviewList from "./DocumentReviewList";

export const metadata: Metadata = {
  title: "Revisión de Documentos · NEXUS.",
};

export default async function DocumentsPage() {
  // F2.3 — safeFetch validates response shape at runtime via Zod.
  // ZodError is caught by the nearest error.tsx boundary if the API shape changes.
  const result = await safeFetch(
    "/operator/documents/pending",
    PendingDocumentsResponseSchema,
  );
  return <DocumentReviewList documents={result.data ?? []} />;
}
