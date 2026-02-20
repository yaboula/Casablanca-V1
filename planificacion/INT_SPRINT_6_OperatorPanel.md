# INT-SPRINT 6 — Panel del Operador
> **Objetivo**: Reemplazar todos los datos mock del panel operador (`MOCK_DELIVERIES`, `MOCK_PENDING_DOCS`) con datos reales via API protegida por rol `OPERATOR | ADMIN`.

---

## Contexto actual (estado mock)

| Archivo | Problema |
|---|---|
| `src/app/operator/dashboard/page.tsx` | Usa `MOCK_DELIVERIES` de `mock-operator-data.ts` — datos estáticos |
| `src/app/operator/documents/page.tsx` | Usa `MOCK_PENDING_DOCS` — documentos ficticios |
| `src/app/operator/delivery/page.tsx` | Similar — basado en mock |
| `src/app/operator/search/page.tsx` | `MOCK_DELIVERIES.filter(...)` — búsqueda sobre datos estáticos |
| `src/lib/mock-operator-data.ts` | Toda la fuente de datos del operador |

### Endpoints de backend disponibles

```
[Reservas — requiere OPERATOR | ADMIN]
GET  /api/v1/operator/reservations           → reservas del día (CONFIRMED + IN_PROGRESS)
GET  /api/v1/operator/reservations/search?q= → búsqueda por nombre, id, matrícula
PATCH /api/v1/operator/reservations/:id/checkin  → marca IN_PROGRESS
PATCH /api/v1/operator/reservations/:id/complete → marca COMPLETED

[Documentos — requiere OPERATOR | ADMIN]
GET  /api/v1/operator/documents/pending      → documentos en PENDING_REVIEW
PATCH /api/v1/operator/documents/:id/approve → aprueba documento
PATCH /api/v1/operator/documents/:id/reject  → rechaza + motivo

[QR — requiere OPERATOR | ADMIN]
POST /api/v1/operator/qr/scan                → valida hash del QR code del cliente
```

---

## Arquitectura del panel operador

```
/operator/dashboard   →  Panel principal (entregas del día)
/operator/documents   →  Cola de documentos pendientes de revisión
/operator/search      →  Búsqueda de reservas por nombre/ID
/operator/delivery    →  Detalle de una entrega/check-in
```

---

## Tareas

### T6-1 — Helper de fetch autenticado para el operador

Para los Server Components del operador, crear un helper que lee el JWT de la cookie del servidor:

