# Refactoring Plan — Admin & Operator Modules

**Proyecto:** NEXUS Car Rental Platform  
**Versión:** 1.0  
**Fecha:** 2026-02-24  
**Autor:** Architecture Team  
**Estado:** APPROVED — Ready for Implementation

---

## 0. Contexto y Motivación

### 0.1 Situación Actual (As-Is)

El código de `admin` y `operator` fue construido en una sola iteración para hacer funcionar el MVP. Funciona, pero presenta deuda técnica que bloqueará cualquier escalado:

| Área              | Problema                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| `OperatorService` | Único servicio de 427 líneas que mezcla entregas, documentos, QR, Stripe y notificaciones SSE             |
| `AdminService`    | Consultas SQL raw mezcladas con lógica de negocio (CQRS implícito roto)                                   |
| Respuestas HTTP   | No hay envelopes consistentes (`{ data, total }` vs objeto directo vs `{ data }`)                         |
| DTOs              | Validaciones `IsOptional` sin límites, sin `@Transform`, sin `@ApiProperty`                               |
| Frontend types    | `(doc as any).user?.fullName` — casteos inseguros para compensar contratos rotos                          |
| Tests             | 0 tests unitarios en `operator.service.ts` y `admin.service.ts`                                           |
| Errores           | No hay logging estructurado — errores silenciosos en BullMQ processors                                    |
| Permisos          | `OPERATOR` puede hacer todo lo que hace `ADMIN` en rutas compartidas (no hay granularidad dentro del rol) |

### 0.2 Objetivo (To-Be)

Convertir estos módulos en código de producción siguiendo los principios SOLID, aplicar arquitectura hexagonal ligera (puertos y adaptadores), y dejar el sistema preparado para:

1. **Multi-tenant** (múltiples aeropuertos/delegaciones)
2. **Auditoría completa** (quién hizo qué y cuándo)
3. **Testing determinístico** al 80% de cobertura de ramas críticas
4. **Observabilidad** — logs estructurados JSON ingestables por Datadog / ELK

---

## 1. Scope del Refactoring

### In Scope ✅

- `backend/src/operator/` — servicio, controlador, módulo, DTOs, processors
- `backend/src/admin/` — servicio, controlador, módulo, DTOs
- `src/app/operator/` — páginas Next.js Server Components del panel
- `src/components/operator/` — componentes cliente del panel
- `src/types/index.ts` — contratos de API compartidos Admin/Operator
- `backend/test/integration/` — tests de integración nuevos

### Out of Scope ❌

- `auth/`, `stripe/`, `s3/`, `qr/` — se usan pero no se refactorizan aquí
- Flujo de reserva del cliente (`booking/`, `check-in/`, `waiting-room/`)
- Base de datos / migraciones — no se tocan tablas

---

## 2. Análisis de Deuda Técnica — Inventario Completo

### 2.1 Backend — `OperatorService` (operator.service.ts)

```
DEUDA-OP-01  getDeliveries() devuelve un tipo anónimo, no un DTO validado
DEUDA-OP-02  getPendingDocuments() hace N llamadas a S3 secuenciales (N+1 async)
DEUDA-OP-03  approveDocument() tiene 80 líneas — viola SRP
DEUDA-OP-04  manualCheckin() y scanQr() duplican la lógica de transición de estado
DEUDA-OP-05  search() sin paginación — toma(50) hardcodeado
DEUDA-OP-06  Cálculo de uploadedAgo inline — no testeable, no i18n
DEUDA-OP-07  (doc as any).user — tipo unsafe, indica relación mal cargada
DEUDA-OP-08  No hay audit log de quién aprobó/rechazó qué documento
```

### 2.2 Backend — `AdminService` (admin.service.ts)

```
DEUDA-AD-01  getStats() ejecuta 6 queries secuenciales — debería ser Promise.all()
DEUDA-AD-02  SQL raw en getStats() — expone lógica de negocio a la capa de datos
DEUDA-AD-03  listAllVehicles() sin paginación — no escala con 10k vehículos
DEUDA-AD-04  createVehicle() sin imagen validation / presign S3 flow
DEUDA-AD-05  deleteVehicle() hace soft-delete (INACTIVE) pero hardDeleteVehicle() es hard-delete — inconsistencia semántica
DEUDA-AD-06  updateUser() permite cambiar CUALQUIER campo incluido el rol del propio admin
DEUDA-AD-07  No hay endpoint para resetear contraseña de usuario
DEUDA-AD-08  AdminStats interface definida en admin.service.ts — debería estar en types compartidos
```

