# RFC-002: Documento de Diseño Arquitectónico — Backend NestJS/PostgreSQL
## Plataforma NEXUS · MVP Casablanca

**Estado:** EN REVISIÓN — Para aprobación CTO | **Fecha:** 19 Febrero 2026
**Autor:** Arquitecto Principal | **Reemplaza:** RFC-001 (18 Feb 2026)
**Stack Canónico:** NestJS (TypeScript) · TypeORM · PostgreSQL · Redis · BullMQ · Stripe · AWS S3 · SSE

---

## 0. Metodología de Análisis

Este RFC ha sido construido realizando ingeniería inversa del Frontend existente. Las fuentes analizadas han sido:
- `src/types/index.ts` — Contratos de tipos TypeScript del UI
- `src/stores/useBookingStore.ts` y `useChatStore.ts` — Estado y acciones del cliente
- `src/components/customer/` — Flujos de CheckIn, subida de documentos, Smart Ticket, Waiting Room
- `src/lib/mock-data.ts` y `mock-operator-data.ts` — Forma exacta de los payloads JSON esperados
- `src/app/api/chat/route.ts` — Único endpoint de API Next.js activo
- `src/lib/constants.ts` — Parámetros de negocio duros (DEPOSIT_AMOUNT_EUR = 10, polling interval = 30 000 ms)

El resultado es un diseño de backend que cumple con **precisión de contrato** lo que el Frontend espera, sin asumir nada que no esté fundamentado en el código.

---

## SECCIÓN 1: Diseño de Base de Datos (ERD PostgreSQL / TypeORM)

### 1.1 Diagrama de Relaciones

```
┌──────────────────────┐       ┌──────────────────────────┐
│         users        │       │         vehicles         │
├──────────────────────┤       ├──────────────────────────┤
│ id          UUID PK  │       │ id           UUID PK     │
│ email       VARCHAR  │◄─┐    │ license_plate VARCHAR UQ │
│ password_hash VARCHAR│  │    │ brand        VARCHAR     │
│ full_name   VARCHAR  │  │    │ model        VARCHAR     │
│ phone_number VARCHAR │  │    │ category     ENUM        │
│ role        ENUM     │  │    │ price_per_day DECIMAL    │
│ created_at  TSTZ     │  │    │ transmission ENUM        │
│ updated_at  TSTZ     │  │    │ seats        SMALLINT    │
└──────────────────────┘  │    │ luggage_count SMALLINT   │
                          │    │ features     TEXT[]      │
                          │    │ image_url    VARCHAR     │
                          │    │ image_urls   TEXT[]      │
                          │    │ jawaz_tag_id VARCHAR     │
                          │    │ sim_card_number VARCHAR  │
                          │    │ status       ENUM        │
                          │    │ created_at   TSTZ        │
                          │    └──────────────────────────┘
                          │               │
              ┌───────────┘               │
              │                           │
              ▼                           ▼
┌───────────────────────────────────────────────────────────────┐
│                         reservations                          │
├───────────────────────────────────────────────────────────────┤
│ id                   UUID PK                                  │
│ user_id              UUID FK -> users.id                      │
│ vehicle_id           UUID FK -> vehicles.id                   │
│ pickup_location      ENUM ('CMN_T1','CMN_T2')                 │
│ start_time           TIMESTAMPTZ (pickup date/time)           │
│ end_time             TIMESTAMPTZ (return date/time)           │
│ total_days           SMALLINT   (calculado server-side)       │
│ total_price_eur      DECIMAL(10,2) (calculado server-side)    │
│ deposit_paid_eur     DECIMAL(10,2) DEFAULT 10.00              │
│ balance_due_eur      DECIMAL(10,2) (total - deposit)          │
│ status               ENUM                                     │
│ stripe_payment_intent_id VARCHAR UQ NULLABLE                  │
│ qr_code_hash         VARCHAR UQ NULLABLE                      │
│ delivery_video_key   VARCHAR NULLABLE (S3 key)                │
│ customer_name        VARCHAR NULLABLE (desnorm. para operator)│
│ customer_phone       VARCHAR NULLABLE (desnorm. para operator)│
│ arrival_time         TIMESTAMPTZ NULLABLE                     │
│ delivered_by         UUID FK -> users.id NULLABLE             │
│ delivered_at         TIMESTAMPTZ NULLABLE                     │
│ created_at           TIMESTAMPTZ                              │
│ updated_at           TIMESTAMPTZ                              │
└───────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│             reservation_documents            │
├──────────────────────────────────────────────┤
│ id             UUID PK                       │
│ user_id        UUID FK -> users.id           │
│ reservation_id UUID FK -> reservations.id    │
│ type           ENUM ('PASSPORT','DRV_LIC')   │
│ file_key       VARCHAR   (S3 object key)     │
│ status         ENUM                          │
│ rejection_reason VARCHAR NULLABLE            │
│ reviewed_by    UUID FK -> users.id NULLABLE  │
│ reviewed_at    TIMESTAMPTZ NULLABLE          │
│ created_at     TIMESTAMPTZ                   │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│              chat_messages                   │
├──────────────────────────────────────────────┤
│ id             UUID PK                       │
│ user_id        UUID FK -> users.id           │
│ reservation_id UUID FK -> reservations.id NK │
│ text           TEXT                          │
│ sender         ENUM ('user','operator','sys')│
│ status         ENUM (sent/delivered/read)    │
│ created_at     TIMESTAMPTZ                   │
└──────────────────────────────────────────────┘
```

