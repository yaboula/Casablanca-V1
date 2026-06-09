import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { requireAuthenticatedUser } from "@/lib/auth/route-guards";

export const metadata: Metadata = {
  title: "Customer Dashboard",
  description: "Customer route shell for Casablanca V1.",
};

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser("/dashboard");

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
            Customer shell
          </p>
          <h1 className="mt-4 text-4xl font-black text-neutral-950">
            Dashboard shell ready
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-700">
            Signed in as {user.fullName || user.email}. Reservation data,
            booking history, documents, waiting room, and smart ticket
            integration are intentionally deferred to later phases.
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-10 rounded-lg border border-[var(--nx-line)] bg-white p-6">
        <h2 className="text-lg font-bold text-neutral-950">
          No business data mounted
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          This page proves authenticated customer routing only. It does not show
          fake reservations, fake references, or mocked statuses.
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-md border border-[var(--nx-line)] px-4 text-sm font-bold"
          href="/profile"
        >
          View profile shell
        </Link>
      </div>
    </section>
  );
}