### 2.3 Frontend — Panel Operator

```
DEUDA-FE-01  DocumentReviewList — todos los docs en memoria, sin virtualización
DEUDA-FE-02  DeliveryListClient — useEffect sin abort controller (memory leak)
DEUDA-FE-03  No hay estado de error UI — si serverFetch falla, página en blanco
DEUDA-FE-04  polling cada 30s a /operator/deliveries — debería ser SSE push
DEUDA-FE-05  No hay skeleton loading — UX degradada en conexión lenta
DEUDA-FE-06  PendingDocument y OperatorDelivery definidos en types/index.ts sin Zod schemas — no se valida en runtime
```

---

## 3. Arquitectura Target

### 3.1 Estructura de Módulos Backend (Post-Refactor)

```
backend/src/
├── operator/
│   ├── operator.module.ts
│   ├── operator.controller.ts          ← sólo HTTP, sin lógica
│   ├── services/
│   │   ├── operator-delivery.service.ts    (getDeliveries, checkin, scan)
│   │   ├── operator-document.service.ts   (getPending, approve, reject)
│   │   └── operator-search.service.ts     (search + future: filters)
│   ├── dto/
│   │   ├── delivery-response.dto.ts
│   │   ├── document-response.dto.ts
│   │   ├── scan-qr.dto.ts
│   │   └── reject-document.dto.ts
│   ├── processors/
│   │   └── (sin cambios funcionales — solo logging mejorado)
│   └── __tests__/
│       ├── operator-delivery.service.spec.ts
│       └── operator-document.service.spec.ts
│
└── admin/
    ├── admin.module.ts
    ├── admin.controller.ts
    ├── services/
    │   ├── admin-stats.service.ts         (queries paralelas, caché Redis)
    │   ├── admin-users.service.ts         (CRUD usuarios, paginación)
    │   └── admin-vehicles.service.ts      (CRUD vehículos, S3 integration)
    ├── dto/
    │   ├── admin-stats.dto.ts             (antes era interface en service)
    │   ├── create-vehicle.dto.ts
    │   ├── update-vehicle.dto.ts
    │   └── update-user.dto.ts
    └── __tests__/
        ├── admin-stats.service.spec.ts
        └── admin-users.service.spec.ts
```

### 3.2 Principio de Envelopes HTTP Unificados

Todos los endpoints responden con exactamente uno de estos tres contratos:

```typescript
// Recurso único
{ data: T }

// Colección paginada
{ data: T[]; total: number; page: number; limit: number }

// Acción/mutación con mensaje
{ data: T; message: string }
```

Se implementa vía `ResponseInterceptor` global (ya existe en `common/interceptors/`).

### 3.3 Flujo de Aprobación de Documento (Post-Refactor)

```
Operator UI
    │  POST /operator/documents/:id/approve
    ▼
OperatorController.approveDocument()
    │  llama a
    ▼
OperatorDocumentService.approve(documentId, operatorId)
    │  ┌─────────────────────────────────────────────┐
    │  │  DB Transaction (pessimistic_write)          │
    │  │   1. Lock document                           │
    │  │   2. Assert status = PENDING_REVIEW          │
    │  │   3. document.status = APPROVED              │
    │  │   4. Crear AuditLog entry                    │
    │  │   5. Check if both docs approved             │
    │  │   6. If yes: reservation → AWAITING_CAPTURE  │
    │  │   7. GenerateQrHash                          │
    │  └─────────────────────────────────────────────┘
    │  Post-transaction:
    │   8. SSE: emit per-doc status
    │   9. If bothApproved: enqueue capture-stripe
    │  10. If bothApproved: SSE AWAITING_CAPTURE
    ▼
HTTP 200 { data: { document, reservationStatus }, message: "Documento aprobado." }
```

---

## 4. Plan de Ejecución por Fases

### FASE 1 — Descomposición de Servicios (Semana 1)

**Objetivo:** Dividir los servicios monolíticos sin cambiar comportamiento externo. Todos los tests existentes deben seguir pasando.

#### Tareas Backend

