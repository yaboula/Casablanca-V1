# INT-SPRINT 4 — Dashboard del Cliente
> **Objetivo**: Reemplazar todos los datos mock del dashboard del cliente (`MOCK_USER`, `getMockReservations()`) con llamadas reales al backend autenticado.

---

## Contexto actual (estado mock)

El archivo `src/app/(customer)/dashboard/page.tsx` (847 líneas) define internamente:

```typescript
// ══════════════════════════════════════════════════════════════
// MOCK DATA — replaced by API calls when backend is ready
// ══════════════════════════════════════════════════════════════

const MOCK_USER = {
  fullName: "Ahmed Benjelloun",
  email: "ahmed@example.com",
  phone: "+212 612 34 56 78",
  memberSince: "2025-11-01",
  totalTrips: 3,
};

function getMockReservations(): MockReservation[] {
  return [
    { id: "CMN-2026-001", vehicleId: "v1", status: "CONFIRMED", ... },
    { id: "CMN-2026-002", vehicleId: "v2", status: "COMPLETED", ... },
    { id: "CMN-2025-008", vehicleId: "v3", status: "COMPLETED", ... },
  ];
}
```

El dashboard actualmente:
- Muestra un usuario ficticio fijo
- Muestra 3 reservas de prueba con fechas próximas a hoy (hardcodeadas)
- El estado de documentos (`passport`, `license`) también está mock
- No hay fetch de ningún tipo

### Endpoints de backend disponibles

```
GET /api/v1/reservations/my
  Headers: Authorization: Bearer <JWT>
  Response: Reservation[]  (propias del usuario autenticado, sin token otros no acceden)

GET /api/v1/auth/me
  Headers: Authorization: Bearer <JWT>
  Response: { id, email, fullName, phone, role }
```

---

## Diferencias de shape: Mock vs Backend

| Campo mock `MockReservation` | Campo backend `Reservation` | Nota |
|---|---|---|
| `vehicleId: "v1"` | `vehicleId: UUID` | Con INT-SPRINT 2 ya son UUIDs reales |
| `vehicle` (embebido con todos los datos) | No incluido por defecto — endpoint devuelve IDs | Backend debe hacer JOIN o frontend hace fetch adicional |
| `documents.passport: DocumentStatus` | No directamente en Reservation — están en tabla `reservation_documents` | Necesita endpoint adicional o incluirlos en el response de mis reservas |
| `includesJawaz`, `includesSIM`, `includesInsurance` | Derivados del campo `features[]` del vehículo | Lógica de mapeo en frontend |
| `totalTrips: 3` | No existe en User — se calcula como `count(*) FROM reservations WHERE user_id = ?` | Backend debe exponer este campo en `/auth/me` o calcularlo en frontend sobre el array |

---

## Tareas

### T4-1 — Refactorizar el dashboard en Server Component + Client Components

El dashboard es un `'use client'` de 847 líneas. Refactorizar arquitectura:

```
DashboardPage (Server Component)
  │  → fetch /auth/me  (datos del usuario)
  │  → fetch /reservations/my (lista de reservas)
  │
  ├─ <UserProfileCard user={user} />         (Client — animaciones)
  ├─ <ActiveReservationCard reservation={} /> (Client — cuenta regresiva)
  ├─ <ReservationList reservations={} />     (Client — lista histórico)
  └─ <DashboardStats stats={} />             (Client — métricas)
```

Esto habilita SSR real con datos frescos en cada carga.

### T4-2 — Data fetching con `apiFetch` autenticado

```typescript
// src/app/(customer)/dashboard/page.tsx — convertir a Server Component
import { cookies } from 'next/headers';

async function getDashboardData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexus_token')?.value;
  if (!token) redirect('/login?redirect=/dashboard');

  const headers = { Authorization: `Bearer ${token}` };
  const API = process.env.API_URL!;

  const [userRes, reservationsRes] = await Promise.all([
    fetch(`${API}/auth/me`, { headers }),
    fetch(`${API}/reservations/my`, { headers }),
  ]);

  const user = await userRes.json();
  const reservations = await reservationsRes.json();

  return { user, reservations };
}

export default async function DashboardPage() {
  const { user, reservations } = await getDashboardData();
  return (
    <div>
      <ActiveReservationCard reservations={reservations} user={user} />
      ...
    </div>
  );
}
```

