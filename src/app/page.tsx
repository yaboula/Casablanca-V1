import TrustCard from "@/components/vehicles/TrustCard";

const VEHICLES = [
  { model: "Audi A4",             totalPrice: "800€" },
  { model: "Mercedes Clase C",    totalPrice: "950€" },
  { model: "Range Rover Evoque",  totalPrice: "1.200€" },
];

export default function Home() {
  return (
    <section className="w-full">
      {/* Hero heading */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-brand-dark tracking-tight">
          Vehículos Premium en Casablanca
        </h1>
        <p className="text-brand-muted mt-2">
          Recoge tu coche directo en el aeropuerto Mohammed V. Sin colas, sin sorpresas.
        </p>
      </div>

      {/* Vehicle grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full mt-8">
        {VEHICLES.map((v) => (
          <TrustCard key={v.model} model={v.model} totalPrice={v.totalPrice} />
        ))}
      </div>
    </section>
  );
}