| ID   | Tarea                                                                                                     | Archivo               | Criterio de Aceptación                                   |
| ---- | --------------------------------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------- |
| B1.1 | Crear `operator-delivery.service.ts` con `getDeliveries()`, `manualCheckin()`, `scanQr()` extraídos       | `operator/services/`  | Mismo contrato HTTP, mismos 200/4xx                      |
| B1.2 | Crear `operator-document.service.ts` con `getPendingDocuments()`, `approveDocument()`, `rejectDocument()` | `operator/services/`  | Mismo contrato HTTP                                      |
| B1.3 | Crear `operator-search.service.ts` con `search()`                                                         | `operator/services/`  | Paginación añadida (page/limit)                          |
| B1.4 | Refactorizar `operator.service.ts` para delegar a los 3 nuevos servicios (facade pattern)                 | `operator.service.ts` | Controlador no cambia — backwards compatible             |
| B1.5 | Crear `admin-stats.service.ts` — mover `getStats()` y hacer queries en `Promise.all()`                    | `admin/services/`     | Tiempo de respuesta < 500ms (vs ~1.5s actual secuencial) |
| B1.6 | Crear `admin-users.service.ts` con paginación en `listUsers()`                                            | `admin/services/`     | `GET /admin/users?page=1&limit=20` funcional             |
| B1.7 | Crear `admin-vehicles.service.ts` con paginación en `listAllVehicles()`                                   | `admin/services/`     | `GET /admin/vehicles?page=1&limit=20` funcional          |
| B1.8 | Actualizar `operator.module.ts` y `admin.module.ts` para registrar los nuevos providers                   | ambos módulos         | `npm run build` pasa sin errores                         |

#### Tareas Frontend (mínimas en Fase 1)

| ID   | Tarea                                                                  | Archivo               | Criterio de Aceptación                                                |
| ---- | ---------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------- |
| F1.1 | Añadir error boundary en todas las pages operator                      | `operator/*/page.tsx` | Si fetch falla, muestra `<ErrorState>` en lugar de pantalla en blanco |
| F1.2 | Añadir skeleton loaders en `DeliveryListClient` y `DocumentReviewList` | componentes           | Suspense fallback visible durante carga                               |

---

### FASE 2 — Contratos Fuertes y Validación (Semana 2)

**Objetivo:** Eliminar todos los `as any`, unificar DTOs, añadir validación runtime en frontend.

#### Tareas Backend

| ID   | Tarea                                                                                                 | Descripción                                                   |
| ---- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| B2.1 | Crear `DeliveryResponseDto` con `@Expose()`, `@Type()` — reemplazar tipo anónimo en `getDeliveries()` | Elimina DEUDA-OP-01                                           |
| B2.2 | Crear `PendingDocumentResponseDto` con todos los campos tipados                                       | Elimina cast `(doc as any)`                                   |
| B2.3 | Añadir `@IsUUID()`, `@IsNotEmpty()` a todos los DTOs de entrada operator y admin                      | Elimina DEUDA-OP-07, mejora seguridad                         |
| B2.4 | Mover `AdminStats` interface a `src/types/index.ts` (shared)                                          | Elimina DEUDA-AD-08                                           |
| B2.5 | Aplicar `ClassSerializerInterceptor` en `OperatorController` y `AdminController`                      | Ocultación automática de campos `@Exclude()` (ej: `password`) |
| B2.6 | Validar límites en query params: `limit` máx 100, `page` mín 1                                        | `DefaultValuePipe` + `Max(100)`                               |

#### Tareas Frontend

| ID   | Tarea                                                                                            | Descripción                                                    |
| ---- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| F2.1 | Crear Zod schemas para `PendingDocument`, `OperatorDelivery`, `AdminStats` en `src/lib/schemas/` | Validación runtime de respuestas API                           |
| F2.2 | Wrapper `safeFetch<T>(url, schema)` en `src/lib/api.ts` — valida con Zod antes de usar           | Si respuesta no valida → error controlado, no crash silencioso |
| F2.3 | Reemplazar `serverFetch<PendingDocument[]>` por `safeFetch(url, PendingDocumentArraySchema)`     | Elimina DEUDA-FE-06                                            |

---

### FASE 3 — Performance y Observabilidad (Semana 3)

**Objetivo:** Optimizar queries críticas, añadir caché Redis en stats, añadir audit log.

#### Tareas Backend

