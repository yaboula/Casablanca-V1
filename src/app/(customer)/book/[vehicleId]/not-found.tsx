import Link from "next/link";

export default function BookingNotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
        Not found
      </p>
      <h1 className="mt-4 text-3xl font-black text-neutral-950">
        Vehicle not found.
      </h1>
      <p className="mt-4 text-base leading-7 text-neutral-700">
        This vehicle is no longer listed in the public fleet, or the link may be
        incorrect. Browse the catalog to find another vehicle to reserve.
      </p>
      <Link
        className="mt-8 inline-flex min-h-11 w-fit items-center rounded-md bg-neutral-950 px-5 py-3 text-sm font-bold text-white"
        href="/catalog"
      >
        Browse the fleet
      </Link>
    </section>
  );
}