### 1.2 Enums PostgreSQL

```sql
CREATE TYPE user_role       AS ENUM ('USER', 'OPERATOR', 'ADMIN');
CREATE TYPE vehicle_status  AS ENUM ('AVAILABLE', 'MAINTENANCE', 'RETIRED');
CREATE TYPE vehicle_category AS ENUM ('SEDAN', 'SUV', 'LUXURY', 'COMPACT');
CREATE TYPE transmission    AS ENUM ('AUTOMATIC', 'MANUAL');
CREATE TYPE pickup_location AS ENUM ('CMN_T1', 'CMN_T2');
CREATE TYPE reservation_status AS ENUM (
  'PENDING_DEPOSIT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
);
CREATE TYPE document_type   AS ENUM ('PASSPORT', 'DRIVING_LICENSE');
CREATE TYPE document_status AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE msg_sender      AS ENUM ('user', 'operator', 'system');
CREATE TYPE msg_status      AS ENUM ('sending', 'sent', 'delivered', 'read', 'error');
```

### 1.3 Índices Críticos para Rendimiento y Concurrencia

```sql
-- Anti-overbooking: consulta de solapamiento de fechas (usada en SELECT FOR UPDATE)
CREATE INDEX idx_res_vehicle_dates
  ON reservations (vehicle_id, start_time, end_time)
  WHERE status NOT IN ('CANCELLED', 'COMPLETED');

-- Dashboard operador: entregas de hoy
CREATE INDEX idx_res_start_status
  ON reservations (start_time, status)
  WHERE status = 'CONFIRMED';

-- Polling de documentos por reserva (Waiting Room)
CREATE INDEX idx_docs_reservation
  ON reservation_documents (reservation_id, status);

-- Búsqueda de mensajes de chat por usuario
CREATE INDEX idx_chat_user
  ON chat_messages (user_id, created_at DESC);
```

### 1.4 Nota sobre `customer_name` y `customer_phone` en `reservations`

El Frontend (`mock-operator-data.ts`) muestra `customerName` y `customerPhone` directamente en el objeto `Reservation` del dashboard del operador. Esto es una **desnormalización intencional y justificada**: en el contexto aeroportuario, el operador necesita el teléfono inmediatamente sin un JOIN adicional. Se populan al crear la reserva, tomándolos del perfil del usuario auth.

---

## SECCIÓN 2: Contratos de la API (Endpoints REST)

**Convenciones globales:**
- Base URL: `/api/v1`
- Auth: `Authorization: Bearer <JWT>` en todos los endpoints protegidos
- Todos los timestamps se reciben y devuelven en **ISO 8601 UTC** (`string`)
- Los precios se devuelven siempre en **EUR** (`number`). La conversión a MAD es exclusivamente responsabilidad de la capa de presentación (ya gestionada por `useCurrencyStore`)
- Errores siguen el formato: `{ statusCode, message, error }`

---

### MÓDULO: Auth (`/auth`)

#### `POST /auth/register`
```json
// Request Body
{
  "email": "ahmed@example.com",
  "password": "Str0ng!Pass",
  "fullName": "Ahmed Benjelloun",
  "phoneNumber": "+212612345678"
}

// Response 201
{
  "accessToken": "eyJ...",
  "user": {
    "id": "uuid-v4",
    "email": "ahmed@example.com",
    "fullName": "Ahmed Benjelloun",
    "phoneNumber": "+212612345678",
    "role": "USER"
  }
}
```

