import type { Metadata } from "next";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { requireAuthenticatedUser } from "@/lib/auth/route-guards";

export const metadata: Metadata = {
  title: "Profile",
  description: "Customer profile route shell for Casablanca V1.",
};

export default async function ProfilePage() {
  const user = await requireAuthenticatedUser("/profile");

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
            Customer profile shell
          </p>
          <h1 className="mt-4 text-4xl font-black text-neutral-950">
            Profile shell ready
          </h1>
        </div>
        <LogoutButton />
      </div>

      <dl className="mt-10 grid gap-5 rounded-lg border border-[var(--nx-line)] bg-white p-6">
        <div>
          <dt className="text-sm font-bold text-neutral-950">Name</dt>
          <dd className="mt-1 text-sm text-neutral-700">{user.fullName}</dd>
        </div>
        <div>
          <dt className="text-sm font-bold text-neutral-950">Email</dt>
          <dd className="mt-1 text-sm text-neutral-700">{user.email}</dd>
        </div>
        <div>
          <dt className="text-sm font-bold text-neutral-950">Role</dt>
          <dd className="mt-1 text-sm text-neutral-700">{user.role}</dd>
        </div>
      </dl>
    </section>
  );
}
