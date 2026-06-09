import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
        404
      </p>
      <h1 className="mt-4 text-3xl font-black text-neutral-950">
        Page not found.
      </h1>
      <p className="mt-4 text-base leading-7 text-neutral-700">
        This route is not part of the Commit A runtime foundation.
      </p>
      <Link
        className="mt-8 inline-flex min-h-11 w-fit items-center rounded-md bg-neutral-950 px-5 py-3 text-sm font-bold text-white"
        href="/"
      >
        Return home
      </Link>
    </section>
  );
}
