import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/LoginForm";
import { getSafeRedirect } from "@/features/auth/auth-redirects";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Login",
  description: "Inicia sesion en Casablanca V1.",
};

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
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
        Iniciar sesion
      </h1>
      <p className="mt-4 text-base leading-7 text-neutral-700">
        Esta ruta usa el backend real mediante el session shell del frontend. No
        crea sesiones falsas ni guarda tokens en localStorage.
      </p>
      <LoginForm redirectTo={redirectTo} />
    </section>
  );
}
