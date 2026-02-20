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

## Prerequisito de infraestructura — Política CORS en AWS S3

> **Bloqueante real**: Aunque NestJS genere la Presigned URL correctamente, el **navegador bloqueará el `PUT` directo a S3** con un error CORS, porque el origen (`localhost:3000` o `nexus.ma`) es distinto al bucket (`bucket.s3.amazonaws.com`).

**Configuración requerida en el bucket de S3** (tarea de DevOps/configuración AWS, no de código):

```json
[
  {
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://nexus.ma"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**Dónde aplicarlo**: AWS Console → S3 → Bucket → Permissions → Cross-origin resource sharing (CORS) → Edit → pegar el JSON anterior.

> Sin esta configuración, `T5-3` fallará 100% en el navegador aunque todo el código sea correcto. Verificar con `curl -X OPTIONS <presignedUrl> -H "Origin: http://localhost:3000"` antes de integrar.

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

## Archivos huérfanos en S3 — estado actual y gap identificado

**El escenario no cubierto**: El usuario obtiene la Presigned URL (`/documents/presign`), hace `PUT` exitoso a S3, pero pierde conexión **antes** de llamar a `/documents/confirm`. El archivo existe en S3 pero **no hay registro en PostgreSQL** → archivo huérfano indefinido.

**El processor existente** (`document-cleanup.processor.ts`) cubre un caso **diferente**: limpieza de archivos con estado `REJECTED` en BD, con un delay de 24h gestionado por BullMQ (triggered cuando el operador rechaza un doc). No hace scan periódico de S3.

**Acción requerida** (no MVP — documentar como tarea de mantenimiento):
- Implementar un job de BullMQ repetible (`repeat: { cron: '0 3 * * *' }`) que:
  1. Liste todos los `fileKey` en S3 con prefijo `docs/`
  2. Cruce contra `reservation_documents` en PostgreSQL
  3. Elimine de S3 cualquier clave con más de 24h que no tenga registro en BD

Esto **no bloquea el MVP** — los archivos huérfanos son escasos (pérdida de conexión mid-upload) y el coste de storage es mínimo. Registrar como deuda técnica post-lanzamiento.

---

## Criterios de aceptación

- [ ] Política CORS configurada en el bucket S3 (verificada con curl antes de integrar)
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
- **Requiere en backend**: `.env` con `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` configurados
- **Requiere en AWS**: Política CORS en el bucket (sin esto el `PUT` del navegador falla — ver sección de prerequisito)
- **Bloquea**: INT-SPRINT 7 (SSE reemplaza el polling de waiting-room)
