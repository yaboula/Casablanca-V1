# Sprints de Integración Frontend ↔ Backend — NEXUS

> Plan completo para eliminar todos los datos mock del frontend y conectarlo al backend NestJS real.

---

## Contexto

El backend NestJS está **100% construido** (S-01 a S-15):
- PostgreSQL con 6 tablas migradas
- Auth JWT + RBAC
- Reservas con Stripe + webhooks idempotentes
- S3 presigned URLs para documentos
- SSE para eventos en tiempo real
- QR smart ticket

El frontend Next.js 15 actualmente **funciona con datos simulados**:
- `src/lib/mock-data.ts` → 6 vehículos hardcodeados
- `src/lib/mock-operator-data.ts` → reservas/docs falsos del operador
- Login/Register → cookies falsas sin firma
- Booking flow → `setTimeout` + ID generado en cliente
- Waiting room → `setTimeout` simula aprobación de documentos

---

## Resumen de Sprints

| Sprint | Nombre | Archivos eliminados | Archivos creados |
|---|---|---|---|
| [INT-1](./INT_SPRINT_1_AuthLayer.md) | Auth Layer | Cookie falsa en login/register, proxy sin firma | `api.ts`, `session/route.ts`, `useUser.ts`, `LogoutButton.tsx` |
| [INT-2](./INT_SPRINT_2_CatalogVehicles.md) | Catálogo & Vehículos | `MOCK_VEHICLES` en catalog/book pages | `api-mappers.ts` |
| [INT-3](./INT_SPRINT_3_BookingFlow.md) | Flujo de Reserva | `setTimeout` + ID fake en BookFlowClient | `StripeProvider.tsx`, `PaymentStep.tsx` |
| [INT-4](./INT_SPRINT_4_CustomerDashboard.md) | Dashboard Cliente | `MOCK_USER`, `getMockReservations()` | — |
| [INT-5](./INT_SPRINT_5_CheckinDocuments.md) | Check-in & Documentos | Upload simulado en DocumentUploadStep | — |
| [INT-6](./INT_SPRINT_6_OperatorPanel.md) | Panel Operador | `mock-operator-data.ts` completo | `server-api.ts` |
| [INT-7](./INT_SPRINT_7_RealtimeQR.md) | Real-time & QR | `setTimeout` en WaitingRoom, QR mock | `sse.ts` |

---

## Grafo de Dependencias

```
INT-1 (Auth)
  │
  ├─── INT-2 (Catálogo) ──────────────────────────────┐
  │         │                                          │
  │         └─── INT-3 (Booking) ────────────────┐    │
  │                     │                        │    │
  │                     ├─── INT-4 (Dashboard) ◄─┘    │
  │                     │                             │
  │                     └─── INT-5 (Check-in) ────┐   │
  │                                               │   │
  └─── INT-6 (Operador) ◄────────────────────────┘   │
               │                                      │
               └─── INT-7 (SSE + QR) ◄────────────────┘
```

**Orden mínimo de ejecución para MVP:**
1. INT-1 → INT-2 → INT-3 → INT-5 → INT-6 → INT-7
2. INT-4 puede hacerse en paralelo tras INT-3

---

## Inventario de mocks a eliminar

### Archivos a eliminar completamente
```
src/lib/mock-operator-data.ts        ← tras INT-6
```

### Archivos a vaciar (mantener estructura pero eliminar datos mock)
```
src/lib/mock-data.ts                 ← tras INT-2 (eliminar MOCK_VEHICLES)
                                       (mantener CATEGORY_LABELS, CATEGORIES, getOccupancyHeat)
```

### Código inline a eliminar por archivo

| Archivo | Mock a eliminar | Sprint |
|---|---|---|
| `src/app/(auth)/login/page.tsx` | `setTimeout` + `document.cookie = ...` | INT-1 |
| `src/app/(auth)/register/page.tsx` | `setTimeout` + `document.cookie = ...` | INT-1 |
| `src/proxy.ts` | Cookie JSON sin firma | INT-1 |
| `src/app/catalog/page.tsx` | Import de `MOCK_VEHICLES` | INT-2 |
| `src/app/catalog/[vehicleId]/page.tsx` | `generateStaticParams` con mock | INT-2 |
| `src/app/book/[vehicleId]/page.tsx` | `MOCK_VEHICLES.find(...)` | INT-2 |
| `src/app/booking/confirmed/page.tsx` | `MOCK_VEHICLES.find(...)` | INT-2 |
| `src/components/vehicles/BookFlowClient.tsx` | `setTimeout` + ID fake | INT-3 |
| `src/app/(customer)/dashboard/page.tsx` | `MOCK_USER`, `getMockReservations()` | INT-4 |
| `src/components/customer/DocumentUploadStep.tsx` | Upload simulado | INT-5 |
| `src/app/waiting-room/page.tsx` | `setTimeout` aprobación fake | INT-5 / INT-7 |
| `src/app/operator/dashboard/page.tsx` | `MOCK_DELIVERIES` | INT-6 |
| `src/app/operator/documents/page.tsx` | `MOCK_PENDING_DOCS` | INT-6 |
| `src/app/operator/search/page.tsx` | `MOCK_DELIVERIES.filter(...)` | INT-6 |
| `src/components/customer/WaitingRoomClient.tsx` | `setTimeout` SSE fake | INT-7 |
| `src/app/smart-ticket/page.tsx` | QR con datos mock | INT-7 |
| `src/components/operator/QRScannerFAB.tsx` | Scan sin validación real | INT-7 |

---

## Variables de entorno necesarias (frontend)

```bash
# .env.local del frontend (Next.js)

# Public — disponible en cliente (browser)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXX

# Server-only — solo Server Components / Route Handlers (Node.js process)
# ATENCIÓN — comportamiento diferente por entorno:
#
#   Desarrollo local:
#     API_URL=http://localhost:3001/api/v1
#
#   Producción / Docker:
#     API_URL=http://backend-nexus:3001/api/v1   ← DNS interno del contenedor
#
#   NUNCA usar localhost en Docker — "localhost" dentro del contenedor de Next.js
#   apunta al propio contenedor, no al backend → ECONNREFUSED en SSR (INT-2, INT-4)
#
# En Vercel:
#     API_URL=https://api.nexus.ma/api/v1        ← dominio público del backend
API_URL=http://localhost:3001/api/v1
```

---

## Cambios necesarios en el Backend para dar soporte al frontend

| Cambio | Sprint que lo requiere |
|---|---|
| `ReservationsService.findMy()` — hacer JOIN con `vehicle` | INT-4 |
| `ReservationsService.findMy()` — incluir `documents[]` agrupados | INT-4 |
| ~~`SseController` — aceptar JWT via `?token=` query param~~ **ELIMINADO** — Next.js SSE Proxy Route (ver INT-7) | — |
| Seed de vehículos ejecutado (`vehicles.seed.ts`) | INT-2 |
| Política CORS configurada en bucket S3 (`PUT` + `Content-Type` desde orígenes frontend) | INT-5 |

---

## Estimación de esfuerzo

| Sprint | Complejidad | Estimación |
|---|---|---|
| INT-1 Auth | Alta (seguridad crítica) | 2-3 días |
| INT-2 Catálogo | Media | 1 día |
| INT-3 Booking | Alta (Stripe Elements) | 2-3 días |
| INT-4 Dashboard | Media | 1-2 días |
| INT-5 Check-in | Media-Alta (S3 upload) | 1-2 días |
| INT-6 Operador | Media | 1-2 días |
| INT-7 SSE + QR | Alta (EventSource + reconexión) | 2 días |
| **Total** | | **~10-15 días** |