#### `POST /auth/login`
```json
// Request Body
{ "email": "ahmed@example.com", "password": "Str0ng!Pass" }

// Response 200
{
  "accessToken": "eyJ...",
  "user": {
    "id": "uuid-v4",
    "email": "ahmed@example.com",
    "fullName": "Ahmed Benjelloun",
    "phoneNumber": "+212612345678",
    "role": "USER"
  }
}
```

#### `GET /auth/me` — Auth: JWT(cualquier rol)
```json
// Response 200
{
  "id": "uuid-v4",
  "email": "ahmed@example.com",
  "fullName": "Ahmed Benjelloun",
  "phoneNumber": "+212612345678",
  "role": "USER"
}
```

---

### MÓDULO: Catálogo (`/vehicles`)

#### `GET /vehicles` — Público
```json
// Query params opcionales: ?category=SUV&available=true
// Response 200 — Array of Vehicle (contrato exacto de src/types/index.ts)
[
  {
    "id": "uuid-v4",
    "brand": "Audi",
    "model": "A4",
    "category": "SEDAN",
    "pricePerDay": 160,
    "currency": "EUR",
    "imageUrl": "https://...",
    "imageUrls": ["https://...", "https://..."],
    "transmission": "AUTOMATIC",
    "seats": 5,
    "luggageCount": 2,
    "features": ["SIM 5GB", "Tag Jawaz", "Seguro Todo Riesgo"],
    "isAvailable": true
  }
]
```

**Nota de implementación:** `isAvailable` es calculado dinámicamente verificando solapamientos de fechas en `reservations`. No es un campo estático en la tabla `vehicles`. Para el endpoint de catálogo general (sin fechas), `isAvailable` refleja `vehicles.status = 'AVAILABLE'`.

#### `GET /vehicles/:id` — Público
Mismo contrato que un elemento del array anterior.

#### `GET /vehicles/:id/availability` — Auth: JWT(USER)
```json
// Query: ?pickupDate=2026-03-01&returnDate=2026-03-05
// Response 200
{
  "vehicleId": "uuid-v4",
  "isAvailable": true,
  "totalDays": 4,
  "totalPriceEUR": 640
}
```
**Crítico:** El Frontend calcula `totalDays` y `totalPriceEUR` en `useBookingStore` para **visualización**. El backend NUNCA confiará en esos valores. Este endpoint es la fuente de verdad que confirma disponibilidad y precio antes de iniciar el pago.

---

### MÓDULO: Reservas (`/reservations`)

#### `POST /reservations` — Auth: JWT(USER)

Este es el endpoint más crítico del sistema. Implementa el flujo de dos fases con bloqueo pesimista.

```json
// Request Body — SOLO este payload. El frontend NO envía totalPriceEUR
{
  "vehicleId": "uuid-v4",
  "pickupDate": "2026-03-01T00:00:00.000Z",
  "returnDate": "2026-03-05T00:00:00.000Z",
  "pickupLocation": "CMN_T2"
}

// Response 201
{
  "reservationId": "uuid-v4",
  "stripeClientSecret": "pi_xxx_secret_yyy",
  "totalDays": 4,
  "totalPriceEUR": 640,
  "depositPaidEUR": 10,
  "balanceDueEUR": 630
}
```

**Flujo interno NestJS (transaccional):**
```
1. BEGIN TRANSACTION
2. SELECT * FROM vehicles WHERE id = $1 FOR UPDATE  ← bloqueo pesimista
3. SELECT COUNT FROM reservations WHERE vehicle_id=$1
     AND status NOT IN ('CANCELLED','COMPLETED')
     AND start_time < $returnDate AND end_time > $pickupDate
   → Si COUNT > 0: ROLLBACK → throw ConflictException("Vehicle not available")
4. Calcular totalDays = dateDiff(returnDate, pickupDate) [días naturales]
5. Calcular totalPriceEUR = totalDays × vehicle.pricePerDay [server-side SIEMPRE]
6. INSERT INTO reservations (status='PENDING_DEPOSIT', ...)
7. COMMIT  ← libera el lock inmediatamente
8. Stripe: createPaymentIntent({ amount: 1000, currency:'eur', capture_method:'manual' })
9. UPDATE reservations SET stripe_payment_intent_id = $intent.id
10. Encolar job BullMQ: "reservation-expiry" con delay de 15 minutos
11. Retornar { reservationId, stripeClientSecret, totalDays, totalPriceEUR, ... }
```

