# INT-SPRINT 2 — Catálogo & Vehículos
> **Objetivo**: Reemplazar `MOCK_VEHICLES` del archivo `src/lib/mock-data.ts` con datos reales de la base de datos PostgreSQL, incluyendo disponibilidad real por fechas.

---

## Contexto actual (estado mock)

| Archivo | Problema |
|---|---|
| `src/lib/mock-data.ts` | 6 vehículos hardcodeados con IDs ficticios (`"v1"`, `"v2"`, ...) |
| `src/app/catalog/page.tsx` | Server Component que renderiza `<CatalogGrid>` sin pasar datos (los toma del mock importado) |
| `src/app/book/[vehicleId]/page.tsx` | `MOCK_VEHICLES.find(v => v.id === vehicleId)` — nunca encontrará un UUID real |
| `src/app/catalog/[vehicleId]/page.tsx` | Ídem — usa mock para `generateStaticParams` y para resolver el detalle |
| `src/components/vehicles/BookFlowClient.tsx` | Recibe `vehicle: Vehicle` ya resuelto — OK, pero el upstream que lo resuelve usa mock |
| `src/components/vehicles/VehicleDetailClient.tsx` | Importa `getOccupancyHeat` del mock — función utilitaria pura, no un problema crítico |

### Endpoint de backend disponible
```
GET /api/v1/vehicles
  ?pickupDate=ISO8601
  ?returnDate=ISO8601
  ?category=SEDAN|SUV|LUXURY|COMPACT
  → { data: Vehicle[], total: number }

GET /api/v1/vehicles/:uuid
  → Vehicle
```

---

## Diferencias de shape: Mock vs Backend

| Campo frontend (mock) | Campo backend (API) | Acción |
|---|---|---|
| `id: "v1"` | `id: UUID` | Adaptar routing |
| `pricePerDay: 160` | `pricePerDayEurCents: 16000` | Convertir: `cents / 100` |
| `isAvailable: boolean` | No existe en entity — calculado por query de disponibilidad | Añadir lógica en `VehiclesService.findAvailable()` o manejar en frontend |
| `currency: "EUR"` | No existe en DB — siempre EUR | Añadir en response de backend o mapear en frontend |

---

## Tareas

### T2-1 — Mapear tipos (`src/lib/api-mappers.ts`)

Crear un mapper que convierta la respuesta del backend al tipo `Vehicle` del frontend:

```typescript
// src/lib/api-mappers.ts (nuevo archivo)
import type { Vehicle } from '@/types';

interface ApiVehicle {
  id: string;
  brand: string;
  model: string;
  category: 'SEDAN' | 'SUV' | 'LUXURY' | 'COMPACT';
  pricePerDayEurCents: number;
  imageUrl: string;
  imageUrls: string[];
  transmission: 'AUTOMATIC' | 'MANUAL';
  seats: number;
  luggageCount: number;
  features: string[];
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'INACTIVE';
}

export function mapApiVehicle(v: ApiVehicle): Vehicle {
  return {
    id: v.id,
    brand: v.brand,
    model: v.model,
    category: v.category,
    pricePerDay: v.pricePerDayEurCents / 100,
    currency: 'EUR',
    imageUrl: v.imageUrl,
    imageUrls: v.imageUrls,
    transmission: v.transmission,
    seats: v.seats,
    luggageCount: v.luggageCount,
    features: v.features,
    isAvailable: v.status === 'AVAILABLE',
  };
}
```

### T2-2 — Convertir CatalogGrid a Server Component

`src/components/vehicles/CatalogGrid.tsx` actualmente importa `MOCK_VEHICLES` internamente. Cambiar a que reciba los vehículos como `props`:

```typescript
// Antes (dentro de CatalogGrid):
import { MOCK_VEHICLES } from '@/lib/mock-data';

// Después:
interface Props {
  vehicles: Vehicle[];
}
export default function CatalogGrid({ vehicles }: Props) { ... }
```

### T2-3 — Catalog page con fetch real

`src/app/catalog/page.tsx` es un Server Component → puede hacer `fetch` directamente:

```typescript
// src/app/catalog/page.tsx
import { mapApiVehicle } from '@/lib/api-mappers';

async function getVehicles(): Promise<Vehicle[]> {
  const res = await fetch(
    `${process.env.API_URL}/vehicles`,
    { next: { revalidate: 60 } } // ISR cada 60s
  );
  if (!res.ok) return [];
  const json = await res.json();
  return json.data.map(mapApiVehicle);
}

export default async function CatalogPage() {
  const vehicles = await getVehicles();
  return (
    <main>
      ...
      <CatalogGrid vehicles={vehicles} />
    </main>
  );
}
```

> **Variable servidor** (no expuesta al cliente): `API_URL=http://localhost:3001/api/v1`