| ID   | Tarea                                                                                                 | Descripción                                               | Impacto                                   |
| ---- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------- |
| B3.1 | `getPendingDocuments()` — paralelizar S3 presign: `Promise.all(docs.map(...))` en lugar de secuencial | Elimina DEUDA-OP-02                                       | N llamadas → 1 batch paralelo             |
| B3.2 | `getStats()` — caché Redis con TTL 60s usando `@nestjs/cache-manager`                                 | Elimina DEUDA-AD-01                                       | Stats no bloquean DB en cada page load    |
| B3.3 | Añadir `AuditLog` entity + tabla `audit_logs`                                                         | Nueva entidad + migración `009-CreateAuditLogs.ts`        | Trazabilidad completa                     |
| B3.4 | Registrar en `AuditLog` cada `approveDocument()` y `rejectDocument()`                                 | En `OperatorDocumentService`                              | Quién, cuándo, qué decisión               |
| B3.5 | Logging estructurado con `Logger` de NestJS en todos los servicios                                    | Reemplazar `console.log` por `this.logger.log/warn/error` | Ingestable por ELK / Datadog              |
| B3.6 | Añadir `@Get('deliveries/stats')` — contadores de estado para dashboard                               | `OperatorController`                                      | Widget de resumen diario sin cargar lista |

#### Tareas Frontend

| ID   | Tarea                                                                                      | Descripción         |
| ---- | ------------------------------------------------------------------------------------------ | ------------------- |
| F3.1 | Reemplazar polling de `DeliveryListClient` por SSE subscription a `/sse/operator`          | Elimina DEUDA-FE-04 |
| F3.2 | Virtualización de lista en `DocumentReviewList` con `@tanstack/react-virtual` si docs > 50 | Elimina DEUDA-FE-01 |
| F3.3 | Añadir `abort` en `useEffect` de `DeliveryListClient`                                      | Elimina DEUDA-FE-02 |

---

### FASE 4 — Testing (Semana 4)

**Objetivo:** Cobertura ≥ 80% en ramas críticas de los servicios refactorizados.

#### Tests Unitarios Backend (Jest + mocks)

| Archivo                             | Casos de Test                                                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `operator-delivery.service.spec.ts` | `getDeliveries` fecha vacía → hoy; `manualCheckin` idempotente; `scanQr` hash inválido → 404; transición estado correcto           |
| `operator-document.service.spec.ts` | `approveDocument` primer doc no desencadena Stripe; segundo doc desencadena Stripe; doc ya aprobado → 409; doc no encontrado → 404 |
| `admin-stats.service.spec.ts`       | `getStats` devuelve estructura correcta con DB vacía; queries corren en paralelo (spy en `Promise.all`)                            |
| `admin-users.service.spec.ts`       | `updateUser` no permite autopromover a ADMIN; `listUsers` paginación correcta                                                      |

#### Tests de Integración (Fase 4 adicional)

Referencia: `backend/docs/INTEGRATION_TESTS_LEVEL2.md`

| Suite              | Descripción                                                                     |
| ------------------ | ------------------------------------------------------------------------------- |
| `INT-OPERATOR-001` | Flujo completo: upload doc → pending → approve → AWAITING_CAPTURE → SSE emitido |
| `INT-OPERATOR-002` | Flujo completo: upload doc → pending → reject → SSE emitido con reason          |
| `INT-ADMIN-001`    | Stats con datos sembrando → estructura correcta y valores no negativos          |
| `INT-ADMIN-002`    | CRUD vehículo completo: create → update → delete (con reserva activa → 400)     |

---

## 5. Tabla de Decisiones de Arquitectura (ADR)

### ADR-001: Facade Pattern para backwards compatibility

**Decisión:** `OperatorService` se mantiene como facade que delega a los 3 sub-servicios.  
**Alternativa rechazada:** Eliminar `OperatorService` directamente.  
**Razón:** El controlador y cualquier otro módulo que importe `OperatorService` no requiere cambios. Reduce el riesgo de regresión en Fase 1.

### ADR-002: No aplicar Class Transformer globalmente todavía

**Decisión:** `ClassSerializerInterceptor` solo en controllers Admin y Operator, no global.  
**Razón:** Aplicarlo globalmente en Fase 1 puede romper contratos de otros módulos (reservations, auth) que no tienen `@Expose()` configurado.

### ADR-003: Zod en frontend, no en backend para stats

