import type { Metadata } from "next";
import { serverFetch } from "@/lib/server-api";
import type { PendingDocument } from "@/types";
import DocumentReviewList from "./DocumentReviewList";

export const metadata: Metadata = {
  title: "Revisión de Documentos · NEXUS.",
};

export default async function DocumentsPage() {
  const pending = await serverFetch<PendingDocument[]>("/operator/documents/pending");
  return <DocumentReviewList documents={pending} />;
}
