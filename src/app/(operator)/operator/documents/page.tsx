import type { Metadata } from "next";
import Link from "next/link";
import { requireRouteRole } from "@/lib/auth/route-guards";
import { getPendingDocuments } from "@/features/operator/operator-service";
import { OperatorDocumentsView } from "@/features/operator/OperatorDocumentsView";
import type { PendingDocumentViewModel } from "@/features/operator/types";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Document Review — Nexus Mobility Operator",
  description: "Review and approve pending customer documents for car rental reservations.",
};

function ForbiddenShell() {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
        Forbidden
      </p>
      <h1 className="mt-4 text-4xl font-black text-neutral-950">
        Operator access required
      </h1>
      <p className="mt-4 text-base leading-7 text-neutral-700">
        You are signed in, but your role does not grant access to the document
        review console.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex min-h-11 w-fit items-center rounded-md border border-[var(--nx-line)] bg-white px-5 font-bold text-neutral-950 transition hover:bg-neutral-50"
      >
        Go to customer dashboard
      </Link>
    </section>
  );
}

export default async function OperatorDocumentsPage() {
  const result = await requireRouteRole(
    ["OPERATOR", "ADMIN"],
    "/operator/documents",
  );

  if (result.forbidden) {
    return <ForbiddenShell />;
  }

  let documents: PendingDocumentViewModel[];
  try {
    documents = await getPendingDocuments();
  } catch {
    documents = [];
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-10 md:py-14">
      {/* Header */}
      <header className="mb-8">
        <Link
          href="/operator/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-950"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
            Operator console
          </span>
        </div>

        <h1 className="mt-2 text-4xl font-black text-neutral-950">
          Document review
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
          Review customer documents before their rental begins. Approve clear,
          valid documents. Reject with a reason if the document is unreadable or
          invalid — the customer will be notified immediately.
        </p>
      </header>

      {/* Client component handles live state after actions */}
      <OperatorDocumentsView initialDocuments={documents} />
    </article>
  );
}
