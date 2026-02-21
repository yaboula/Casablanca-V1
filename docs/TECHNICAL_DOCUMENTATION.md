# NEXUS — Documentación Técnica Completa

> Versión: Sprint 7 completo + Session Fixes · Estado: Funcional en entorno local  
> Última actualización: 20 febrero 2026

---

## Índice

1. [Visión General del Sistema](#1-visión-general-del-sistema)
2. [Arquitectura Global](#2-arquitectura-global)
3. [Infraestructura y DevOps](#3-infraestructura-y-devops)
4. [Backend — NestJS](#4-backend--nestjs)
   - 4.1 Bootstrap & Configuración global
   - 4.2 Módulo Auth
   - 4.3 Módulo Users
   - 4.4 Módulo Vehicles
   - 4.5 Módulo Reservations (Saga pattern)
   - 4.6 Módulo Stripe & Webhooks
   - 4.7 Módulo Documents & S3
   - 4.8 Módulo Operator
   - 4.9 Módulo SSE (Server-Sent Events)
   - 4.10 Módulo Chat
   - 4.11 Módulo QR
   - 4.12 Módulo Health
   - 4.13 Capa Common (Guards, Filters, Interceptors)
   - 4.14 Base de Datos & Migraciones
5. [Frontend — Next.js](#5-frontend--nextjs)
   - 5.1 Estructura de rutas (App Router)
   - 5.2 Capa de datos (api.ts, api-mappers.ts)
   - 5.3 Gestión de estado (Zustand stores)
   - 5.4 Sistema i18n
   - 5.5 Flujo de autenticación (cookies HttpOnly)
   - 5.6 Flujo de reserva (BookingPanel → PaymentStep)
   - 5.7 Panel del cliente (Dashboard)
   - 5.8 Check-in & Documentos
   - 5.9 Sala de espera (WaitingRoom + SSE)
   - 5.10 Smart Ticket & QR
   - 5.11 Panel del operador
   - 5.12 Catálogo de vehículos
6. [Flujos de negocio end-to-end](#6-flujos-de-negocio-end-to-end)
7. [Seguridad](#7-seguridad)
8. [Decisiones de diseño relevantes](#8-decisiones-de-diseño-relevantes)
9. [Bugs conocidos y corregidos](#9-bugs-conocidos-y-corregidos)
10. [TODOs y deuda técnica](#10-todos-y-deuda-técnica)
11. [Variables de entorno](#11-variables-de-entorno)
12. [Referencia de API REST](#12-referencia-de-api-rest)

---

## 1. Visión General del Sistema

**NEXUS** es una plataforma de alquiler de vehículos premium en el aeropuerto Mohamed V (Casablanca, Marruecos). El sistema cubre el ciclo completo:

| Fase | Descripción |
|------|-------------|
| **Descubrimiento** | Catálogo de vehículos con búsqueda por fechas y categorías |
| **Reserva** | Booking con pago de depósito vía Stripe (authorize-only) |
| **Verificación** | El cliente sube pasaporte + carnet de conducir vía S3 |
| **Revisión** | El operador revisa documentos desde su panel |
| **Entrega** | Operador escanea QR → vehículo en estado IN_PROGRESS |
| **Devolución** | Completada por el operador → ciclo cerrado |

**Stack tecnológico:**

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16.1.6 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Zustand, Stripe.js |
| Backend | NestJS, TypeORM, PostgreSQL 16, Redis 7, BullMQ, Stripe Node SDK v14, AWS SDK v3 |
| Auth | JWT (RS256/HS256), HttpOnly cookies, Passport.js |
| Realtime | Server-Sent Events (SSE) — RxJS Subject per reservation |
| Infra local | Docker Compose (postgres:16, redis:7, node:20-alpine) |
| Puertos locales | Backend: `:3900` (Docker `3900→3001`), Frontend: `:4000` |

---

## 2. Arquitectura Global

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser / PWA                                                    │
│  Next.js App (puerto 4000)                                        │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  App Router  │  │  Zustand     │  │  Stripe.js Elements  │   │
│  │  (RSC + CC)  │  │  (stores)    │  │  (iframe payment)    │   │
│  └──────┬───────┘  └──────────────┘  └──────────────────────┘   │
│         │ fetch (browser) / server fetch (RSC)                   │
└─────────┼───────────────────────────────────────────────────────┘
          │ HTTP / SSE
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  NestJS API (puerto 3001 container / 3900 host)                   │
│  Global prefix: /api/v1                                           │
│                                                                   │
│  AuthModule → JwtStrategy → Guards                                │
│  VehiclesModule → PostgreSQL                                      │
│  ReservationsModule → Saga (DataSource queryRunner)               │
│  StripeModule → Stripe API + Webhooks (idempotent)                │
│  DocumentsModule → S3Module (presigned PUT/GET)                   │
│  OperatorModule → Review + QR scan                                │
│  SseModule → RxJS Subjects (per reservation)                      │
│  ChatModule → persist + SSE emit                                  │
│  QrModule → HMAC-SHA256 (crypto.timingSafeEqual)                  │
│  BullMQ queues: reservation-expiry, capture-stripe, doc-cleanup   │
└─────────────────────────────────────────────────────────────────┘
          │
          ├──▶ PostgreSQL 16 (nexus_postgres)
          ├──▶ Redis 7 (nexus_redis) ← BullMQ
          └──▶ AWS S3 (nexus-documents bucket)
                    ▲
                    │ presigned PUT (frontend upload direct)
                    └── Browser
```

**Nota sobre SSE:** El proxy Next.js en `src/app/api/sse/proxy/route.ts` actúa como intermediario: lee la cookie HttpOnly `nexus_token`, inyecta el header `Authorization: Bearer`, y hace pipe del stream NestJS al navegador. El JWT **nunca aparece en ninguna URL**.

---

## 3. Infraestructura y DevOps

### 3.1 Docker Compose (`backend/docker/docker-compose.yml`)

```yaml
services:
  nexus_postgres:  # postgres:16-alpine
  nexus_redis:     # redis:7-alpine
  nexus_backend:   # node:20-alpine (multi-stage build)
    ports: "3900:3001"   # Hyper-V reserva el rango 2981–3580
```

**Conflicto histórico:** Windows Hyper-V reserva bloques de 100 puertos automáticamente (2981–3580 bloqueados). Se usa `:3900` en host para el backend y `:4000` para Next.js.

### 3.2 Dockerfile (`backend/docker/Dockerfile`)

Multi-stage build:

1. **Stage `builder`** — `node:20-alpine`, instala deps de producción, compila TypeScript con `tsc`.
2. **Stage `production`** — copia solo `dist/` y `node_modules/`. No incluye fuentes TypeScript en imagen final.

**Fix crítico aplicado:** Se eliminó la línea duplicada `COPY --from=builder /app/src/migrations ./dist/migrations` que sobreescribía los `.js` compilados con los `.ts` originales, causando `SyntaxError: Unexpected strict mode reserved word` al arrancar.

### 3.3 Migraciones

6 migraciones aplicadas secuencialmente via TypeORM CLI:

| # | Nombre | Tabla creada |
|---|--------|-------------|
| 001 | CreateUsersTable | `users` |
| 002 | CreateVehiclesTable | `vehicles` |
| 003 | CreateReservationsTable | `reservations` |
| 004 | CreateReservationDocumentsTable | `reservation_documents` |
| 005 | CreateChatMessagesTable | `chat_messages` |
| 006 | CreateStripeWebhookLogsTable | `stripe_webhook_logs` |

**Seed:** `backend/src/database/seeds/vehicles.seed.js` — inserta la flota inicial (SEDAN, SUV, LUXURY, COMPACT) con precios en centavos EUR.

---

## 4. Backend — NestJS

### 4.1 Bootstrap & Configuración global (`main.ts`)

**Características activadas en bootstrapping:**

| Feature | Implementación |
|---------|---------------|
| `rawBody: true` | Requerido para verificación de firma Stripe webhook |
| `helmet()` | Cabeceras de seguridad HTTP (CSP desactivado, lo gestiona Next.js) |
| `ValidationPipe` | `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` — rechaza campos extra y transforma tipos automáticamente |
| `AllExceptionsFilter` | Filtro global: garantiza que el cliente nunca reciba stack traces |
| `LoggingInterceptor` | JSON estructurado por request: method, path, statusCode, duration, userId, ip |
| `ThrottlerModule` | 60 req/min global, 10/min register, 5/min login |
| `SwaggerModule` | Documentación OpenAPI en `/api/v1/docs` |
| CORS dinámico | Callback function que whitelist `:3000/:3001/:3900/:4000` + `FRONTEND_URL` env |

**Prefijo global:** `/api/v1` (configurable via `API_PREFIX` env).

### 4.2 Módulo Auth

**Archivos:** `auth.controller.ts`, `auth.service.ts`, `strategies/jwt.strategy.ts`, `dto/`

#### Endpoints

| Método | Ruta | Auth | Rate limit | Descripción |
|--------|------|------|-----------|-------------|
| POST | `/auth/register` | No | 10/min | Crea usuario, devuelve access + refresh JWT |
| POST | `/auth/login` | No | 5/min | Valida credenciales, devuelve access + refresh JWT |
| POST | `/auth/refresh` | No | 10/min | Renueva access + refresh tokens con un refresh token válido |
| GET | `/auth/me` | Sí | Global | Devuelve el usuario autenticado |

#### Flujo de registro/login

1. `AuthController` recibe el DTO, delega a `AuthService`.
2. En **register**: `bcrypt.hash(password, 12)` → `usersService.create()`.
3. En **login**: `usersService.findByEmailWithPassword()` (selección explícita de `password_hash` que normalmente está excluido) → `bcrypt.compare()`.
4. `buildTokenResponse()`: firma JWT con payload `{ sub: userId, email, role }`, extrae `expiresIn` de config, elimina `passwordHash` de la respuesta.

#### JWT Strategy (`jwt.strategy.ts`)

- Extrae el Bearer token del header `Authorization`.
- Verifica firma y expiración.
- Carga el `User` completo desde DB en cada request (garantiza que los cambios de rol/desactivación toman efecto inmediatamente).
- Lanza `401` si el usuario no existe o tiene `isActive = false`.

#### DTOs con validación

```typescript
// register.dto.ts (ejemplo)
@IsEmail()         email: string;
@MinLength(8)      password: string;
@Length(2, 120)    fullName: string;
@IsOptional()
@Matches(/^\+?[0-9]{7,15}$/) phone?: string;
```

### 4.3 Módulo Users

**Entidad `User`:**

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID (PK) | `PrimaryGeneratedColumn('uuid')` |
| `email` | varchar(255) | `UNIQUE INDEX` |
| `password_hash` | varchar | `select: false` — nunca incluido por defecto |
| `full_name` | varchar(120) | |
| `role` | enum | `USER \| OPERATOR \| ADMIN` |
| `phone` | varchar(30) | nullable |
| `is_active` | boolean | `default: true` |

**Métodos clave en `UsersService`:**
- `findByEmailWithPassword()` — selección explícita de `password_hash` solo para login.
- `findById()` — usado por `JwtStrategy.validate()`.
- `updateMe(id, { phone? })` — actualiza teléfono del usuario autenticado. Usa `update()` + `findOneOrFail()` para retornar entidad actualizada.

**`UsersController` (añadido sesión 20-02-2026):**

| Método | Ruta | Guard | Descripción |
|--------|------|-------|-------------|
| `GET` | `/api/v1/users/me` | `JwtAuthGuard` | Devuelve perfil del usuario autenticado via `@CurrentUser()` |
| `PATCH` | `/api/v1/users/me` | `JwtAuthGuard` | Actualiza teléfono. Body: `UpdateMeDto { phone?: string }` (validado con regex `+?[0-9]{7,15}`) |

> **Nota:** Antes de esta sesión `UsersModule` no exponía ningún controlador. Las llamadas `PATCH /users/me` desde `profile/page.tsx` devolvían 404.

### 4.4 Módulo Vehicles

**Entidad `Vehicle`:**

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID (PK) | |
| `brand` / `model` | varchar | |
| `category` | enum | `SEDAN \| SUV \| LUXURY \| COMPACT` — INDEX |
| `price_per_day_eur_cents` | integer | Precio en centavos EUR, avoiding float issues |
| `image_url` | varchar(500) | Imagen principal |
| `image_urls` | text[] | Galería (PostgreSQL array) |
| `transmission` | enum | `AUTOMATIC \| MANUAL` |
| `seats` | smallint | |
| `luggage_count` | smallint | |
| `features` | text[] | Tags como 'SIM 5GB', 'Tag Jawaz', 'GPS integrado' |
| `status` | enum | `AVAILABLE \| RENTED \| MAINTENANCE \| INACTIVE` — INDEX |

**Endpoints:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/vehicles` | Lista todos los AVAILABLE, orden ASC por precio |
| GET | `/vehicles/available?pickupDate=&returnDate=&category=` | Disponibilidad real con exclusión por solapamiento |
| GET | `/vehicles/:id` | Detalle de un vehículo |

**`findAvailable()` — lógica de disponibilidad:**

```sql
SELECT vehicle.*
FROM vehicles
WHERE vehicle.status = 'AVAILABLE'
  AND vehicle.id NOT IN (
    SELECT r.vehicle_id FROM reservations r
    WHERE r.status IN ('PENDING_DEPOSIT','AWAITING_CAPTURE','CONFIRMED','IN_PROGRESS')
      AND r.pickup_date < :returnDate
      AND r.return_date > :pickupDate
  )
ORDER BY vehicle.price_per_day_eur_cents ASC
```

Escala correctamente hasta ~3.000 reservas (MVP). Comentario en código indica migrar a `tsrange + GiST` cuando la flota supere 500.

### 4.5 Módulo Reservations (Saga pattern)

**Entidad `Reservation`:**

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID (PK) | |
| `user_id` | UUID FK | INDEX |
| `vehicle_id` | UUID FK | INDEX, `eager: true` |
| `pickup_date` / `return_date` | timestamptz | |
| `total_days` | integer | Calculado server-side |
| `price_per_day_eur_cents` | integer | Copiado del vehículo en el momento de creación |
| `deposit_eur_cents` | integer | Siempre 1000 (10 EUR) |
| `total_eur_cents` | integer | `pricePerDay × totalDays` |
| `status` | enum | Ver diagrama de estados abajo |
| `pickup_location` | enum | `CMN_T1 \| CMN_T2` |
| `stripe_payment_intent_id` | varchar | |
| `qr_code_hash` | varchar | HMAC-SHA256 |
| `operator_id` | UUID | Nullable — quién procesó la entrega |
| `rejection_reason` | text | Si el operador rechaza |

**Diagrama de estados:**

```
PENDING_DEPOSIT
    │ (documentos aprobados → operador)
    ▼
AWAITING_CAPTURE ──────────────────────────────────┐
    │ (BullMQ capture-stripe job)                   │
    ▼                                               │
CONFIRMED                                           │ (Stripe webhook: payment_intent.failed)
    │ (operador escanea QR)                         │
    ▼                                               ▼
IN_PROGRESS                                     CANCELLED
    │ (operador marca devolución)
    ▼
COMPLETED
```

**`create()` — Saga Phase 1 (transacción ACID):**

1. Validación de fechas (no pasadas, returnDate > pickupDate, mínimo 1 día).
2. `queryRunner.startTransaction()`.
3. `SELECT ... FOR UPDATE` sobre el vehículo → bloqueo pesimista, previene overbooking concurrente.
4. Verifica que el vehículo esté `AVAILABLE`.
5. Contador de reservas solapadas en `BLOCKING_STATUSES` → `ConflictException` si > 0.
6. **Precio calculado server-side** (Zero Trust — nunca se confía en el precio del cliente).
7. `stripeService.createPaymentIntent(depositEurCents, reservationId, { capture_method: 'manual' })` — autoriza sin capturar.
8. Guarda reserva con `PENDING_DEPOSIT` y `stripePaymentIntentId`.
9. `queryRunner.commitTransaction()`.
10. BullMQ job de expiración programado (si el cliente no paga en X minutos → cancelar).

**Saga Phase 2 (fuera de transacción):**
- Frontend recibe `stripeClientSecret` → Stripe Elements completa el pago.
- Operador revisa documentos → `AWAITING_CAPTURE`.
- BullMQ processor captura el Payment Intent → `CONFIRMED`.

**Endpoints:**

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/reservations` | USER | Crea reserva |
| GET | `/reservations/my` | USER | Mis reservas (OP/ADMIN ven todas) |
| GET | `/reservations/:id` | USER | Una reserva (propietario o OP/ADMIN) |
| PATCH | `/reservations/:id/cancel` | USER | Cancela (USER solo PENDING_DEPOSIT) |

### 4.6 Módulo Stripe & Webhooks

**`StripeService`:**

| Método | Descripción |
|--------|-------------|
| `createPaymentIntent(amountCents, reservationId, metadata)` | `capture_method: 'manual'`, idempotency key: `pi-create-{reservationId}` |
| `capturePaymentIntent(paymentIntentId)` | Captura, idempotency key: `pi-capture-{piId}` |
| `cancelPaymentIntent(paymentIntentId)` | Cancela antes de captura |
| `constructWebhookEvent(rawBody, signature)` | Verifica firma HMAC de Stripe |

**`WebhooksService` — Patrón de idempotencia:**

```
1. INSERT stripe_webhook_logs (event_id PRIMARY KEY)
2. Si duplicate key (PG 23505) → evento ya procesado, skip
3. Handle event dentro de la misma transacción
4. Commit → processed = true
```

Esto hace que cada retry de Stripe sea seguro bajo entrega at-least-once.

**Eventos Stripe manejados:**

| Evento | Acción |
|--------|--------|
| `payment_intent.succeeded` | Marca reserva CONFIRMED, genera QR, emite SSE |
| `payment_intent.payment_failed` | Marca reserva CANCELLED |
| `payment_intent.canceled` | Marca reserva CANCELLED |

**Endpoint Webhook:**

```
POST /stripe/webhook
Header: stripe-signature (verificado con STRIPE_WEBHOOK_SECRET)
Body: raw (rawBody: true en bootstrap)
```

### 4.7 Módulo Documents & S3

**`DocumentsService` — flujo en 2 pasos:**

**Paso 1 — Presign:** `POST /documents/presign`
- Valida que la reserva exista y pertenezca al usuario.
- Verifica que el estado permita subidas (`PENDING_DEPOSIT` o `CONFIRMED`).
- Verifica que no exista ya un documento `APPROVED` del mismo tipo.
- Llama a `S3Service.generatePresignedUpload()` → devuelve URL presigned PUT (expira en 900s por defecto).

**Paso 2 — Confirm:** `POST /documents/confirm`
- El frontend ha completado el upload directo a S3.
- Crea registro `ReservationDocument` con `status: PENDING_REVIEW`.

**`S3Service`:**

- Región: `eu-west-3` (París) por defecto.
- File key pattern: `docs/{userId}/{reservationId}/{type}-{timestamp}.jpg`
  - Encoding seguro — previene path traversal.
  - `ContentType: 'image/jpeg'` hardcodeado.
- URL de lectura: presigned GET, expira en **5 minutos** (`readExpiry = 300`).
- `deleteObject()` — usado por BullMQ `document-cleanup` job.

**Entidad `ReservationDocument`:**

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | |
| `user_id` | UUID FK | |
| `reservation_id` | UUID FK | `onDelete: 'CASCADE'` |
| `type` | enum | `PASSPORT \| DRIVING_LICENSE` |
| `file_key` | varchar(500) | Nunca la URL — se genera presigned en cada lectura |
| `status` | enum | `PENDING_REVIEW \| APPROVED \| REJECTED` |
| `rejection_reason` | text | nullable |

### 4.8 Módulo Operator

**Todos los endpoints requieren `OPERATOR` o `ADMIN` role.**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/operator/deliveries?date=` | Reservas CONFIRMED para fecha dada (default: hoy), orden por pickupDate ASC |
| POST | `/operator/delivery/:id/scan-qr` | Escanea QR → IN_PROGRESS (idempotente: segundo scan devuelve 409) |
| GET | `/operator/search?q=` | Búsqueda case-insensitive por nombre/teléfono/reservationId |
| GET | `/operator/documents/pending` | Documentos PENDING_REVIEW (oldest-first — cola justa) |
| PATCH | `/operator/documents/:id/approve` | Aprueba documento → emite SSE |
| PATCH | `/operator/documents/:id/reject` | Rechaza con motivo → emite SSE |

**Flujo de aprobación de documentos:**

1. Operador llama `approve(docId)`.
2. En transacción: documento → `APPROVED`.
3. Si **ambos** documentos (PASSPORT + DRIVING_LICENSE) están aprobados para la reserva → reserva → `AWAITING_CAPTURE` + encolar `capture-stripe` job en BullMQ.
4. `sseService.emitDocumentStatus(reservationId, 'AWAITING_CAPTURE')` → WaitingRoom del cliente actualiza UI.

**`scanQr()` — idempotencia:**

- `reservation.qrCodeHash !== providedHash` → `NotFoundException`.
- `reservation.status === IN_PROGRESS` → devuelve 409 (no 500).
- Actualiza `status = IN_PROGRESS` y `operatorId`.

### 4.9 Módulo SSE (Server-Sent Events)

**`SseService`:**

- Map en memoria: `reservationId → Subject<SseEvent>`.
- **Keepalive:** `interval(15_000)` emite ping para prevenir que proxies corten la conexión.
- Al emitir estado final (`APPROVED` o `REJECTED`) → `setTimeout(1s)` → `subject.complete()` + elimina del Map (limpieza de memoria).

**Limitación MVP:** En memoria de una sola instancia. Para multi-instancia → migrar a Redis Pub/Sub.

**Endpoints SSE:**

| Ruta | Auth | Descripción |
|------|------|-------------|
| GET `/sse/reservation/:id` | JWT | Stream de estado para el cliente en WaitingRoom |
| GET `/sse/operator/chat` | JWT (OPERATOR/ADMIN) | Stream de nuevos mensajes de chat |

**Proxy Next.js (`src/app/api/sse/proxy/route.ts`):**
- Lee cookie `nexus_token` (HttpOnly, invisible a JavaScript).
- Añade header `Authorization: Bearer {token}`.
- Hace pipe del stream al browser con `export const dynamic = "force-dynamic"`.

### 4.10 Módulo Chat

**`ChatService.create()`:**
1. Si `reservationId` presente, valida que exista y pertenezca al usuario.
2. Crea `ChatMessage` con `sender: 'user' | 'operator'` según el rol.
3. Persiste en BD.
4. `sseService.emitNewChatMessage()` → stream del operador recibe en tiempo real.

**Endpoints:**

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/chat` | USER | Envía mensaje |
| GET | `/chat/reservation/:id` | USER | Historial de una reserva |
| GET | `/chat/all` | OPERATOR/ADMIN | Todos los mensajes (panel operador) |

### 4.11 Módulo QR

**`QrService`:**

Genera un HMAC-SHA256 determinista:

```
payload = "{reservationId}|{userId}|{pickupDate.toISOString()}"
hash = HMAC-SHA256(QR_SIGNING_SECRET, payload)
```

- La misma entrada **siempre** produce el mismo hash → idempotente.
- Verificación con `crypto.timingSafeEqual()` → previene ataques de timing.
- El secreto (`QR_SIGNING_SECRET`, mínimo 32 chars) debe ser seguro — sin él un atacante no puede forjar un QR válido.

### 4.12 Módulo Health

```
GET /api/v1/health
→ { "status": "ok", "db": "ok", "version": "1.0.0" }
```

Verifica conectividad a PostgreSQL con un query simple. Usado por Docker Compose `healthcheck`.

### 4.13 Capa Common

**`JwtAuthGuard`** — extiende `AuthGuard('jwt')` de Passport. Adjunta el `User` completo a `request.user`.

**`RolesGuard`** — lee el decorador `@Roles(...)` del handler/controller. Si el usuario no tiene el role requerido → `403 Forbidden`.

**`CurrentUser` decorator** — extrae `request.user` del contexto de ejecución.

**`AllExceptionsFilter` — forma de error unificada:**

```json
{
  "statusCode": 409,
  "message": "Resource already exists",
  "errors": ["email must be unique"],
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

- Gestiona `HttpException` → extrae statusCode y mensaje.
- Gestiona `QueryFailedError` (TypeORM):
  - PG `23505` (unique violation) → 409 Conflict.
  - PG `23503` (foreign key violation) → 422 Unprocessable.
- Cualquier otro error → 500 sin exponer stack trace.

**`LoggingInterceptor` — JSON estructurado:**

```json
{
  "level": "info",
  "method": "POST",
  "path": "/api/v1/reservations",
  "statusCode": 201,
  "duration": 145,
  "userId": "3f4a...",
  "ip": "::1",
  "timestamp": "2025-01-01T10:00:00.000Z"
}
```

Compatible con CloudWatch / Datadog / ELK.

### 4.14 Base de Datos & Migraciones

**Configuración TypeORM (`database.config.ts`):**

| Parámetro | Valor | Motivo |
|-----------|-------|--------|
| `synchronize: false` | ✓ | ESTRICTAMENTE PROHIBIDO en producción |
| `migrationsRun: false` | ✓ | Las migraciones se ejecutan manualmente |
| `pool.max: 20` | 20 conexiones | Balance carga/memoria |
| `logging` | `['query','error']` en dev, `['error']` en prod | Verbosidad controlada |

**Validación de entorno (`env.validation.ts` via Zod):**

La aplicación **no arranca** si alguna variable requerida falta o es inválida. Ejemplos:
- `DATABASE_URL` — debe ser URL válida postgresql://
- `JWT_SECRET` — mínimo 32 caracteres
- `STRIPE_SECRET_KEY` — debe empezar por `sk_`
- `STRIPE_WEBHOOK_SECRET` — debe empezar por `whsec_`
- `QR_SIGNING_SECRET` — mínimo 32 caracteres
- `FRONTEND_URL` — debe ser URL válida

---

## 5. Frontend — Next.js

### 5.1 Estructura de rutas (App Router)

```
src/app/
├── layout.tsx                    # Root layout — fonts, providers, HtmlDirSync
├── page.tsx                      # Landing page (/home)
├── (auth)/
│   ├── register/page.tsx         # Registro de usuario
│   └── login/page.tsx            # Login
├── (customer)/
│   └── dashboard/
│       ├── page.tsx              # Server Component — fetch reservas
│       └── DashboardClient.tsx   # Client Component — UI interactiva
├── book/[vehicleId]/
│   └── page.tsx                  # Paso de reserva (datos + pago)
├── booking/
│   └── page.tsx                  # Confirmación post-pago
├── catalog/
│   └── page.tsx                  # Server Component — fetch catálogo con filtros
├── check-in/
│   └── page.tsx + CheckInClient  # Subida de documentos
├── waiting-room/
│   └── page.tsx + WaitingRoomClient # SSE en tiempo real
├── smart-ticket/
│   └── page.tsx + SmartTicketClient # QR + detalles de reserva
├── operator/
│   ├── dashboard/                # Panel principal del operador
│   ├── documents/                # Revisión de documentos
│   ├── search/                   # Búsqueda de clientes
│   └── delivery/[reservationId]/ # Entrega física del vehículo
├── api/
│   ├── auth/session/route.ts     # POST/DELETE — gestiona cookies HttpOnly
│   └── sse/proxy/route.ts        # SSE proxy — inyecta JWT header
├── faq/                          # FAQ estática
├── soporte/                      # Soporte (chat pre-reserva)
└── terms/                        # Términos legales
```

**Convención Server/Client Components:**

- Las rutas que necesitan datos del servidor usan **Server Components** (sin `"use client"`). Hacen `fetch()` directamente a la API via `API_URL` (variable de servidor).
- Las rutas con interactividad, hooks, estado, o SSE usan `"use client"` o delegan a un `*Client.tsx` companion.

### 5.2 Capa de datos (`src/lib/api.ts`, `api-mappers.ts`)

**`apiFetch<T>(path, init)`:**

```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3900/api/v1";

// Con { auth: true } → lee nexus_token de document.cookie → Authorization: Bearer
// Sin auth → fetch anónimo
```

- Lanza `NexusApiError(statusCode, message)` con el error del servidor normalizado.
- Maneja 204 No Content devolviendo `undefined`.
- Funciona en cliente (usa `document.cookie`) y en servidor con fetch directo.

**`mapApiVehicle(ApiVehicle) → Vehicle`:**

Conversión centavos → EUR decimal:

```typescript
pricePerDay: v.pricePerDayEurCents / 100  // 16000 → 160.00
```

Así el resto del frontend trabaja siempre en EUR float (no centavos).

### 5.3 Gestión de estado (Zustand stores)

**`useBookingStore` (persistido en localStorage: `nexus-booking`):**

| Estado | Tipo | Descripción |
|--------|------|-------------|
| `pickupDate` / `returnDate` | `number \| null` | Epoch timestamps (serializables) |
| `pickupLocation` | `'CMN_T1' \| 'CMN_T2'` | Terminal de recogida |
| `selectedVehicleId` | `string \| null` | |
| `selectedVehiclePricePerDay` | `number \| null` | EUR, copiado del vehículo |
| `totalDays` | `number \| null` | Derivado automáticamente |
| `totalPriceEUR` | `number \| null` | Derivado: `totalDays × pricePerDay` |
| `reservationId` | `string \| null` | Asignado post-pago |

`setDates()` recalcula `totalDays` y `totalPriceEUR` automáticamente via `calcDerivedFields()`.

**`useCurrencyStore` (en `useBookingStore.ts`, persistido: `nexus-currency`):**

```typescript
currency: 'EUR' | 'MAD'
// En UI: displayPrice = currency === 'MAD' ? priceEUR * 10.8 : priceEUR
```

**`useLocaleStore` (persistido: `nexus-locale`):**

```typescript
locale: 'es' | 'fr' | 'ar'
```

**`useChatStore`:** Mensajes del chat (array en memoria, no persistido).

### 5.4 Sistema i18n (`src/lib/i18n.ts`)

Zustand + archivos JSON estáticos. **Sin ninguna librería externa de i18n.**

**Namespaces disponibles en `src/messages/*.json`:**

`common` · `hero` · `booking` · `catalog` · `checkin` · `waitingRoom` · `smartTicket` · `nav` · `notFound`

**Hooks:**

```typescript
const t = useTranslations("nav");   // Tipado completo — t.home, t.catalog…
const dir = useDirection();          // "ltr" | "rtl"
```

**`HtmlDirSync`** (`src/components/layout/HtmlDirSync.tsx`):

Client component que en `useEffect` sincroniza:
```typescript
document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
document.documentElement.lang = locale;
```

Necesario porque el `<html>` se renderiza server-side y no puede leer el Zustand store del cliente.

**Idiomas:**

| Locale | Idioma | Dirección |
|--------|--------|-----------|
| `es` | Español | LTR |
| `fr` | Français | LTR |
| `ar` | العربية | RTL |

### 5.5 Flujo de autenticación (cookies HttpOnly)

```
Browser → POST /auth/login (NestJS) → { accessToken, user }
    ↓
Browser → POST /api/auth/session (Next.js Route Handler)
    ↓ Lee exp del JWT para maxAge preciso
    ├── Set-Cookie: nexus_token (HttpOnly, Secure, SameSite=Strict) ← JWT
    └── Set-Cookie: nexus_user (public JSON — para UI, no para auth)
```

**`nexus_token`** (HttpOnly): Inaccesible a JavaScript. Solo se envía server-to-server (NestJS) o vía el SSE proxy. La única forma de leerlo en el browser es via el propio browser al hacer requests.

**`nexus_user`** (public): JSON con `{ id, email, role, fullName }`. Leído por el frontend para mostrar nombre, decidir qué rutas mostrar (UI-only — no tiene efecto de seguridad).

**Logout:** `DELETE /api/auth/session` → limpiar ambas cookies con age 0.

### 5.6 Flujo de reserva (BookingPanel → PaymentStep)

```
HomeClient / CatalogPage
    └── BookingPanel (fechas + terminal)
            ↓ setDates(), setLocation()
    └── VehicleCard → click "Reservar"
            ↓ setVehicle(id, pricePerDay)
            ↓ navigate /book/[vehicleId]

/book/[vehicleId]/BookingStep.tsx
    ├── Muestra resumen: vehículo, fechas, total, depósito
    └── Stripe Elements (PaymentStep.tsx)
            ↓ POST /reservations → { stripeClientSecret }
            ↓ stripe.confirmPayment(clientSecret)
            ↓ Redirect → /booking?reservation_id=xxx

/booking (confirmación)
    └── Muestra ticket con instrucciones de check-in
```

**Zero Trust pricing:** El precio total nunca viaja del frontend al backend para ser "aceptado". El backend recalcula: `pricePerDay (de BD) × totalDays (calculado server-side)`. El unique campo de precio que acepta el frontend es el `vehicleId`.

### 5.7 Panel del cliente (Dashboard)

- **Server Component** `page.tsx`: fetch `GET /reservations/my` con `Authorization: Bearer` desde el header.
- **Client Component** `DashboardClient.tsx`: renderiza tarjetas de reserva con estado, fechas, vehículo. Links a `/check-in`, `/waiting-room`, `/smart-ticket` según el estado.

### 5.8 Check-in & Documentos (`src/app/check-in/`)

1. `CheckInClient` llama `POST /documents/presign` → recibe URL presigned S3.
2. `PUT {presignedUrl}` directo a S3 con el archivo (bypass del backend — sin cargar la imagen en el servidor de Node).
3. `POST /documents/confirm` → crea el registro en BD.
4. Repite para PASSPORT y DRIVING_LICENSE.
5. Al completar ambos → redirige a `/waiting-room`.

**UX:** `FileDropZone` con preview, validación de tipo (image/*) y tamaño.

### 5.9 Sala de espera (WaitingRoom + SSE)

`WaitingRoomClient` usa `createSSEConnection(handlers)` de `src/lib/sse.ts`:

**`createSSEConnection`:**
- Conecta a `/api/sse/proxy` (proxy Next.js que inyecta JWT).
- En `onerror`: backoff exponencial `min(1000 × 2^retries, 30000)` ms.
- Reintentos ilimitados (retries se resetea a 0 en conexión exitosa).
- Cleanup function devuelta para `useEffect` return.

**Eventos manejados:**

| Evento | Acción UI |
|--------|-----------|
| `document.approved` | Toast "Documento aprobado" |
| `document.rejected` | Modal con motivo de rechazo |
| `reservation.confirmed` | Redirige a `/smart-ticket` |
| Keepalive (ping 15s) | Silencioso |

### 5.10 Smart Ticket & QR (`src/app/smart-ticket/`)

`SmartTicketClient`:
- Carga `GET /reservations/:id` → datos reales de la reserva.
- Muestra código QR generado a partir del `qrCodeHash` de la reserva.
- Información: vehículo, fechas, terminal de recogida, nombre del cliente.
- Botón de descarga del ticket (jsPDF o similar).

### 5.11 Panel del operador

**Dashboard (`/operator/dashboard`):**
- Fetch `GET /operator/deliveries?date=today`.
- Tarjetas de reservas con vehículo, cliente, hora de recogida.
- `QRScannerFAB` — floating action button con cámara para escanear QR:
  - Llama `POST /operator/delivery/:id/scan-qr`.
  - Modal de confirmación con datos del cliente.

**Revisión de documentos (`/operator/documents`):**
- Fetch `GET /operator/documents/pending`.
- `DocumentReviewList` — para cada documento: imagen presigned S3, botones Aprobar/Rechazar.
- Rechazo requiere campo de texto con motivo.

**Búsqueda (`/operator/search`):**
- Fetch `GET /operator/search?q={query}`.
- Resultados: nombre, email, phone, estado de reserva.

**Entrega (`/operator/delivery/[reservationId]`):**
- `DeliveryCheckClient` — checklist pre-entrega, confirmación final.

### 5.12 Catálogo de vehículos

**`/catalog/page.tsx` (Server Component):**
```typescript
// Lee query params del servidor
const API = process.env.API_URL ?? "http://localhost:3900/api/v1";
const data = await fetch(`${API}/vehicles/available?...`);
// mapea con mapApiVehicle() → Vehicle[] en EUR
```

**`CatalogGrid` + `FilterBar` (Client Components):**
- Filtros: categoría, transmisión, max. precio, asientos mínimos.
- `FilterBar` opera sobre el estado local (no refetch).
- `VehicleCard`: efecto parallax 3D, barras de calor de ocupación (visuales), precio con EUR/MAD según store.

---

## 6. Flujos de negocio end-to-end

### Flujo completo de una reserva

```
[CLIENTE]                    [FRONTEND]                   [BACKEND]          [STRIPE] [S3]

1. Busca fechas              BookingPanel
                              ↓ setDates()
2. Elige vehículo            VehicleCard click
                              ↓ navigate /book/:id
3. Confirma y paga           PaymentStep
                              ↓ POST /reservations
                                                           CREATE reservation
                                                           SELECT FOR UPDATE vehicle
                                                           Verifica disponibilidad
                                                           Calcula precio server-side
                                                                              ← createPaymentIntent
                                                           Guarda PENDING_DEPOSIT
                             ← stripeClientSecret
4. Stripe Elements           confirmPayment()
                                                                              ← authorizes payment
5. Sube documentos           CheckInClient
                              ↓ POST /documents/presign
                             ← presignedUrl
                              ↓ PUT {url} (directo S3)              ──────────────▶
                              ↓ POST /documents/confirm
                                                           Crea PENDING_REVIEW record

6. Sala de espera            WaitingRoomClient (SSE)
   [OPERADOR]
7. Revisa docs               operator/documents
                              ↓ PATCH /operator/documents/:id/approve
                                                           APPROVED × 2
                                                           → AWAITING_CAPTURE
                                                           → BullMQ capture-stripe
                                                           SSE emit
8. Cliente recibe SSE        ← document.approved
                             ← reservation.confirmed       capturePaymentIntent ─▶ [STRIPE]
                             Redirect /smart-ticket         → CONFIRMED
                                                           QR generado

9. Aeropuerto                SmartTicketClient (QR)
   [OPERADOR]
10. Escanea QR               QRScannerFAB
                              ↓ POST /operator/delivery/:id/scan-qr
                                                           verifyHash (HMAC-SHA256)
                                                           → IN_PROGRESS
                             ← 200 OK

11. Devolución                operator/delivery/:id
                              ↓ (completar entrega)
                                                           → COMPLETED
```

---

## 7. Seguridad

| Vector | Mitigación |
|--------|-----------|
| Brute force login | Throttle 5 req/min en `/auth/login` |
| Brute force register | Throttle 10 req/min en `/auth/register` |
| JWT en URL | ❌ Nunca. JWT en cookie HttpOnly o header Bearer. SSE proxy inyecta header server-side. |
| XSS → robo de token | `nexus_token` es HttpOnly — JavaScript no puede leerlo |
| CSRF | JWT en Bearer (no en cookie para API), SameSite=Strict para la cookie |
| Overbooking concurrente | `SELECT FOR UPDATE` (pessimistic lock) en transacción ACID |
| Precio manipulado por cliente | Zero Trust: backend recalcula precio con datos de BD |
| Forjado de QR | HMAC-SHA256(QR_SIGNING_SECRET + reservationId + userId + pickupDate) |
| Timing attack en QR | `crypto.timingSafeEqual()` en comparación de hashes |
| Path traversal en S3 | File key incluye userId + reservationId + tipo (no acepta paths del cliente) |
| Webhooks Stripe falsos | Verifica firma HMAC con `STRIPE_WEBHOOK_SECRET` + `rawBody` |
| Webhooks duplicados | INSERT idempotente con PK = eventId (PG unique violation → skip) |
| Exposición de errores | `AllExceptionsFilter` — nunca expone stack traces |
| Variables de entorno | Zod validation en startup — app no arranca si faltan |
| CORS | Whitelist exacta, no wildcard. Credenciales: true. |
| Injection SQL | TypeORM query builder con parámetros enlazados `(:param)` |
| Roles | `RolesGuard` + `@Roles()` decorator en todos los endpoints sensibles |

---

## 8. Decisiones de diseño relevantes

### D1 — Precios en centavos enteros (no floats)

**Motivo:** Evitar errores de punto flotante (`0.1 + 0.2 = 0.30000000000000004`). El backend almacena y opera todo en centavos EUR (integer). El frontend convierte a EUR decimal solo para mostrar:

```typescript
mapApiVehicle: pricePerDay = pricePerDayEurCents / 100
```

### D2 — Saga pattern en reservas (no 2PC)

La reserva usa Saga con compensación en lugar de Two-Phase Commit distribuido. Si el Payment Intent falla fuera de la transacción (red, timeout), el registro existe como `PENDING_DEPOSIT` y el BullMQ expiry job lo cancela automáticamente. Evita bloqueos distribuidos.

### D3 — SSE en lugar de WebSockets

SSE es unidireccional (servidor → cliente), más simple, y suficiente para los casos de uso (notificaciones de estado). WebSockets añadirían complejidad sin beneficio para este caso. El chat bidireccional usa REST polling o SSE para notificaciones.

### D4 — Upload directo a S3 (presigned URL)

El archivo de documento nunca pasa por el servidor Node.js. El cliente hace `PUT` directo al bucket S3 con una URL presigned de 15 minutos. Esto:
- Elimina el consumo de memoria/CPU del servidor para archivos.
- Mejora la velocidad (sin hop extra).
- S3 file key nunca proviene del cliente → no hay path traversal.

### D5 — Cookies HttpOnly para JWT

El token JWT se almacena en cookie HttpOnly (inaccesible a JS). Esto elimina la superficie de ataque XSS más habitual (robo de localStorage). El SSE proxy de Next.js actúa como intermediario de confianza.

### D6 — EUR_TO_MAD_RATE hardcodeado

La tasa EUR→MAD (10.8) está en `src/lib/constants.ts`. En producción debería actualizarse periódicamente (cron job o llamada a API de tipos de cambio). Por ahora es una constante manual.

### D7 — BullMQ para operaciones diferidas

Tres queues:
| Queue | Propósito |
|-------|-----------|
| `reservation-expiry` | Cancela reservas PENDING_DEPOSIT que no se pagan en tiempo |
| `capture-stripe` | Captura el Payment Intent cuando documentos aprobados |
| `document-cleanup` | Elimina objetos S3 cuando documento rechazado o reserva cancelada |

---

## 9. Bugs conocidos y corregidos

| ID | Módulo | Descripción | Fix aplicado |
|----|--------|-------------|-------------|
| BUG-01 | Backend CORS | Solo whitelisted `:3000/:3001`. Frontend en `:4000` → bloqueado | CORS dinámico, añadido `:4000` y `FRONTEND_URL` |
| BUG-02 | `api.ts` / `catalog/page.tsx` | Fallback a `:3001` (puerto container, no expuesto) | Fallback → `:3900` |
| BUG-03 | i18n | Toggle cambiaba Zustand pero ningún componente leía `useTranslations()` | `Header.tsx` usa `useTranslations("nav")`, `HtmlDirSync` sincroniza `dir`/`lang` |
| BUG-04 | `VehicleCard`, `VehicleDetailClient` | EUR/MAD toggle no actualizaba precios mostrados | Ambos leen `useCurrencyStore()`, calculan `displayPrice` con `EUR_TO_MAD_RATE` |
| BUG-05/06 | `VehicleCard` | Etiqueta "Alta demanda **esta semana**" — datos son pseudorandom, no reales | Etiqueta neutralizada: "Alta demanda" / "Disponibilidad Alta" |
| BUG-07 | `HomeClient` | Precios de categorías hardcodeados (45€/85€/120€/140€) | `useEffect` fetcha `GET /vehicles`, calcula precio mínimo real por categoría |
| BUG-D | `Dockerfile` | `COPY .../migrations` sobreescribía `.js` compilados con `.ts` fuente | Eliminada línea duplicada. Solo `COPY dist ./dist` |
| BUG-P | Docker/Hyper-V | Puerto 3001 reservado por Hyper-V (rango 2981–3580) | Mapeado `3900:3001` en docker-compose |
| BUG-08 | `catalog/[vehicleId]/page.tsx` | Fallback hardcodeado a `:3001` en Server Component | Cambiado a `:3900` |
| BUG-09 | `book/[vehicleId]/page.tsx` | Fallback hardcodeado a `:3001` en Server Component | Cambiado a `:3900` |
| BUG-10 | `UsersModule` / `profile/page.tsx` | No existía `UsersController` → `PATCH /users/me` devolvía 404 | Creado `users.controller.ts` + `update-me.dto.ts` + `updateMe()` en service |
| BUG-11 | `dashboard/page.tsx` | `GET /reservations/my` devolvía `{ data[], total }` pero el componente lo trataba como array puro → reservas silenciadas | Corregido extractor: `body.data`, añadido soporte paginación SSR con `searchParams` |
| BUG-12 | `apiFetch` (`src/lib/api.ts`) | JWT expirado no redirigía al login — componentes lanzaban errores no controlados | Interceptor 401: limpia cookie + redirect a `/login?session_expired=true` |
| BUG-13 | `login/page.tsx` | Parámetro `session_expired` no mostraba ningún feedback visual | Banner amber "Tu sesión ha expirado" visible cuando `?session_expired=true` |

---

## 10. TODOs y deuda técnica

### 🔴 Alta prioridad

| Item | Justificación | Estado |
|------|---------------|--------|
| Migrar SSE a Redis Pub/Sub | En-memoria → no escala con >1 instancia de backend | ⏳ Pendiente |
| Tests unitarios + e2e | Sin cobertura de tests actualmente | ⏳ Pendiente |
| Actualizar `EUR_TO_MAD_RATE` dinámicamente | Tasa hardcodeada a 10.8 MAD/EUR se desactualiza | ✅ Completado (20-02-2026) |
| Implementar refresh token | JWT de 7d expira sin renovar silenciosamente | ✅ Completado (20-02-2026) |

### 🟠 Media prioridad

| Item | Justificación | Estado |
|------|---------------|--------|
| Añadir paginación a `/reservations/my` | Sin límite de resultados | ✅ Completado (20-02-2026) |
| Rate limiting por IP en Stripe webhook | DoS via webhooks falsos (firma verifica pero consume CPU) | ✅ Completado (20-02-2026) |
| Migrar `tsrange + GiST` para disponibilidad | Escalabilidad cuando flota > 500 vehículos | ⏳ Pendiente |

### 🟡 Baja prioridad

| Item | Justificación | Estado |
|------|---------------|--------|
| Eliminar `src/lib/mock-data.ts` (`MOCK_VEHICLES`) | Fue necesario como fallback — ya no se usa en producción | ✅ Completado (20-02-2026) |
| Internacionalizar errores del backend | Los mensajes de error están en español hardcodeado | ⏳ Pendiente |
| Añadir campo `ratingScore` a `Vehicle` | Heat bars actualmente pseudorandom | ⏳ Pendiente |
| `ContentType` dinámico en S3 | Solo acepta `image/jpeg`. Añadir PDF para licencias | ✅ Completado (20-02-2026) |
| Dark mode | Toggle existe en diseño pero CSS vars no implementadas | ✅ Completado (20-02-2026) |
| `IntroSplash` — montar o eliminar | Componente existe pero no está montado en ninguna página | ⏳ Pendiente |

### ✅ Completados en sesión 20-02-2026

| Item | Detalle |
|------|---------|
| `UsersController` creado | `GET /users/me` + `PATCH /users/me` con `JwtAuthGuard` + `UpdateMeDto` |
| Fallbacks `:3001` eliminados | `catalog/[vehicleId]/page.tsx` + `book/[vehicleId]/page.tsx` usan `:3900` |
| 401 → redirect login | `apiFetch` intercepta 401, limpia sesión, redirige a `/login?session_expired=true` |
| Banner sesión expirada | `login/page.tsx` muestra alerta amber cuando `?session_expired=true` |
| Skeletons de carga | `catalog/loading.tsx` (6 cards) + `catalog/[vehicleId]/loading.tsx` (detalle completo) |
| Paginación reservas (backend) | `findMy()` usa `findAndCount` + `skip/take`, controller acepta `?page&limit` |
| Paginación reservas (frontend) | `dashboard/page.tsx` lee `searchParams.page`, controls Prev/Next en historial |
| Fix extractor `.data` dashboard | `rawReservations` extraía array puro en vez de `body.data` → reservas invisibles |

---

## 11. Variables de entorno

### Backend (`.env`)

| Variable | Tipo | Requerida | Descripción |
|----------|------|-----------|-------------|
| `NODE_ENV` | enum | No | `development`/`production`/`test` |
| `PORT` | number | No | Default 3001 |
| `API_PREFIX` | string | No | Default `api/v1` |
| `DATABASE_URL` | URL | ✅ | `postgresql://user:pass@host:5432/db` |
| `DATABASE_SSL` | boolean | No | `true`/`false`, default `false` |
| `REDIS_URL` | URL | ✅ | `redis://host:6379` |
| `JWT_SECRET` | string | ✅ | Mínimo 32 caracteres |
| `JWT_EXPIRES_IN` | string | No | Default `7d` |
| `JWT_REFRESH_SECRET` | string | ✅ | Secreto distinto al de acceso, mín. 32 chars |
| `JWT_REFRESH_EXPIRES_IN` | string | No | Default `30d` |
| `STRIPE_SECRET_KEY` | string | ✅ | Debe empezar con `sk_` |
| `STRIPE_WEBHOOK_SECRET` | string | ✅ | Debe empezar con `whsec_` |
| `STRIPE_DEPOSIT_EUR` | number | No | Default 10 |
| `AWS_ACCESS_KEY_ID` | string | ✅ | |
| `AWS_SECRET_ACCESS_KEY` | string | ✅ | |
| `AWS_REGION` | string | No | Default `eu-west-3` |
| `AWS_S3_BUCKET` | string | ✅ | `nexus-documents` |
| `AWS_S3_PRESIGN_EXPIRES_SECONDS` | number | No | Default 900 |
| `QR_SIGNING_SECRET` | string | ✅ | Mínimo 32 caracteres |
| `FRONTEND_URL` | URL | ✅ | e.g. `http://localhost:4000` |
| `OPERATOR_WHATSAPP` | string | ✅ | Con prefijo de país |

### Frontend (`.env.local`)

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Base URL pública (browser). e.g. `http://localhost:3900/api/v1` |
| `API_URL` | Base URL privada (Server Components). e.g. `http://localhost:3900/api/v1` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe (`pk_...`) |
| `NEXT_PUBLIC_OPERATOR_WHATSAPP` | Número WhatsApp del operador |
| `NEXT_PUBLIC_OPERATOR_PHONE` | Teléfono del operador |

---

## 12. Referencia de API REST

Base URL: `http://localhost:3900/api/v1`

### Auth

```
POST   /auth/register           Body: { email, password, fullName, phone? }
POST   /auth/login              Body: { email, password }
GET    /auth/me                 Auth: Bearer
```

### Vehicles

```
GET    /vehicles                Todos los AVAILABLE, orden ASC precio
GET    /vehicles/available      ?pickupDate=ISO&returnDate=ISO&category=SEDAN|SUV|LUXURY|COMPACT
GET    /vehicles/:id            Detalle por UUID
```

### Users

```
GET    /users/me               Auth: Bearer | Devuelve perfil del usuario autenticado
PATCH  /users/me               Auth: Bearer | Body: { phone?: string } (regex +?[0-9]{7,15})
```

### Reservations

```
POST   /reservations            Auth: Bearer | Body: CreateReservationDto
GET    /reservations/my         Auth: Bearer | ?page=1&limit=20 → { data[], total, page, limit } | ?page=1&limit=20 → { data[], total, page, limit }
GET    /reservations/:id        Auth: Bearer
PATCH  /reservations/:id/cancel Auth: Bearer
```

### Stripe

```
POST   /stripe/webhook          Signature: stripe-signature header (raw body)
```

### Documents

```
POST   /documents/presign       Auth: Bearer | Body: { reservationId, type }
POST   /documents/confirm       Auth: Bearer | Body: { reservationId, type, fileKey }
GET    /documents/:reservationId Auth: Bearer (propietario o OPERATOR)
```

### Operator

```
GET    /operator/deliveries            Auth: OPERATOR/ADMIN | ?date=YYYY-MM-DD
POST   /operator/delivery/:id/scan-qr  Auth: OPERATOR/ADMIN | Body: { qrCodeHash }
GET    /operator/search                 Auth: OPERATOR/ADMIN | ?q=string
GET    /operator/documents/pending      Auth: OPERATOR/ADMIN
PATCH  /operator/documents/:id/approve  Auth: OPERATOR/ADMIN
PATCH  /operator/documents/:id/reject   Auth: OPERATOR/ADMIN | Body: { reason }
```

### SSE

```
GET    /sse/reservation/:id    Auth: Bearer | Returns: EventStream
GET    /sse/operator/chat      Auth: OPERATOR/ADMIN | Returns: EventStream
```

### Chat

```
POST   /chat                          Auth: Bearer | Body: { text, reservationId? }
GET    /chat/reservation/:id          Auth: Bearer (propietario o OPERATOR)
GET    /chat/all                      Auth: OPERATOR/ADMIN
```

### Health

```
GET    /health                 Públic | Returns: { status, db, version }
```

---

*Documentación actualizada el 20-02-2026 — sesión de corrección de bugs + paginación.*
