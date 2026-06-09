import { VehicleCard } from "./VehicleCard";
import type { VehicleCardModel } from "./types";

export function VehicleGrid({ vehicles }: { vehicles: VehicleCardModel[] }) {
  return (
    <ul className="grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <li key={vehicle.id}>
          <VehicleCard vehicle={vehicle} />
        </li>
      ))}
    </ul>
  );
}
