# INT-SPRINT 7 — Tiempo Real (SSE) & Smart Ticket QR
> **Objetivo**: Reemplazar todos los `setTimeout` de simulación con eventos reales vía Server-Sent Events (SSE) del backend. Conectar el Smart Ticket y el escáner QR del operador al backend real.

---

## Contexto actual (estado mock)

| Componente | Mock actual |
|---|---|
| `src/app/waiting-room/page.tsx` (`WaitingRoomClient`) | `setTimeout(3000)` simula que los docs fueron aprobados |
| `src/app/smart-ticket/page.tsx` (`SmartTicketClient`) | QR generado en cliente con datos mock — no vinculado a reserva real |
| `src/components/operator/QRScannerFAB.tsx` | Escáner que no valida contra backend |
| `src/components/customer/WaitingRoomClient.tsx` | Escucha evento simulado, no SSE real |

### Arquitectura SSE del backend (ya implementada en NestJS)

```
GET /api/v1/sse/user/:userId
  Headers: Authorization: Bearer <JWT>
  Response: text/event-stream

Eventos emitidos por el backend:
  event: document.approved    → { documentType: 'PASSPORT' | 'DRIVING_LICENSE', reservationId }
  event: document.rejected    → { documentType, reason, reservationId }
  event: reservation.confirmed → { reservationId }
  event: reservation.completed → { reservationId }
```

---

## Tareas

### T7-1 — Proxy SSE en Next.js (`src/app/api/sse/proxy/route.ts`)

> **Decisión de arquitectura**: `EventSource` del browser no permite headers `Authorization`. Pasar el JWT como `?token=` en la URL es una vulnerabilidad crítica (CWE-317) — queda expuesto en logs de Nginx/Vercel/CloudFront e historial del browser. **NestJS no debe aceptar tokens por URL nunca.** La solución correcta es un Route Handler de Next.js que actúa como proxy en streaming.

```
Browser → GET /api/sse/proxy   (sin token en URL, cookie HttpOnly automática)
               ↓
    Next.js Route Handler   (lee nexus_token de cookie, inyecta Authorization header)
               ↓  Authorization: Bearer <token>
    NestJS GET /api/v1/sse/user/:userId  (token siempre por header)
               ↓  text/event-stream pipe
    Browser   (recibe eventos normalmente con EventSource estándar)
```

**Crear** `src/app/api/sse/proxy/route.ts`:

```typescript
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexus_token')?.value;
  if (!token) return new Response('Unauthorized', { status: 401 });

  // Decodificar payload para obtener userId (sin verificar firma — solo routing)
  const payload = JSON.parse(atob(token.split('.')[1]));
  const userId = payload.sub;

  // Abrir conexión con NestJS inyectando el header — el token NUNCA va en la URL
  const upstreamRes = await fetch(
    `${process.env.API_URL}/sse/user/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      // @ts-expect-error — Node 18+ fetch soporta duplex
      duplex: 'half',
    },
  );

  if (!upstreamRes.ok || !upstreamRes.body) {
    return new Response('SSE upstream error', { status: 502 });
  }

  // Pipe el ReadableStream de NestJS directamente al browser
  return new Response(upstreamRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // deshabilitar buffer en Nginx
    },
  });
}
```

### T7-2 — Conectar `WaitingRoomClient` al SSE via Proxy

`src/components/customer/WaitingRoomClient.tsx`:

**Eliminar:**
```typescript
// setTimeout que simula aprobación
useEffect(() => {
  const t = setTimeout(() => setAllApproved(true), 3000);
  return () => clearTimeout(t);
}, []);
```

**Reemplazar por** (el cliente conecta al proxy interno, sin token visible):
```typescript
useEffect(() => {
  if (!reservationId) return;

  // La URL del EventSource no contiene ningún token — la cookie se envía automáticamente
  const evtSource = new EventSource('/api/sse/proxy');

  evtSource.addEventListener('document.approved', (e) => {
    const data = JSON.parse(e.data);
    if (data.reservationId !== reservationId) return;
    setDocStatus(prev => {
      const updated = { ...prev, [data.documentType.toLowerCase()]: 'APPROVED' as const };
      if (updated.passport === 'APPROVED' && updated.license === 'APPROVED') {
        router.push(`/smart-ticket?reservationId=${reservationId}`);
      }
      return updated;
    });
  });

  evtSource.addEventListener('document.rejected', (e) => {
    const data = JSON.parse(e.data);
    if (data.reservationId !== reservationId) return;
    setDocStatus(prev => ({ ...prev, [data.documentType.toLowerCase()]: 'REJECTED' as const }));
    toast.error(`Documento rechazado: ${data.reason}`);
  });

  evtSource.onerror = () => setConnectionStatus('error');
  evtSource.onopen = () => setConnectionStatus('connected');

  return () => evtSource.close();
}, [reservationId, router]);
```

> **Sin cambios en NestJS**: el `SseController` sigue aceptando solo `Authorization` header. El proxy lo gestiona.

### T7-3 — Smart Ticket QR real (`/smart-ticket`)

`src/app/smart-ticket/page.tsx` (`SmartTicketClient`):

**Estado actual**: genera un QR con datos del store local (mock).

**Estado objetivo**:
1. Al llegar a la página, hacer fetch de la reserva real: `GET /api/v1/reservations/:id`
2. El backend devuelve `reservation.qrCodeHash` (generado y almacenado al confirmar la reserva)
3. Generar el QR en cliente usando ese hash real:

```typescript
// Usar la misma librería qr.ts del lib
import { generateQR } from '@/lib/qr';

