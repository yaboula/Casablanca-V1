import type { Metadata } from "next";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { requireRouteRole } from "@/lib/auth/route-guards";

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin route shell for Casablanca V1.",
};

export default async function AdminPage() {
  const result = await requireRouteRole(["ADMIN"], "/admin");

  if (result.forbidden) {
    return (
      <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-6 py-16">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
          Forbidden
        </p>
        <h1 className="mt-4 text-4xl font-black text-neutral-950">
          Admin access required
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-700">
          You are signed in, but your backend role does not allow this route.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
            Admin shell
          </p>
          <h1 className="mt-4 text-4xl font-black text-neutral-950">
            Admin console shell ready
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-700">
            User management, vehicle administration, and stats integrations are
            intentionally deferred. This route only proves ADMIN protection.
          </p>
        </div>
        <LogoutButton />
      </div>
    </section>
  );
}