#### `GET /reservations/me` — Auth: JWT(USER)

Contrato exacto esperado por el Smart Ticket y el dashboard de cliente:
```json
// Response 200
[
  {
    "id": "uuid-v4",
    "vehicleId": "uuid-v4-vehicle",
    "vehicle": { /* Vehicle completo */ },
    "pickupDate": "2026-03-01T00:00:00.000Z",
    "returnDate": "2026-03-05T00:00:00.000Z",
    "pickupLocation": "CMN_T2",
    "totalDays": 4,
    "totalPriceEUR": 640,
    "depositPaidEUR": 10,
    "balanceDueEUR": 630,
    "status": "CONFIRMED",
    "qrCodeHash": "NEXUS-uuid-v4-uuid-vehicle-1708300000000",
    "customerName": "Ahmed Benjelloun",
    "customerPhone": "+212612345678"
  }
]
```

**Generación del `qrCodeHash`:** El formato del mock es `NEXUS-${reservationId}-${vehicleId}-${epochMs}`. El backend genera este hash en el momento de confirmar la reserva (webhook Stripe) usando: `HMAC-SHA256(secret, "${reservationId}:${vehicleId}:${confirmedAt.getTime()}")` truncado a 40 caracteres, con el prefijo `NEXUS-`. Esto hace el hash **verificable y no falsificable**. El frontend sigue usando la librería `qrcode` para renderizar el SVG a partir del hash recibido — no cambia nada en el UI.

#### `GET /reservations/:id` — Auth: JWT(USER) — Mismo contrato que elemento del array anterior

---

### MÓDULO: Documentos (`/documents`)

#### `POST /documents/upload-url` — Auth: JWT(USER)

El frontend actualmente simula la subida (`simulateUpload` en `DocumentUploadStep.tsx`). El flujo real será **2 pasos** para evitar que archivos grandes pasen por el backend NestJS:

```json
// Step 1 — Request presigned URL
// Request Body
{
  "reservationId": "uuid-v4",
  "documentType": "PASSPORT",
  "fileExtension": "jpg",
  "fileSizeBytes": 1540200
}

// Response 201
{
  "documentId": "uuid-v4",
  "uploadUrl": "https://s3.amazonaws.com/nexus-docs/...?X-Amz-Signature=...",
  "expiresInSeconds": 300
}
```

El frontend hace `PUT` directamente al S3 presigned URL con el blob del archivo. El canvas de DocumentUploadStep ya produce un JPEG (línea `canvas.toDataURL("image/jpeg", 0.85)`).

#### `POST /documents/:id/confirm-upload` — Auth: JWT(USER)

```json
// Llamado por el frontend tras el PUT exitoso a S3
// Request Body: {}

// Response 200
{
  "documentId": "uuid-v4",
  "status": "PENDING_REVIEW",
  "type": "PASSPORT"
}
```

El backend verifica (HeadObject en S3) que el archivo existe realmente antes de cambiar el estado. Luego dispara el SSE event al canal del operador.

#### `GET /documents/me` — Auth: JWT(USER)

```json
// Response 200
[
  {
    "id": "uuid-v4",
    "userId": "uuid-user",
    "reservationId": "uuid-res",
    "type": "PASSPORT",
    "fileUrl": "https://s3.amazonaws.com/...",  ← presigned URL temporal (15 min TTL)
    "status": "PENDING_REVIEW",
    "rejectionReason": null,
    "reviewedAt": null
  }
]
```

**Importante:** `fileUrl` siempre es una **Presigned URL temporal** generada en el momento de la petición GET. Nunca se expone la S3 key pública. TTL recomendado: 15 minutos.

---

### MÓDULO: Tiempo Real para el Cliente — SSE (`/sse`)

#### `GET /sse/documents/:reservationId` — Auth: JWT(USER)

Reemplaza el `setTimeout` simulado de `WaitingRoomClient.tsx`. El cliente abre una conexión SSE y escucha eventos.

```
// Headers de respuesta del servidor
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no   ← crítico para Nginx

// Eventos emitidos:
event: document-status
data: {"documentId":"uuid","type":"PASSPORT","status":"APPROVED","reviewedAt":"2026-03-01T..."}

event: document-status
data: {"documentId":"uuid","type":"DRIVING_LICENSE","status":"REJECTED","rejectionReason":"Foto borrosa"}

// Keep-alive cada 25s para evitar timeouts de proxy/CDN
: ping
```

