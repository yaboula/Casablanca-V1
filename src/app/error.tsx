"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
        Error
      </p>
      <h1 className="mt-4 text-3xl font-black text-neutral-950">
        Something went wrong.
      </h1>
      <p className="mt-4 text-base leading-7 text-neutral-700">
        An unexpected error occurred. Please try again or return to the home page.
        {error.digest ? ` Error reference: ${error.digest}` : ""}
      </p>
      <button
        className="mt-8 min-h-11 w-fit rounded-md bg-neutral-950 px-5 py-3 text-sm font-bold text-white"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </section>
  );
}