### T4-3 — Resolver vehículos de las reservas

Cada reserva tiene `vehicleId` pero no el vehículo completo. Dos opciones:

**Opción A (preferida):** Modificar `GET /api/v1/reservations/my` en el backend para hacer JOIN con `vehicles` y devolver `reservation.vehicle` populado. Modificar `ReservationsService.findMy()` → añadir `.leftJoinAndSelect('reservation.vehicle', 'vehicle')`.

**Opción B (sin cambios en backend):** En el frontend, hacer un fetch de los UUIDs de vehículos necesarios al catálogo público.

**Decisión**: Opción A — más eficiente y mantiene el principio de Single Source of Truth.

> **Cambio necesario en backend**: `ReservationsService.findMy()` debe incluir `vehicle` en la query.

### T4-4 — Estado de documentos por reserva

Los documentos están en tabla `reservation_documents`. El dashboard necesita saber si el usuario subió pasaporte y licencia para cada reserva.

**Nuevo endpoint a crear en backend:**
```
GET /api/v1/reservations/my  →  incluir en response: documents: { passport: DocumentStatus | null, license: DocumentStatus | null }
```

O bien, cargar documentos cuando el usuario expande una reserva (lazy load).

### T4-5 — Mapear features del vehículo a includesXxx

```typescript
function mapFeatures(features: string[]) {
  return {
    includesJawaz: features.some(f => f.toLowerCase().includes('jawaz')),
    includesSIM: features.some(f => f.toLowerCase().includes('sim')),
    includesInsurance: features.some(f => f.toLowerCase().includes('seguro')),
  };
}
```

### T4-6 — Eliminar MOCK_USER y getMockReservations

Una vez el Server Component esté funcionando, eliminar completamente:
- El interface `MockReservation` 
- `const MOCK_USER`
- `function getMockReservations()`
- `import { MOCK_VEHICLES } from "@/lib/mock-data"` (ya no necesario)

### T4-7 — Sección de perfil (`src/app/(customer)/profile/page.tsx`)

Revisar y conectar esta página (si existe):
- Mostrar datos reales del usuario desde `/auth/me`
- Formulario de edición de teléfono → `PATCH /api/v1/users/me` (endpoint pendiente de crear en backend)

### T4-8 — Revalidación de datos

El dashboard es crítico para el usuario — los datos deben ser frescos:
- `revalidate: 0` (no cachear) o `cache: 'no-store'` para las llamadas de fetch
- Opcionalmente usar SWR para el polling del estado de la reserva activa

---

## Criterios de aceptación

- [ ] Dashboard muestra nombre e email real del usuario autenticado
- [ ] Lista de reservas viene de PostgreSQL para el user autenticado
- [ ] Cada reserva muestra el vehículo correcto (nombre, imagen)
- [ ] Estado de documentos correcto por reserva
- [ ] Si el usuario no tiene reservas → estado vacío con CTA a "/catalog"
- [ ] `MOCK_USER` y `getMockReservations` eliminados del código
- [ ] Dashboard no accesible sin JWT (redirige a login)

---

## Archivos a modificar

| Archivo | Acción |
|---|---|
| `src/app/(customer)/dashboard/page.tsx` | Convertir a Server Component, eliminar mocks, data fetching real |

| Cambio backend | Razón |
|---|---|
| `ReservationsService.findMy()` — JOIN con vehicle | Para no hacer N+1 fetches en frontend |
| `ReservationsService.findMy()` — incluir documentos | Para mostrar estado de docs en dashboard |

---

## Dependencias
- **Requiere**: INT-SPRINT 1 (login real para tener JWT en cookie)
- **Requiere**: INT-SPRINT 2 (UUIDs reales de vehículos)
- **Requiere**: INT-SPRINT 3 (para que existan reservas reales en la DB)