**Decisión:** La validación de shapes de respuesta se hace en frontend con Zod.  
**Razón:** Backend ya valida con class-validator en DTOs de entrada. Zod en frontend añade una red de seguridad sin duplicar esfuerzo.

### ADR-004: Redis cache para stats con TTL 60s

**Decisión:** `admin/stats` cacheado 60s en Redis.  
**Razón:** Stats son eventualmente consistentes por naturaleza. 60s es imperceptible para el admin pero elimina 6 queries DB por cada page load del dashboard.

### ADR-005: AuditLog como tabla separada, no en la misma entidad

**Decisión:** Nueva tabla `audit_logs` con FK a `reservation_documents`.  
**Alternativa rechazada:** Añadir columnas `reviewed_by` y `reviewed_at` en `reservation_documents` (ya existen, es suficiente para datos pero no para historial).  
**Razón:** Un documento puede ser rechazado → re-subido → aprobado. La tabla `audit_logs` captura el historial completo. Las columnas `reviewedBy/reviewedAt` solo guardan la última acción.

---

## 6. Matriz de Riesgos

| Riesgo                                                           | Probabilidad | Impacto | Mitigación                                                                                               |
| ---------------------------------------------------------------- | ------------ | ------- | -------------------------------------------------------------------------------------------------------- |
| Facade OperatorService rompe inyección DI                        | Media        | Alto    | Fase 1 incluye `npm run build` como gate obligatorio antes de mergear                                    |
| Promise.all() en stats devuelve error parcial silencioso         | Baja         | Medio   | Usar `Promise.allSettled()` + log de errores individuales                                                |
| AuditLog migración falla en prod                                 | Baja         | Alto    | Migración es additive (solo CREATE TABLE) — no toca tablas existentes                                    |
| Zod parse falla en frontend con datos legacy                     | Media        | Medio   | Schema usa `.partial()` + `.catch()` para campos opcionales históricos                                   |
| SSE reemplaza polling → servidor saturado de conexiones abiertas | Media        | Medio   | `SseService` ya implementado con cleanup en `onModuleDestroy` — revisar límite de conexiones simultáneas |

---

## 7. Criterios de Aceptación Globales (Definition of Done)

Para considerar el refactoring COMPLETO, todos estos criterios deben cumplirse:

- [ ] `npm run build` pasa en 0 errores TypeScript
- [ ] `npm run test` — cobertura ≥ 80% en `operator/services/` y `admin/services/`
- [ ] `npm run test:e2e` — suites `auth`, `booking`, `operator` en verde
- [ ] Todos los `(x as any)` eliminados de operator y admin
- [ ] Todos los endpoints tienen envelope consistente `{ data, [total] }`
- [ ] Logs estructurados visibles en `docker logs nexus_backend`
- [ ] Panel operator carga en < 1s (LCP) en localhost con Docker
- [ ] `GET /admin/stats` responde en < 200ms tras primer call (cache warm)

---

## 8. Orden de Ejecución Recomendado

```
Semana 1: B1.1 → B1.2 → B1.3 → B1.4 → B1.8  (backend decompose)
          B1.5 → B1.6 → B1.7                    (admin decompose)
          F1.1 → F1.2                            (frontend safety net)

Semana 2: B2.1 → B2.2 → B2.3 → B2.5           (DTOs + serializer)
          B2.4 → B2.6                            (shared types + guards)
          F2.1 → F2.2 → F2.3                    (Zod schemas)

Semana 3: B3.1 → B3.2                           (performance quick wins)
          B3.3 → B3.4 → B3.5                    (audit + logging)
          B3.6 → F3.1 → F3.3 → F3.2            (SSE + FE cleanup)

Semana 4: [Tests] todos los spec.ts             (cobertura)
          [Integration] INT-OPERATOR-001/002, INT-ADMIN-001/002
          [Review] DoD checklist completo
```

---

## 9. Archivos que NO Cambian

Los siguientes archivos son estables y no deben tocarse durante este refactoring:

- `backend/src/operator/processors/` — BullMQ processors (solo mejora de logging)
- `backend/src/common/guards/` — JwtAuthGuard, RolesGuard
- `backend/src/migrations/` — ninguna migración existente se modifica
- `src/app/operator/layout.tsx` — layout estable
- Flujo de reserva cliente (`book/`, `check-in/`, `waiting-room/`)

---

_Documento generado por el equipo de arquitectura NEXUS — revisión obligatoria antes de iniciar Fase 1._
