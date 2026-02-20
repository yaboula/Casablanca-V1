# INT-SPRINT 5 — Check-in & Subida de Documentos
> **Objetivo**: Conectar el flujo de check-in (passport + licencia) al backend real: presigned URLs de S3, subida segura de archivos y actualización de estado de documentos.

---

## Contexto actual (estado mock)

```typescript
// src/components/customer/DocumentUploadStep.tsx
// Actualmente: hace upload a un servicio ficticio o simplemente simula el proceso
```

El flujo actual:
1. El usuario sube una foto en `DocumentUploadStep.tsx`
2. El componente simula el upload (no hay destino real)
3. La app pasa al siguiente paso sin verificar nada
4. No se almacena ningún archivo

### Endpoints de backend disponibles

```
POST /api/v1/documents/presign
  Headers: Authorization: Bearer <JWT>
  Body: { reservationId: UUID, type: "PASSPORT" | "DRIVING_LICENSE" }
  Response: {
    uploadUrl: string,   ← Presigned URL de S3 para PUT directo
    fileKey: string,     ← clave S3
    expiresIn: number,   ← segundos de validez (15min)
  }

POST /api/v1/documents/confirm
  Headers: Authorization: Bearer <JWT>
  Body: { reservationId: UUID, type: "PASSPORT" | "DRIVING_LICENSE", fileKey: string }
  Response: ReservationDocument
```

---

## Flujo objetivo

```
[Cliente — DocumentUploadStep]
  1. Usuario selecciona archivo (foto de pasaporte)
  2. Frontend llama POST /api/v1/documents/presign
     → Recibe: { uploadUrl, fileKey }
  3. Frontend hace PUT directo al uploadUrl (S3) con el archivo
     → S3 acepta el archivo sin pasar por nuestro servidor
  4. Frontend llama POST /api/v1/documents/confirm con { fileKey }
     → Backend registra el documento como PENDING_REVIEW
  5. CheckInFlow avanza al paso 2 (licencia) y luego a /waiting-room

[Backend — Operador]
  El operador revisa el documento en /operator/documents
  PATCH /api/v1/operator/documents/:id/approve | reject
```

---

## Tareas

### T5-1 — Leer `DocumentUploadStep.tsx` completo y mapear el estado actual

```typescript
// src/components/customer/DocumentUploadStep.tsx
// Entender: cómo gestiona el archivo seleccionado, el preview y el submit
```

Identificar:
- Cómo recibe `reservationId` (viene de `CheckInFlow`, que lo recibe de `check-in/page.tsx`)
- Dónde está el botón de "confirmar upload"
- Qué hace actualmente en el `onComplete` callback

### T5-2 — Obtener `reservationId` real en la página de check-in

`src/app/check-in/page.tsx`:
```typescript
// Actualmente:
const { reservationId } = useBookingStore();  // puede ser null o ID ficticio

// Necesita:
// El reservationId REAL de la reserva activa del usuario (UUID de PostgreSQL)
// Opciones:
// A) Leerlo del useBookingStore (si se guardó el UUID real en INT-SPRINT 3)
// B) Fetch de /reservations/my y tomar la reserva CONFIRMED más reciente
```

Si INT-SPRINT 3 se implementa correctamente, el `reservationId` en el store ya será el UUID real. Si no, hacer fetch en un `useEffect`.

### T5-3 — Implementar upload con Presigned URL en `DocumentUploadStep`

```typescript
// src/components/customer/DocumentUploadStep.tsx

async function handleUpload(file: File, type: 'PASSPORT' | 'DRIVING_LICENSE') {
  setStatus('uploading');

  // 1. Obtener presigned URL
  const presign = await apiFetch<{ uploadUrl: string; fileKey: string }>(
    '/documents/presign',
    {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ reservationId, type }),
    }
  );

  // 2. Upload directo a S3 (PUT — sin auth header, la firma está en la URL)
  const uploadRes = await fetch(presign.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  if (!uploadRes.ok) throw new Error('Error subiendo a S3');

  // 3. Confirmar al backend
  await apiFetch('/documents/confirm', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ reservationId, type, fileKey: presign.fileKey }),
  });

  setStatus('success');
  onComplete(); // avanzar al paso siguiente
}
```

### T5-4 — Indicadores de progreso del upload

Durante el `PUT` a S3 no se tiene progreso nativo con `fetch`. Usar `XMLHttpRequest` para reportar progreso:

```typescript
function uploadToS3WithProgress(url: string, file: File, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error('Upload failed')));
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}
```

### T5-5 — Validaciones de archivo antes del upload

Antes de llamar al backend:
- Tamaño máximo: **5MB** (rechazar con toast si supera)
- Tipos permitidos: `image/jpeg`, `image/png`, `image/heic`, `application/pdf`
- Dimensiones mínimas si es imagen (opcional para MVP)

```typescript
function validateFile(file: File): string | null {
  if (file.size > 5 * 1024 * 1024) return 'El archivo no debe superar 5MB.';
  const allowed = ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'];
  if (!allowed.includes(file.type)) return 'Formato no permitido. Usa JPG, PNG o PDF.';
  return null;
}
```

### T5-6 — Página `/waiting-room` — conectar al SSE real

`src/app/waiting-room/page.tsx` actualmente usa un `setTimeout` que simula la aprobación de documentos. En INT-SPRINT 7 (Real-time) se conectará al SSE real. Por ahora, en este sprint simplemente:

- Mostrar el estado real de los documentos consultando `/reservations/my` (polling cada 10s)
- Mostrar `PENDING_REVIEW`, `APPROVED`, `REJECTED` por cada tipo de documento

```typescript
// Polling mientras esperamos SSE (interim solution)
useEffect(() => {
  const interval = setInterval(async () => {
    const reservations = await apiFetch('/reservations/my', { auth: true });
    // ... actualizar UI
  }, 10_000);
  return () => clearInterval(interval);
}, []);
```

---

## Criterios de aceptación

- [ ] El pasaporte se sube a S3 real vía Presigned URL
- [ ] La licencia de conducir se sube a S3 real vía Presigned URL
- [ ] El backend registra ambos documentos como `PENDING_REVIEW`
- [ ] Barra de progreso real durante el upload (no spinner indeterminado)
- [ ] Archivo demasiado grande o tipo incorrecto → toast de error descriptivo
- [ ] El `reservationId` es el UUID real de PostgreSQL
- [ ] Tras completar ambos docs → navegación a `/waiting-room`

---

## Archivos a modificar

| Archivo | Acción |
|---|---|
| `src/components/customer/DocumentUploadStep.tsx` | Implementar upload con Presigned URL |
| `src/app/check-in/page.tsx` | Obtener `reservationId` real (UUID) |
| `src/app/waiting-room/page.tsx` | Polling de estado de docs (hasta INT-SPRINT 7) |

---

## Dependencias
- **Requiere**: INT-SPRINT 1 (JWT para llamar a `/documents/presign`)
- **Requiere**: INT-SPRINT 3 (reservationId UUID real en el store)
- **Requiere en backend**: `.env` con `AWS_S3_BUCKET` configurado y bucket accesible
- **Bloquea**: INT-SPRINT 7 (SSE reemplaza el polling de waiting-room)