**Implementación NestJS:** `@Sse()` decorator + `Observable` de RxJS. Cuando el operador llama a `PATCH /operator/documents/:id/review`, el servicio emite al `EventEmitter2` o directamente al `Subject` RxJS del canal del cliente correspondiente.

---

### MÓDULO: Operador (`/operator`) — Auth: JWT(OPERATOR | ADMIN)

#### `GET /operator/documents/pending`

```json
// Response 200
[
  {
    "id": "uuid-doc",
    "userId": "uuid-user",
    "reservationId": "uuid-res",
    "type": "PASSPORT",
    "fileUrl": "https://s3.presigned...",   ← 60 min TTL para uso del operador
    "status": "PENDING_REVIEW",
    "customerName": "Ahmed Benjelloun",
    "uploadedAt": "2026-03-01T10:15:00.000Z"
  }
]
```

El campo `uploadedAgo` del mock (`"8 min"`) es calculado en el frontend a partir de `uploadedAt`. No lo genera el servidor.

#### `PATCH /operator/documents/:id/review` — Auth: JWT(OPERATOR)

```json
// Request Body
{
  "status": "APPROVED",      // o "REJECTED"
  "rejectionReason": null    // requerido si status = "REJECTED"
}

// Response 200
{
  "documentId": "uuid-doc",
  "status": "APPROVED",
  "reviewedBy": "uuid-operator",
  "reviewedAt": "2026-03-01T10:20:00.000Z"
}
```

**Side effects críticos:**
1. Actualiza `reservation_documents.status`.
2. Emite evento SSE al canal del cliente (`/sse/documents/:reservationId`).
3. Si todos los documentos de la reserva están `APPROVED`, actualiza el `qrCodeHash` en la reserva (lo genera en este momento, no antes).

#### `GET /operator/deliveries/today` — Auth: JWT(OPERATOR)

Contrato exacto esperado por el dashboard operador (derivado del mock):

```json
// Response 200
[
  {
    "id": "CMN-2026-001",
    "vehicleId": "uuid-vehicle",
    "vehicle": { /* Vehicle completo */ },
    "pickupDate": "2026-03-01T10:00:00.000Z",
    "returnDate": "2026-03-06T10:00:00.000Z",
    "pickupLocation": "CMN_T2",
    "totalDays": 5,
    "totalPriceEUR": 800,
    "depositPaidEUR": 10,
    "balanceDueEUR": 790,
    "status": "CONFIRMED",
    "qrCodeHash": "NEXUS-...",
    "customerName": "Ahmed Benjelloun",
    "customerPhone": "+212612345678",
    "arrivalTime": "2026-03-01T10:00:00.000Z"
  }
]
```

`arrivalTime` = `reservations.start_time`. Se renombra en la capa de serialización (NestJS Interceptor/ClassTransformer).

Filtro: reservas con `status = 'CONFIRMED'` y `start_time` entre `NOW()` y `NOW() + INTERVAL '24 hours'`.

#### `POST /operator/reservations/:id/deliver` — Auth: JWT(OPERATOR)

```json
// Content-Type: multipart/form-data
// Fields:
// - qrCodeScanned: string (el hash escaneado del QR)
// - remainingAmountCollected: boolean
// - [file]: binary (video 30s, opcional — subido a S3 en background)

// Response 200
{
  "reservationId": "uuid-v4",
  "status": "IN_PROGRESS",
  "deliveredAt": "2026-03-01T10:05:00.000Z",
  "deliveredBy": "uuid-operator"
}
```

**Validación del QR:** El servidor recomputa el HMAC con la misma clave secreta y compara con `qrCodeScanned`. Si no coincide → 422 Unprocessable Entity + log de seguridad.

**Upload del vídeo:** El video se encola en BullMQ (`video-upload-queue`) para subida asíncrona a S3. El endpoint responde en < 500ms sin esperar la subida. El cliente (operador) ve "Capturado" inmediatamente — el PRD lo requiere explícitamente.

#### `GET /operator/search` — Auth: JWT(OPERATOR)

```json
// Query: ?query=ahmed (busca por customerName, customerPhone, qrCodeHash, licensePlate)
// Response 200 — Array of Reservation (mismo contrato que deliveries/today)
```

Fallback manual cuando el escáner QR falla.

---

### MÓDULO: Chat (`/chat`)

#### `POST /chat/messages` — Auth: JWT(USER)

Reemplaza la ruta Next.js `/api/chat`. Los comentarios del código (`/api/chat/route.ts`) ya documentan exactamente qué debe hacer:

