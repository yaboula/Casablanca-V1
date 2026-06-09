import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/features/auth/RegisterForm";
import { getSafeRedirect } from "@/features/auth/auth-redirects";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Register",
  description: "Crea una cuenta Casablanca V1.",
};

type RegisterPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const redirectTo = getSafeRedirect(params.redirect);
  const user = await getCurrentUser();

  if (user) {
    redirect(redirectTo);
  }

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
        Auth shell
      </p>
      <h1 className="mt-4 text-4xl font-black text-neutral-950">
        Crear cuenta
      </h1>
      <p className="mt-4 text-base leading-7 text-neutral-700">
        El registro llama al endpoint real del backend a traves del frontend
        session shell. No hay usuario mock ni token expuesto al cliente.
      </p>
      <RegisterForm redirectTo={redirectTo} />
    </section>
  );
}