```typescript
// src/lib/server-api.ts (nuevo archivo)
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function serverFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexus_token')?.value;
  if (!token) redirect('/login?redirect=/operator');

  const res = await fetch(`${process.env.API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (res.status === 403) redirect('/login'); // token expirado o rol inválido
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
```

### T6-2 — Operador Dashboard (`/operator/dashboard`)

**Convertir a Server Component** que hace fetch real:

```typescript
// src/app/operator/dashboard/page.tsx
import { serverFetch } from '@/lib/server-api';

export default async function OperatorDashboardPage() {
  const deliveries = await serverFetch<OperatorDelivery[]>('/operator/reservations');

  const pendingDocsCount = deliveries.filter(d =>
    d.documents.some(doc => doc.status === 'PENDING_REVIEW')
  ).length;

  const totalBalance = deliveries.reduce((sum, d) => sum + d.balanceDueEurCents / 100, 0);

  return (
    <div>
      <StatCard label="Entregas hoy" value={deliveries.length} />
      <StatCard label="Docs pendientes" value={pendingDocsCount} accent={pendingDocsCount > 0} />
      <StatCard label="Balance a cobrar" value={`${totalBalance.toFixed(0)} €`} />
      <DeliveryList deliveries={deliveries} />
    </div>
  );
}
```

**Eliminar:**
- `import { MOCK_DELIVERIES, getDeliveryUrgency, getDocStatusForDelivery } from "@/lib/mock-operator-data"`
- El `useEffect` de re-render cada 30s (usar `revalidate` o router.refresh)

**Urgencia**: calcular en base a `pickupDate` de la reserva real vs `Date.now()`.

### T6-3 — Estado de urgencia basado en tiempo real

`getDeliveryUrgency(arrivalTime)` ya existe en el mock — extraerla a `src/lib/utils.ts` como función pura (no depende de los mocks):

```typescript
// src/lib/utils.ts — añadir
export function getDeliveryUrgency(arrivalTime: string): 'critical' | 'warning' | 'normal' {
  const minutesUntilArrival = differenceInMinutes(new Date(arrivalTime), new Date());
  if (minutesUntilArrival < 30) return 'critical';
  if (minutesUntilArrival < 90) return 'warning';
  return 'normal';
}
```

### T6-4 — Cola de Documentos con Server Actions (`/operator/documents`)

> **Decisión de arquitectura**: las mutaciones del operador (aprobar/rechazar) deben usar **Server Actions** en lugar de `apiFetch` cliente + `router.refresh()`. Razón: `router.refresh()` puede devolver caché obsoleta en Next.js 15 si el fetch del Server Component tiene directivas de caché no `no-store`. `revalidatePath()` dentro de un Server Action hace un **cache purge determinista** — el operador nunca verá un documento ya aprobado en la lista.

**Crear** `src/app/operator/documents/actions.ts`:
```typescript
'use server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

async function getOperatorToken() {
  const token = (await cookies()).get('nexus_token')?.value;
  if (!token) throw new Error('Unauthorized');
  return token;
}

export async function approveDocument(docId: string) {
  const token = await getOperatorToken();
  const res = await fetch(`${process.env.API_URL}/operator/documents/${docId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Approve failed');
  revalidatePath('/operator/documents');  // purge garantizado y determinista
}

export async function rejectDocument(docId: string, reason: string) {
  const token = await getOperatorToken();
  const res = await fetch(`${process.env.API_URL}/operator/documents/${docId}/reject`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('Reject failed');
  revalidatePath('/operator/documents');
}
```

**`DocumentsPage`** — Server Component con fetch:
```typescript
// src/app/operator/documents/page.tsx
import { serverFetch } from '@/lib/server-api';
import DocumentReviewList from './_components/DocumentReviewList';

export default async function DocumentsPage() {
  const pending = await serverFetch<PendingDocument[]>('/operator/documents/pending');
  return <DocumentReviewList documents={pending} />;
}
```

**`DocumentReviewList`** — Client Component que llama al Server Action (sin `apiFetch`, sin `router.refresh()`):
```typescript
'use client';
import { approveDocument, rejectDocument } from '../actions';
import { toast } from 'sonner';

export default function DocumentReviewList({ documents }: { documents: PendingDocument[] }) {
  async function handleApprove(docId: string) {
    try {
      await approveDocument(docId); // Server Action → revalidatePath automático
      toast.success('Documento aprobado.');
    } catch { toast.error('Error al aprobar.'); }
  }

  async function handleReject(docId: string, reason: string) {
    try {
      await rejectDocument(docId, reason);
      toast.success('Documento rechazado.');
    } catch { toast.error('Error al rechazar.'); }
  }
  // ...
}
```

### T6-5 — Búsqueda de Reservas (`/operator/search`)

**Reemplazar** `MOCK_DELIVERIES.filter(...)` por llamada al backend:

```typescript
// src/app/operator/search/page.tsx
'use client';

async function search(q: string) {
  const res = await apiFetch<OperatorDelivery[]>(
    `/operator/reservations/search?q=${encodeURIComponent(q)}`,
    { auth: true }
  );
  setResults(res);
}
```

El backend busca por: nombre del cliente, ID de reserva (parcial), matrícula del vehículo.

### T6-6 — Check-in con Server Action

La misma arquitectura que T6-4 — todas las mutaciones del operador van vía Server Actions:

**Crear** `src/app/operator/dashboard/actions.ts`:
```typescript
'use server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function checkinReservation(reservationId: string) {
  const token = (await cookies()).get('nexus_token')?.value;
  const res = await fetch(
    `${process.env.API_URL}/operator/reservations/${reservationId}/checkin`,
    { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error('Checkin failed');
  revalidatePath('/operator/dashboard'); // la lista del dashboard se purga y recarga
}

export async function completeReservation(reservationId: string) {
  const token = (await cookies()).get('nexus_token')?.value;
  const res = await fetch(
    `${process.env.API_URL}/operator/reservations/${reservationId}/complete`,
    { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error('Complete failed');
  revalidatePath('/operator/dashboard');
}
```

El componente cliente llama directamente al Server Action — sin `apiFetch`, sin `router.refresh()`:
```typescript
// En DeliveryCard (Client Component)
async function handleCheckin() {
  try {
    await checkinReservation(delivery.id);
    toast.success('Check-in registrado.');
  } catch { toast.error('Error al registrar check-in.'); }
}
```

### T6-7 — Página de perfil operador (`/operator/profile`)

Mostrar datos reales del operador desde `/auth/me` — mismo hook `useUser()` de INT-SPRINT 1.

### T6-8 — Eliminar `mock-operator-data.ts`

Una vez todas las páginas del operador usen datos reales, eliminar el archivo `src/lib/mock-operator-data.ts` y sus imports en:
- `src/app/operator/dashboard/page.tsx`
- `src/app/operator/documents/page.tsx`
- `src/app/operator/search/page.tsx`

---

## Tipos necesarios en frontend

```typescript
// src/types/index.ts — añadir
export interface OperatorDelivery {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  vehicle: Vehicle;
  pickupDate: string;         // ISO8601 — momento de llegada al aeropuerto
  returnDate: string;         // ISO8601
  pickupLocation: PickupLocation;
  status: ReservationStatus;
  balanceDueEUR: number;      // mapeado de balanceDueEurCents/100
  documents: {
    id: string;
    type: 'PASSPORT' | 'DRIVING_LICENSE';
    status: DocumentStatus;
    fileUrl?: string;
  }[];
  qrCodeHash: string | null;
}
```

---

## Criterios de aceptación

- [ ] Panel operador muestra reservas reales del día desde PostgreSQL
- [ ] Contador "Balance a cobrar" refleja sum real de reservas confirmadas
- [ ] Cola de documentos muestra los `PENDING_REVIEW` reales
- [ ] Aprobar/rechazar documento actualiza la DB y re-renderiza la lista
- [ ] Búsqueda funciona contra el backend (no sobre un array estático)
- [ ] Sin `MOCK_DELIVERIES` ni `MOCK_PENDING_DOCS` en el código
- [ ] Acceso a `/operator/*` sin rol OPERATOR → redirect a login

---

## Archivos a modificar

| Archivo | Acción |
|---|---|
| `src/app/operator/dashboard/page.tsx` | Fetch real, eliminar mock |
| `src/app/operator/documents/page.tsx` | Fetch real, eliminar mock |
| `src/app/operator/search/page.tsx` | Búsqueda real, eliminar mock |
| `src/lib/mock-operator-data.ts` | **ELIMINAR** (al final del sprint) |

| Archivo | Crear |
|---|---|
| `src/lib/server-api.ts` | Helper de fetch autenticado para Server Components |

---

## Dependencias
- **Requiere**: INT-SPRINT 1 (JWT + sistema de roles en proxy)
- **Requiere**: INT-SPRINT 3 (reservas reales en base de datos)
- **Requiere**: INT-SPRINT 5 (documentos reales subidos a S3)
- **No bloquea INT-SPRINT 7** (QR scan se puede implementar en paralelo)