```json
// Request Body
{
  "messageId": "user-1708300000000-a3b2",
  "text": "Hola, he aterrizado. ¿Dónde recojo el coche?",
  "timestamp": 1708300000000
}

// Response 200
{
  "success": true,
  "messageId": "user-1708300000000-a3b2",
  "receivedAt": 1708300001234
}
```

**Side effects:** Persiste en `chat_messages` + SSE push al panel del operador + (futuro) WhatsApp Business API forward.

#### `GET /chat/messages` — Auth: JWT(USER)

```json
// Response 200
[
  {
    "id": "uuid-msg",
    "text": "...",
    "sender": "operator",
    "timestamp": 1708300000000,
    "status": "delivered"
  }
]
```

Permite recuperar el historial cuando el usuario borra el `localStorage`.

#### `GET /sse/chat` — Auth: JWT(USER)

Canal SSE para recibir respuestas del operador en tiempo real sin polling.

---

### MÓDULO: Webhooks Stripe (`/webhooks`)

#### `POST /webhooks/stripe` — Sin Auth JWT (verificación por firma Stripe)

```
// Header: Stripe-Signature: t=...,v1=...
// Body: raw Buffer (NO parsear como JSON antes de verificar firma)
```

Eventos manejados:

| Evento Stripe | Acción |
|---|---|
| `payment_intent.succeeded` | → `reservations.status = 'CONFIRMED'`, generar `qrCodeHash`, cancelar job BullMQ de expiración |
| `payment_intent.payment_failed` | → `reservations.status = 'CANCELLED'`, liberar vehículo |
| `payment_intent.canceled` | → Igual que `payment_failed` |

**Idempotencia:** Antes de procesar, verificar `WHERE stripe_payment_intent_id = $1`. Si la reserva ya está en `CONFIRMED`, retornar 200 inmediatamente (el webhook puede llegar duplicado).

---

## SECCIÓN 3: Estrategia de Tiempo Real y Tareas en Segundo Plano

### 3.1 Server-Sent Events (SSE) — Arquitectura

**¿Por qué SSE y no WebSockets?**

Para este caso de uso, los SSE son la elección correcta:
- La comunicación es **unidireccional** (servidor → cliente): el cliente envía comandos REST, el servidor notifica cambios de estado.
- SSE reconecta automáticamente (spec HTTP), WebSockets requieren lógica custom.
- No requiere librerías adicionales en el frontend (API nativa del navegador).
- Compatible con HTTP/2 multiplexing.

**Canales SSE definidos:**

| Canal | Path | Consumidor | Eventos |
|---|---|---|---|
| Documentos del cliente | `GET /sse/documents/:reservationId` | WaitingRoomClient.tsx | `document-status` |
| Chat del cliente | `GET /sse/chat` | Chat UI | `new-message` |
| Panel del operador | `GET /sse/operator` | Operator Dashboard | `new-document`, `new-chat-message` |

**Implementación NestJS:**

```typescript
// nestjs/src/sse/sse.service.ts
@Injectable()
export class SseService {
  // Map: reservationId → Subject<MessageEvent>
  private documentChannels = new Map<string, Subject<MessageEvent>>();

  getDocumentChannel(reservationId: string): Observable<MessageEvent> {
    if (!this.documentChannels.has(reservationId)) {
      this.documentChannels.set(reservationId, new Subject());
    }
    return this.documentChannels.get(reservationId)!.asObservable();
  }

  emitDocumentStatusChange(reservationId: string, payload: DocumentStatusEvent) {
    this.documentChannels.get(reservationId)?.next({
      data: JSON.stringify(payload),
      type: 'document-status',
    } as MessageEvent);
  }
}
```

**Escalabilidad:** En MVP con un solo proceso NestJS el `Subject` en memoria es suficiente. Cuando se escale a múltiples instancias, se sustituye por **Redis Pub/Sub**: cada instancia suscribe el canal Redis y emite al `Subject` local. Cambio de implementación sin afectar contratos.

### 3.2 BullMQ — Cola de Trabajos en Segundo Plano

**Queues definidas:**

#### `reservation-expiry-queue`

**Propósito:** Cancelar reservas donde el pago Stripe no llegó en 15 minutos.

