import type { Metadata } from "next";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { requireRouteRole } from "@/lib/auth/route-guards";

export const metadata: Metadata = {
  title: "Operator Dashboard",
  description: "Operator route shell for Casablanca V1.",
};

export default async function OperatorDashboardPage() {
  const result = await requireRouteRole(["OPERATOR", "ADMIN"], "/operator/dashboard");

  if (result.forbidden) {
    return <ForbiddenShell title="Operator access required" />;
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
            Operator shell
          </p>
          <h1 className="mt-4 text-4xl font-black text-neutral-950">
            Operator console shell ready
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-700">
            Business data integration comes in the operator phase. Pending
            documents, deliveries, QR scan, and handoff actions are not mounted
            yet.
          </p>
        </div>
        <LogoutButton />
      </div>
    </section>
  );
}

function ForbiddenShell({ title }: { title: string }) {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
        Forbidden
      </p>
      <h1 className="mt-4 text-4xl font-black text-neutral-950">{title}</h1>
      <p className="mt-4 text-base leading-7 text-neutral-700">
        You are signed in, but your backend role does not allow this route.
      </p>
    </section>
  );
}
