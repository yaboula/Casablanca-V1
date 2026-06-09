import Link from "next/link";

export function CatalogEmptyState() {
  return (
    <div
      className="rounded-lg border border-dashed border-[var(--nx-line)] bg-white p-8 text-center"
      role="status"
    >
      <h2 className="text-xl font-black text-neutral-950">
        Aucun vehicule disponible.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-600">
        Le backend ne retourne aucun vehicule public disponible. Aucun vehicule
        de demonstration ne remplace cette reponse.
      </p>
    </div>
  );
}

export function CatalogErrorState({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg border border-[var(--nx-line)] bg-white p-8"
      role="alert"
    >
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
        Catalogue indisponible
      </p>
      <h2 className="mt-3 text-2xl font-black text-neutral-950">
        Impossible de charger les vehicules.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
        {message}
      </p>
    </div>
  );
}

export function VehicleNotFoundState() {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
        404
      </p>
      <h1 className="mt-4 text-3xl font-black text-neutral-950">
        Vehicule introuvable.
      </h1>
      <p className="mt-4 text-base leading-7 text-neutral-700">
        Ce vehicule est absent du catalogue backend public, ou il est
        inaccessible.
      </p>
      <Link
        className="mt-8 inline-flex min-h-11 w-fit items-center rounded-md bg-neutral-950 px-5 py-3 text-sm font-bold text-white"
        href="/catalog"
      >
        Retour au catalogue
      </Link>
    </section>
  );
}
