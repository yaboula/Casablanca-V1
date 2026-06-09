import { VehicleCard } from "./VehicleCard";
import type { VehicleCardModel } from "./types";

export function VehicleGrid({ vehicles }: { vehicles: VehicleCardModel[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
      {vehicles.map((vehicle) => (
        <div key={vehicle.id} role="listitem">
          <VehicleCard vehicle={vehicle} />
        </div>
      ))}
    </div>
  );
}
