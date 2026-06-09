import type {
  VehicleApi,
  VehicleCardModel,
  VehicleCategory,
  VehicleDetailModel,
  VehicleStatus,
  VehicleTransmission,
} from "./types";

const vehicleCategories = new Set(["SEDAN", "SUV", "LUXURY", "COMPACT"]);
const vehicleStatuses = new Set([
  "AVAILABLE",
  "RENTED",
  "MAINTENANCE",
  "INACTIVE",
]);
const transmissions = new Set(["AUTOMATIC", "MANUAL"]);

export function adaptVehicleCard(input: VehicleApi): VehicleCardModel | null {
  const id = asNonEmptyString(input.id);
  const brand = asNonEmptyString(input.brand);
  const model = asNonEmptyString(input.model);
  const pricePerDayEurCents = asNonNegativeInteger(
    input.pricePerDayEurCents,
  );

  if (!id || !brand || !model || pricePerDayEurCents === null) {
    return null;
  }

  return {
    id,
    name: `${brand} ${model}`,
    category: asEnum<VehicleCategory>(input.category, vehicleCategories),
    pricePerDayEurCents,
    primaryImageUrl: asNonEmptyString(input.imageUrl),
    transmission: asEnum<VehicleTransmission>(
      input.transmission,
      transmissions,
    ),
    seats: asPositiveInteger(input.seats),
    luggageCount: asPositiveInteger(input.luggageCount),
    featureLabels: asStringArray(input.features),
  };
}

export function adaptVehicleDetail(
  input: VehicleApi,
): VehicleDetailModel | null {
  const card = adaptVehicleCard(input);
  const brand = asNonEmptyString(input.brand);
  const model = asNonEmptyString(input.model);

  if (!card || !brand || !model) {
    return null;
  }

  const gallery = asStringArray(input.imageUrls);
  const imageUrls = [
    card.primaryImageUrl,
    ...gallery.filter((url) => url !== card.primaryImageUrl),
  ].filter((url): url is string => Boolean(url));

  return {
    ...card,
    brand,
    model,
    status: asEnum<VehicleStatus>(input.status, vehicleStatuses),
    imageUrls,
  };
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asNonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

function asPositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function asEnum<T extends string>(
  value: unknown,
  allowedValues: Set<string>,
): T | null {
  return typeof value === "string" && allowedValues.has(value)
    ? (value as T)
    : null;
}