```typescript
// Job añadido en POST /reservations
await this.reservationExpiryQueue.add(
  'check-expiry',
  { reservationId },
  { delay: 15 * 60 * 1000, jobId: reservationId, removeOnComplete: true }
);

// Worker
@Processor('reservation-expiry-queue')
export class ReservationExpiryProcessor {
  @Process('check-expiry')
  async handle(job: Job<{ reservationId: string }>) {
    const reservation = await this.reservationRepo.findOne(job.data.reservationId);
    // Si sigue PENDING_DEPOSIT, el webhook no llegó → cancelar
    if (reservation?.status === ReservationStatus.PENDING_DEPOSIT) {
      await this.reservationRepo.update(reservation.id, {
        status: ReservationStatus.CANCELLED,
      });
      // Notificar al usuario vía SSE / email
    }
  }
}
```

**Idempotencia del job:** `jobId: reservationId` garantiza que si el webhook llega antes de los 15 min y reintenta el job, BullMQ lo descarta (job con ese ID ya completado/eliminado).

#### `video-upload-queue`

**Propósito:** Subir el vídeo de 30s de daños al entorno S3 sin bloquear la respuesta del operador.

```typescript
// Añadido en POST /operator/reservations/:id/deliver
await this.videoUploadQueue.add('upload-video', {
  reservationId,
  tempFilePath: '/tmp/nexus-video-xxx.mp4',
}, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
```

El Worker hace `PutObject` a S3 y actualiza `delivery_video_key` en la reserva. El operador ya ha recibido el `200 OK` y el cliente ha salido del aeropuerto.

#### `document-review-notification-queue`

**Propósito:** Enviar notificación WhatsApp al operador cuando llega un documento nuevo.

```typescript
// Side effect de POST /documents/:id/confirm-upload
await this.notificationQueue.add('notify-operator', {
  documentType,
  customerName,
  operatorWhatsApp: process.env.OPERATOR_WHATSAPP,
});
```

En MVP reenvía al número del operador vía WhatsApp Business API o un mensaje HTTP simple. En producción: integración con Twilio/360dialog.

---

## SECCIÓN 4: Alertas de Seguridad y Malas Prácticas (Para el Equipo de UI)

Tras el análisis del código frontend, hay **3 riesgos** que requieren acción coordinada:

---

### 🔴 CRÍTICO — Client-Side Price Calculation

**Ubicación:** `src/stores/useBookingStore.ts` líneas 43-52

**Problema:** `totalPriceEUR = totalDays * selectedVehiclePricePerDay` se calcula en el cliente y se persiste en `sessionStorage`. Si el frontend enviara este valor al backend en el body del `POST /reservations`, un usuario malicioso podría modificar el `sessionStorage` para pagar menos.

**Situación actual:** El mock no envía `totalPriceEUR` en el body de reserva (el endpoint no existe aún). El riesgo es que al integrar, el desarrollador lo incluya en el body "por comodidad".

**Decisión arquitectónica (ya reflejada en este RFC):** El body de `POST /reservations` acepta ÚNICAMENTE `{ vehicleId, pickupDate, returnDate, pickupLocation }`. El precio se **recalcula siempre en el servidor** usando `vehicle.pricePerDay` de la base de datos. El backend rechaza cualquier campo `totalPriceEUR` en el body (whitelist via `class-validator` + `ValidationPipe` con `whitelist: true`).

**Acción requerida del equipo UI:** Confirmar que al implementar la llamada real a la API, el `POST /reservations` no incluya `totalPriceEUR` ni `totalDays` en el body. Los valores mostrados en la UI de confirmación deben venir de la respuesta del servidor, no del store.

---

### 🟡 IMPORTANTE — QR Hash generado client-side

**Ubicación:** `src/components/customer/SmartTicketClient.tsx` líneas 53-55

**Código actual:**
```typescript
const hash = `NEXUS-${reservationId}-${selectedVehicleId ?? "v1"}-${Date.now()}`;
generateQRCodeSVG(hash).then(setQrSvg);
```

**Problema:** El hash se genera con `Date.now()` en el cliente, lo que significa que **cada vez que el usuario abre el Smart Ticket, el QR es diferente**. El operador no podría verificarlo porque nunca vio el mismo hash. Además, un usuario malintencionado podría generar un QR con cualquier `reservationId`.

**Decisión arquitectónica:** El `qrCodeHash` es generado por el backend una sola vez (en el momento del webhook de Stripe `payment_intent.succeeded`) usando `HMAC-SHA256`. Se persiste en `reservations.qr_code_hash` y se devuelve en `GET /reservations/me`.