### T2-4 — Ruta dinámica `/catalog/[vehicleId]`

`src/app/catalog/[vehicleId]/page.tsx`:
- Eliminar `generateStaticParams` basado en mock → usar `dynamicParams = true` (Next.js 15)
- El `page.tsx` resuelve el vehículo via `GET /api/v1/vehicles/:id`
- Si el backend responde `404` → llamar `notFound()`

```typescript
export const dynamicParams = true;

async function getVehicle(id: string): Promise<Vehicle | null> {
  const res = await fetch(`${process.env.API_URL}/vehicles/${id}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return mapApiVehicle(await res.json());
}
```

### T2-5 — Ruta de booking `/book/[vehicleId]`

`src/app/book/[vehicleId]/page.tsx`:
- Eliminar `generateStaticParams` + `MOCK_VEHICLES.find(...)`
- Resolver el vehículo igual que T2-4
- Pasar `vehicle` a `<BookFlowClient>` (ya está preparado para recibirlo como prop)

```typescript
// Eliminar:
import { MOCK_VEHICLES } from "@/lib/mock-data";
export function generateStaticParams() { ... }
// const vehicle = MOCK_VEHICLES.find(v => v.id === vehicleId);

// Añadir:
const vehicle = await getVehicle(vehicleId);
if (!vehicle) notFound();
```

### T2-6 — Disponibilidad real en catálogo

Cuando el usuario selecciona fechas en `HomeClient.tsx` o `DualTimelineSlider.tsx` y va al catálogo, pasar las fechas del `useBookingStore` como query params al catálogo:

```typescript
// En HomeClient (o en el botón "Ver catálogo"):
const { pickupDate, returnDate } = useBookingStore();
const params = new URLSearchParams();
if (pickupDate) params.set('pickupDate', new Date(pickupDate).toISOString());
if (returnDate) params.set('returnDate', new Date(returnDate).toISOString());
router.push(`/catalog?${params.toString()}`);
```

Y `src/app/catalog/page.tsx` los lee de `searchParams` y los pasa al fetch:

```typescript
export default async function CatalogPage({ searchParams }) {
  const { pickupDate, returnDate, category } = await searchParams;
  const vehicles = await getVehicles({ pickupDate, returnDate, category });
  ...
}
```

Esto hace que el catálogo muestre solo coches disponibles para las fechas seleccionadas.

### T2-7 — Seed de vehículos en base de datos

Ejecutar el seed ya creado en `backend/src/database/seeds/vehicles.seed.ts`:
- Insertar los mismos 6 vehículos del mock con datos equivalentes
- **Problema**: los IDs del mock son `"v1"`, `"v2"`, etc. → el seed genera UUIDs reales
- Solución: el routing pasa de IDs fijos a UUIDs → el `useBookingStore` almacena el ID real devuelto por la API

### T2-8 — Variable de entorno servidor

Añadir a `.env.local` del frontend:
```bash
# Server-side only (no NEXT_PUBLIC_)
API_URL=http://localhost:3001/api/v1
```

Distinto de `NEXT_PUBLIC_API_URL` (cliente): `API_URL` es solo para Server Components.

---

## Criterios de aceptación

- [ ] Catálogo muestra vehículos reales de PostgreSQL
- [ ] Filtro por categoría funciona contra la API
- [ ] Con fechas seleccionadas, catálogo muestra solo disponibles
- [ ] Página de detalle `/catalog/:uuid` resuelve con UUID real
- [ ] Página de booking `/book/:uuid` recibe el vehículo real
- [ ] `MOCK_VEHICLES` deja de usarse en catalog, detail y book pages
- [ ] Seed ejecutado — 6 vehículos en tabla `vehicles`
- [ ] `getOccupancyHeat` reemplazada por datos reales (o mantenida como estimación visual hasta que haya datos históricos)

---

## Archivos a modificar

| Archivo | Acción |
|---|---|
| `src/app/catalog/page.tsx` | Fetch real + pasar `vehicles` a CatalogGrid |
| `src/app/catalog/[vehicleId]/page.tsx` | Fetch real por UUID |
| `src/app/book/[vehicleId]/page.tsx` | Eliminar mock, fetch real |
| `src/components/vehicles/CatalogGrid.tsx` | Recibir `vehicles` como props |
| `src/components/shared/HomeClient.tsx` | Pasar fechas del store como query params |

| Archivo | Crear |
|---|---|
| `src/lib/api-mappers.ts` | Conversión shape backend→frontend |

---

## Dependencias
- **Requiere**: Seed de vehículos ejecutado (`backend/src/database/seeds/vehicles.seed.ts`)
- **Requiere**: Backend corriendo en `localhost:3001`
- **No requiere**: INT-SPRINT 1 (el catálogo es público, sin auth)