useEffect(() => {
  if (!reservationId) return;
  apiFetch<{ qrCodeHash: string }>(`/reservations/${reservationId}`, { auth: true })
    .then(res => generateQR(res.qrCodeHash))
    .then(setQrDataUrl);
}, [reservationId]);
```

El QR contiene solo el `qrCodeHash` — el operador lo escanea y valida contra el backend.

### T7-4 — Escáner QR del Operador (`QRScannerFAB`)

`src/components/operator/QRScannerFAB.tsx`:

**Estado actual**: escanea el QR pero no valida contra el backend.

**Flujo objetivo**:
1. Operador escanea QR del cliente con la cámara
2. Se extrae el `qrCodeHash` del QR
3. Frontend llama: `POST /api/v1/operator/qr/scan { qrHash: string }`
4. Backend valida el hash, devuelve los datos de la reserva
5. Operador ve: nombre del cliente, vehículo, fechas, estado de documentos, balance a cobrar

```typescript
async function handleScan(rawQrContent: string) {
  try {
    const result = await apiFetch<OperatorDelivery>('/operator/qr/scan', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ qrHash: rawQrContent }),
    });
    setScannedReservation(result);
    setModalOpen(true);
  } catch (err) {
    if (err.statusCode === 404) toast.error('QR no reconocido.');
    else if (err.statusCode === 409) toast.error('Esta reserva ya fue procesada.');
    else toast.error('Error al validar el QR.');
  }
}
```

### T7-5 — Modal de confirmación post-scan

Tras escanear correctamente, mostrar modal con:
- Nombre del cliente
- Vehículo asignado
- Fechas de alquiler
- Estado de documentos (✅/⚠️)
- Balance a cobrar (en EUR)
- Botón "Confirmar entrega" → `PATCH /api/v1/operator/reservations/:id/checkin`

### T7-6 — Reconexión automática del SSE

La conexión SSE puede perderse (timeout, red). `EventSource` tiene reconexión automática built-in, pero implementar reconexión exponencial controlada como backup:

```typescript
// El EventSource nativo ya reintenta automáticamente.
// Para control fino, cerrar y reabrir con backoff:
function createSSEConnection(onEvent: SSEHandlers) {
  let retries = 0;

  function connect() {
    // La URL interna del proxy NUNCA contiene token — cookie se envía automáticamente
    const es = new EventSource('/api/sse/proxy');
    es.onerror = () => {
      es.close();
      const delay = Math.min(1000 * 2 ** retries++, 30000);
      setTimeout(connect, delay);
    };
    es.onopen = () => { retries = 0; }; // reset backoff al reconectar
    // ... attach handlers
    return es;
  }

  return connect();
}
```

### T7-7 — Estado de espera mientras SSE no está conectado

Mostrar en `WaitingRoomClient` un indicador de conexión:
- `connecting` → "Conectando con el servidor..."
- `connected` → "En espera de verificación..."
- `error` → "Sin conexión — actualizaremos automáticamente"

### T7-8 — Limpiar `WaitingRoomClient` del mock completo

Eliminar:
- `setTimeout` de simulación
- Estado de documentos hardcodeado
- Cualquier referencia a `MOCK_VEHICLES`

---

## Criterios de aceptación

- [ ] `WaitingRoomClient` recibe el evento SSE real cuando el operador aprueba un documento
- [ ] Tras ambos documentos aprobados → navega automáticamente a `/smart-ticket`
- [ ] Smart Ticket muestra QR con el `qrCodeHash` real de la reserva
- [ ] El operador puede escanear el QR y ver los datos reales de la reserva
- [ ] Si el QR es inválido → toast de error descriptivo
- [ ] Reconexión automática del SSE si se pierde la conexión
- [ ] Sin ningún `setTimeout` de simulación en el flujo de aprobación

---

## Archivos a modificar

| Archivo | Acción |
|---|---|
| `src/components/customer/WaitingRoomClient.tsx` | Reemplazar setTimeout por EventSource real |
| `src/app/smart-ticket/page.tsx` / `SmartTicketClient` | QR con hash real de la reserva |
| `src/components/operator/QRScannerFAB.tsx` | Validación del QR contra backend |

| Archivo | Crear |
|---|---|
| `src/app/api/sse/proxy/route.ts` | **Proxy SSE de Next.js** — inyecta Authorization header, protege el JWT |
| `src/lib/sse.ts` | Helper de reconexión con backoff exponencial |

> **Sin cambios en NestJS**: el `SseController` **no** acepta `?token=` — el proxy gestiona la autenticación.

---

## Dependencias
- **Requiere**: INT-SPRINT 1 (userId y JWT para conexión SSE)
- **Requiere**: INT-SPRINT 3 (reservationId real + qrCodeHash generado)
- **Requiere**: INT-SPRINT 5 (documentos subidos — para que el operador los apruebe y dispare el SSE)
- **Requiere**: INT-SPRINT 6 (operador autenticado con rol correcto para escanear QR)

---

## Notas de Seguridad

**JWT en URL descartado definitivamente (CWE-317)**. Con el proxy Next.js:
- El JWT viaja en la cookie `nexus_token` (HttpOnly, Secure, SameSite=Strict) — nunca en URLs
- Los logs de Nginx/Vercel/CloudFront no capturan el token
- El historial del browser no contiene el token
- NestJS solo acepta `Authorization: Bearer` header — sin excepciones

**Para producción con alta carga**: considerar un ticket SSE de un solo uso (90s TTL) emitido por un endpoint `POST /api/v1/sse/ticket` y consumido por el proxy, para evitar que el JWT de larga vida circule en peticiones de larga duración (la conexión SSE puede durar horas).