**Acción requerida del equipo UI:** Modificar `SmartTicketClient.tsx` para usar `reservation.qrCodeHash` recibido de la API en lugar de generarlo localmente. El componente ya recibe `reservationId` como prop — con la llamada a `GET /reservations/:id` tendrá el hash real.

---

### 🟡 IMPORTANTE — Documentos enviados como base64 en localStorage

**Ubicación:** `src/components/customer/DocumentUploadStep.tsx` línea 153

**Código actual:**
```typescript
localStorage.setItem(`nexus-pending-${type}`, preview); // preview = dataUrl base64
```

**Problema:** Una imagen JPEG en base64 puede pesar ~3-4 MB. `localStorage` tiene un límite de ~5-10 MB según el navegador. Si el usuario tiene el `localStorage` lleno de otras cosas, la foto se pierde silenciosamente (el código tiene un `catch` vacío en línea 143) y el usuario cree que se guardó.

**Segunda preocupación:** El base64 queda en `localStorage` indefinidamente si el usuario cierra el navegador sin reconectarse. Datos biométricos (pasaporte) persistentes en el navegador es un riesgo de privacidad (GDPR/DPDM Maroc) aunque sea temporal.

**Decisión arquitectónica (flujo de subida con presigned URLs):** Con el flujo de 2 pasos definido en Sección 2 (`POST /documents/upload-url` → `PUT S3 presigned`), el archivo va **directamente al CDN/S3** sin pasar por el backend NestJS ni por `localStorage`. El modo offline se gestiona con una cola en memoria (no localStorage).

**Acción requerida del equipo UI:** Eliminar el bloque de `localStorage.setItem` del `DocumentUploadStep`. La lógica offline se implementará con un `ServiceWorker` + `IndexedDB` (en Sprint posterior) para no bloquear el MVP.

---

## SECCIÓN 5: Variables de Entorno del Backend

```bash
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/nexus_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=<clave_aleatoria_256_bits>
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_DEPOSIT_AMOUNT_CENTS=1000   # 10.00 EUR

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-1
AWS_S3_BUCKET_NAME=nexus-documents

# App
PORT=3001
NODE_ENV=production
NEXUS_QR_HMAC_SECRET=<clave_aleatoria_256_bits_distinta_a_JWT>

# WhatsApp
OPERATOR_WHATSAPP=212600000000
```

---

## SECCIÓN 6: Estructura de Módulos NestJS

```
nestjs-backend/
├── src/
│   ├── auth/              # JWT, Guards, registro/login
│   ├── vehicles/          # Catálogo, disponibilidad
│   ├── reservations/      # Booking, concurrencia, Stripe
│   ├── documents/         # Upload S3, presigned URLs
│   ├── operator/          # Dashboard, entregas, validación docs
│   ├── sse/               # Server-Sent Events service
│   ├── chat/              # Mensajes, notificaciones
│   ├── webhooks/          # Stripe webhook handler
│   ├── queues/            # BullMQ processors
│   │   ├── reservation-expiry.processor.ts
│   │   ├── video-upload.processor.ts
│   │   └── notification.processor.ts
│   ├── common/
│   │   ├── guards/        # RolesGuard, JwtAuthGuard
│   │   ├── decorators/    # @Roles(), @CurrentUser()
│   │   └── interceptors/  # TransformInterceptor (camelCase response)
│   └── main.ts
├── test/
└── docker-compose.yml     # PostgreSQL + Redis local
```

---

## SECCIÓN 7: Decisiones de Diseño Pendientes (Para el CTO)

| # | Decisión | Opción A | Opción B | Recomendación |
|---|---|---|---|---|
| D-1 | Refresh Tokens | JWT de larga duración (7d) | RT + AT (short-lived) | **B** para producción, A para MVP velocidad |
| D-2 | Modo offline documentos | localStorage (actual, problemático) | IndexedDB + SW | **B** — prioritario antes de lanzar |
| D-3 | Notificaciones operador | Polling cada 30s | SSE `/sse/operator` | **B** — ya arquitectado, mismo costo |
| D-4 | MAD exchange rate | Hardcoded en constants.ts (10.8) | API externa (ECB/Awb) | **A** para MVP, B para v1.1 |
| D-5 | ID de reserva (legible) | UUID v4 | `CMN-{AÑO}-{SEQ}` | **B** — el mock ya usa este formato, mejor UX para operador |

Para D-5: si se elige `CMN-{AÑO}-{SEQ}`, usar una secuencia PostgreSQL (`SEQUENCE`) para garantizar unicidad sin colisión en concurrencia, no un contador en memoria.
