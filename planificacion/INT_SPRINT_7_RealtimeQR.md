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

### T7-1 — Conectar `WaitingRoomClient` al SSE real

`src/components/customer/WaitingRoomClient.tsx`:

**Eliminar:**
```typescript
// setTimeout que simula aprobación
useEffect(() => {
  const t = setTimeout(() => setAllApproved(true), 3000);
  return () => clearTimeout(t);
}, []);
```

**Reemplazar por:**
```typescript
useEffect(() => {
  // Leer userId de la cookie nexus_user (no HttpOnly)
  const user = getUserFromCookie(); // helper de src/lib/auth.ts
  if (!user || !reservationId) return;

  const token = getTokenFromCookie();
  const evtSource = new EventSource(
    `${process.env.NEXT_PUBLIC_API_URL}/sse/user/${user.id}`,
    // EventSource no soporta headers nativos → JWT via query param (excepción controlada)
    // O usar polyfill con fetch streaming
  );

  evtSource.addEventListener('document.approved', (e) => {
    const data = JSON.parse(e.data);
    if (data.reservationId !== reservationId) return;
    setDocStatus(prev => ({
      ...prev,
      [data.documentType.toLowerCase()]: 'APPROVED',
    }));
    // Si ambos APPROVED → navegar a /smart-ticket
    if (bothApproved(updatedStatus)) {
      router.push(`/smart-ticket?reservationId=${reservationId}`);
    }
  });

  evtSource.addEventListener('document.rejected', (e) => {
    const data = JSON.parse(e.data);
    if (data.reservationId !== reservationId) return;
    setDocStatus(prev => ({
      ...prev,
      [data.documentType.toLowerCase()]: 'REJECTED',
    }));
    toast.error(`Documento rechazado: ${data.reason}`);
    // Ofrecer re-upload → back to /check-in
  });

  return () => evtSource.close();
}, [reservationId]);
```

> **Nota técnica**: `EventSource` del browser no permite headers personalizados. Estrategias:
> - **Opción A (recomendada)**: El JWT se envía como query param `?token=XXX` — el backend lo acepta en la ruta SSE como excepción controlada (short-lived, HTTPS only).
> - **Opción B**: Polyfill `eventsource` o `fetch` streaming con `ReadableStream` para adjuntar header.

### T7-2 — Modificar backend SSE para aceptar token por query param

En `backend/src/sse/sse.controller.ts`:

```typescript
@Get('user/:userId')
@Sse()
async stream(
  @Param('userId') userId: string,
  @Query('token') queryToken: string,  // ← nuevo
  @Req() req: Request,
) {
  // Aceptar token del header Authorization: Bearer XXX O del query param ?token=XXX
  const token = queryToken || extractBearerToken(req);
  const payload = await this.jwtService.verifyAsync(token);
  if (payload.sub !== userId) throw new ForbiddenException();
  // ...
}
```

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

La conexión SSE puede perderse (timeout, red). Implementar reconexión exponencial:

```typescript
function createSSEConnection(userId: string, token: string, handlers: SSEHandlers) {
  let retries = 0;
  
  function connect() {
    const es = new EventSource(`${API}/sse/user/${userId}?token=${token}`);
    es.onerror = () => {
      es.close();
      const delay = Math.min(1000 * 2 ** retries++, 30000);
      setTimeout(connect, delay);
    };
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
| `src/lib/sse.ts` | Helper de conexión SSE con reconexión automática |

| Cambio backend | Razón |
|---|---|
| `SseController` — aceptar `?token=` query param | EventSource browser no permite headers |

---

## Dependencias
- **Requiere**: INT-SPRINT 1 (userId y JWT para conexión SSE)
- **Requiere**: INT-SPRINT 3 (reservationId real + qrCodeHash generado)
- **Requiere**: INT-SPRINT 5 (documentos subidos — para que el operador los apruebe y dispare el SSE)
- **Requiere**: INT-SPRINT 6 (operador autenticado con rol correcto para escanear QR)

---

## Notas de Seguridad

El JWT en query param (`?token=`) es una excepción aceptable únicamente cuando:
1. La conexión es HTTPS (no funciona en HTTP en producción)
2. El token tiene vida corta (15min o menos) — si el actual es de 24h, reducirlo para SSE
3. El backend limpia el token del log de acceso (configurar exclusión en el logger)

Alternativa más segura para producción: ticket de un solo uso (exchange el JWT por un SSE-ticket de 60s).
