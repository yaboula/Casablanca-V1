# SPRINT 3 — "The Trust Pipeline"
## Digital Check-in + Waiting Room + Smart Ticket (QR Boarding Pass)

**Duración estimada:** 6–8 días  
**Prerequisito:** Sprint 1 y 2 completados (el usuario ya tiene una `reservationId`)  
**Objetivo:** El flujo post-reserva más confiable y premium que un cliente haya visto en un alquiler de coches. El equivalente a hacer check-in online en Emirates.

---

## El Concepto Diferencial: "Airport-Grade Trust UI"

### ¿Por qué nadie lo hace así?

El check-in digital de los alquiladores tradicionales es un formulario con un `<input type="file">` genérico. El cliente no sabe si su foto ha llegado, si está bien, ni cuándo recibirá respuesta. Ansiedad pura.

Nosotros construimos una **interfaz de "Pipeline de Confianza"** en 3 actos:

1. **Check-in como "misión"**: El usuario siente que está realizando un proceso de seguridad real y sofisticado (porque lo es). UI inspirada en los procesos de e-Gate de los aeropuertos modernos.
2. **Waiting Room como "torre de control"**: No es un spinner. Es un panel de seguimiento en tiempo real de su documentación. Como el estado de su vuelo en la pantalla del aeropuerto.
3. **Smart Ticket como "boarding pass digital"**: El QR no es una imagen cuadrada aburrida. Es una tarjeta de embarque interactiva con datos en tiempo real, que sabe cuánto tiempo falta para la recogida.

---

## Tareas del Sprint 3

### TAREA 3.1 — Refactorización de `/check-in`

**Fichero:** `src/app/check-in/page.tsx`

La versión actual tiene 219 líneas con toda la lógica dentro. La dividimos en:
- `src/app/check-in/page.tsx` — Server Component (lee `reservationId` de la URL)
- `src/components/customer/CheckInFlow.tsx` — `"use client"` (el flujo interactivo)
- `src/components/customer/DocumentUploadStep.tsx` — `"use client"` (la cámara)
- `src/components/customer/CheckInProgressBar.tsx` — Client (la barra de progreso)

---

### TAREA 3.2 — Componente `<DocumentUploadStep />` ⭐ ÚNICO

**Fichero:** `src/components/customer/DocumentUploadStep.tsx` — `"use client"`

**Este componente es el corazón del Check-in. Es nuevo, reemplaza todo el sistema de subida actual.**

#### Dos modos de captura (tabs en la parte superior):

**MODO 1: Cámara en Vivo (preferido)**
```
┌─────────────────────────────────────────┐
│                                         │
│  [VIEWFINDER — stream de la cámara]     │
│                                         │
│  ┌ - - - - - - - - - - - - - - - - ┐   │
│  |  Marco guía del documento        |   │
│  |  (rectángulo con esquinas        |   │
│  |   animadas en azul-600)          |   │
│  └ - - - - - - - - - - - - - - - - ┘   │
│                                         │
│  "Centra tu pasaporte en el marco"      │
│                                         │
│  [📷 Capturar]                         │
└─────────────────────────────────────────┘
```

Implementación:
```tsx
// getUserMedia API — funciona en todos los móviles modernos
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'environment' }, // Cámara trasera
  audio: false,
});
videoRef.current.srcObject = stream;

// Al capturar: canvas.drawImage(video) → toBlob() → File
// El archivo se envía como multipart/form-data al backend
```

El **marco guía** es un `<div>` con bordes CSS en las 4 esquinas (sin los lados completos, técnica CSS pura). Pulsa suavemente con `animate={{ opacity: [0.8, 1, 0.8] }}` para comunicar "activo y esperando".

**Detección de calidad en el cliente (antes de subir):**
Usando el Canvas API, verificamos que la imagen no esté demasiado oscura antes de subirla:
```tsx
// Analizar el brillo medio del canvas
// Si < umbral → mostrar warning "Necesita más luz"
// No se sube hasta que la imagen sea válida
const avgBrightness = getAverageBrightness(canvas);
if (avgBrightness < 40) setWarning('low-light');
```

**MODO 2: Subir desde galería (fallback)**
- Un `<input type="file" accept="image/*">` completamente estilizado
- Mismo procesamiento de calidad antes de subir
- Preview de la imagen seleccionada con opción de "cambiar"

#### Estados del paso de subida:

```
IDLE       → El viewfinder/selector está activo
CAPTURED   → Preview de la foto con [✓ Usar esta foto] / [Repetir]
UPLOADING  → Barra de progreso (no spinner) + "Subiendo de forma segura..."
UPLOADED   → Check verde + "Documento recibido ✓"  
ERROR      → Toast (Sonner) + "Foto borrosa o ilegible. Intenta con más luz."
```

---

### TAREA 3.3 — Flujo Completo del Check-in

**Fichero:** `src/components/customer/CheckInFlow.tsx`

**Los 3 pasos (refactorizado del original):**

**PASO 1 — Pasaporte**
- Header: `"Paso 1 de 2 · Pasaporte"`
- Instrucción visual: Ícono de pasaporte + "Fotografía la página con tu foto"
- `<DocumentUploadStep type="PASSPORT" />`
- Al completar → auto-avance al Paso 2 con transición slide

**PASO 2 — Carnet de conducir**
- Header: `"Paso 2 de 2 · Carnet de Conducir"`
- `<DocumentUploadStep type="DRIVING_LICENSE" />`
- Al completar → redirect a `/waiting-room?reservationId=...`

**Barra de progreso superior:**
- Dos segmentos, se rellena por pasos
- No es solo color — cada segmento tiene un ícono del documento correspondiente
- El segmento activo pulsa suavemente

**Manejo de estado offline:**
- Si el usuario está sin conexión al intentar subir → Toast Sonner: "Sin conexión. Guardando localmente..."
- La foto se guarda en `localStorage` como base64
- Un listener de `window.addEventListener('online', ...)` la reintenta automáticamente
- Cuando se recupera la conexión → Toast: "Conexión restaurada. Subiendo tu foto..."

---

### TAREA 3.4 — Refactorización de `/waiting-room` ⭐ ÚNICO

**Fichero:** `src/app/waiting-room/page.tsx`

La versión actual tiene un timer hardcodeado de 5 segundos y 3 líneas de logs. La nueva versión es un **Panel de Seguimiento en Tiempo Real** estilo "estado de vuelo".

#### Diseño Visual

```
┌─────────────────────────────────────────────┐
│  🛡️ VERIFICACIÓN DE SEGURIDAD              │
│  Reserva #CMN-2026-001                      │
├─────────────────────────────────────────────┤
│                                             │
│  DOCUMENTOS ENVIADOS                        │
│                                             │
│  ● Pasaporte            [RECIBIDO ✓]       │
│  ● Carnet de Conducir   [RECIBIDO ✓]       │
│                                             │
├─────────────────────────────────────────────┤
│  ESTADO DE VERIFICACIÓN                     │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  ◉ EN REVISIÓN                      │    │
│  │  Nuestro equipo revisa tus           │    │
│  │  documentos manualmente              │    │
│  │                                     │    │
│  │  Tiempo estimado: < 2 horas         │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [FEED DE ESTADO — como log de terminal]   │
│                                             │
│  > Documentos recibidos en servidor...  ✓   │
│  > Iniciando verificación manual...     ✓   │
│  > En cola de revisión (pos. 2)...      ⟳   │
│                                             │
├─────────────────────────────────────────────┤
│  ¿Preguntas mientras esperas?               │
│  [💬 WhatsApp con nuestro equipo]          │
└─────────────────────────────────────────────┘
```

#### Polling de Estado Real (preparado para backend)

```tsx
// Cada 30 segundos, consultar el estado de los documentos
// Cuando el backend devuelva status: 'APPROVED' → redirect automático al Smart Ticket
// En MVP mock: simular la transición con un timeout configurable por env variable

useEffect(() => {
  const interval = setInterval(async () => {
    const status = await fetchDocumentStatus(reservationId);
    if (status === 'APPROVED') {
      router.push(`/smart-ticket?reservationId=${reservationId}`);
    }
    if (status === 'REJECTED') {
      router.push(`/check-in?reservationId=${reservationId}&retry=true`);
    }
  }, 30_000);
  return () => clearInterval(interval);
}, [reservationId]);
```

#### Estado RECHAZADO

Si el operador rechaza los documentos, la Waiting Room transiciona a un estado de error que NO genera pánico:

```
┌─────────────────────────────────────────────┐
│  ⚠️ ACCIÓN REQUERIDA                        │
│                                             │
│  Tu pasaporte no pudo ser verificado.       │
│  Motivo: "Imagen borrosa o incompleta"      │
│                                             │
│  No te preocupes, pasa frecuentemente       │
│  con fotos tomadas con poca luz.            │
│                                             │
│  [📷 Volver a subir pasaporte]             │
│                                             │
│  ¿Necesitas ayuda? [WhatsApp →]            │
└─────────────────────────────────────────────┘
```

El tono es tranquilizador, nunca alarmante. Esto es "trust-friendly".

---

### TAREA 3.5 — Refactorización del `/smart-ticket` ⭐ ÚNICO

**Fichero:** `src/app/smart-ticket/page.tsx`

La versión actual es un card estático con un ícono de QR. La nueva versión es un **Boarding Pass Digital con contexto en tiempo real**.

#### Diseño: Boarding Pass Premium

Inspirado en las tarjetas de embarque de aerolíneas premium (Qatar Airways, Emirates), pero para coches.

```
┌─────────────────────────────────────────────┐
│  NEXUS.           🌟 PASE APROBADO          │
├─────────────────────────────────────────────┤
│                                             │
│  PASAJERO                    VEHÍCULO       │
│  AHMED BENJELLOUN            AUDI A4        │
│                              · MAT: 1234AB5 │
│  RECOGIDA                    ENTREGA        │
│  CMN T2                      CMN T2         │
│  Jue 19 Feb 09:00            Mar 24 Feb     │
│                                             │
├── ── ── ── ── ── ── ── ── ── ── ── ── ──  ─┤
│         ┌───────────────────────┐           │
│         │                       │           │
│         │   [QR CODE REAL]      │           │
│         │   128×128 SVG         │           │
│         │                       │           │
│         └───────────────────────┘           │
│                                             │
│         Muestra este código al operario     │
│                                             │
├─────────────────────────────────────────────┤
│  BALANCE PENDIENTE AL RECOGER               │
│  790 €  ← en azul grande, imposible perder │
│                                             │
│  TIEMPO HASTA RECOGIDA                      │
│  3h 24min  ← Countdown dinámico            │
│                                             │
│  [💬 Avisar por WhatsApp — "He aterrizado"]│
└─────────────────────────────────────────────┘
```

#### Características Técnicas del Smart Ticket

**1. QR Code Real:**
```bash
npm install qrcode
```
Generar el QR en el cliente con el `qrCodeHash` de la reserva. El operario lo escaneará con la App del Sprint 4.

**2. Countdown hasta la recogida:**
```tsx
// Calcula la diferencia entre ahora y pickupDate
// Se actualiza cada segundo con un intervalo
// Formato: "3h 24min" o "En 45min" o "¡Ahora!"
// Cuando llega a cero → el texto cambia a "Tu operario te está esperando"
// y la tarjeta hace un pulso verde de celebración
```

**3. Botón WhatsApp pre-rellenado:**
```tsx
// El enlace de WhatsApp incluye un mensaje pre-escrito
const whatsappMessage = encodeURIComponent(
  `Hola, soy ${customerName}. He aterrizado en CMN y tengo la reserva #${reservationId}. ¿Puedes indicarme el punto de recogida?`
);
const whatsappUrl = `https://wa.me/${OPERATOR_PHONE}?text=${whatsappMessage}`;
```

**4. Animación Ambient del Boarding Pass:**
- El fondo de la tarjeta tiene un gradiente animado muy sutil (azul → verde → azul) que se mueve lentamente, como los displays de los aeropuertos
- La animación está pausada si `prefers-reduced-motion: reduce`

**5. "Añadir a Apple Wallet / Google Wallet" (placeholder):**
- El botón existe pero muestra un Toast: "Próximamente disponible"
- Esto comunica que somos una empresa que piensa a futuro, aunque no esté implementado

---

### TAREA 3.6 — Área del Cliente `(customer)/`

**Sprint 3 incluye las pantallas básicas del área autenticada del cliente.**

**Fichero:** `src/app/(customer)/dashboard/page.tsx`

```
[Header con "Hola, Ahmed"]

[MIS RESERVAS]

┌─────────────────────────────────────────────┐
│  Audi A4 · CMN · 19–24 Feb 2026            │
│  Estado: EN CURSO                           │  ← Badge verde
│  [Ver Smart Ticket →]                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Mercedes C · CMN · 05–10 Ene 2026         │
│  Estado: COMPLETADA                         │  ← Badge gris
│  [Ver resumen →]                            │
└─────────────────────────────────────────────┘
```

Si no hay reservas: Estado vacío con ilustración y CTA a `/catalog`.

**Fichero:** `src/app/(customer)/profile/page.tsx`

- Mostrar nombre, email, teléfono
- Botón "Cerrar sesión"
- Sección "Documentos verificados" con el estado de los documentos de la última reserva

---

### TAREA 3.7 — Librería `src/lib/qr.ts`

```typescript
// Utilidad para generar el QR
// Usa la librería qrcode para generar un SVG string
// que se inyecta directamente en el DOM (más limpio que canvas)

export async function generateQRCodeSVG(hash: string): Promise<string> {
  const qrcode = await import('qrcode');
  return qrcode.toString(hash, { type: 'svg', margin: 1 });
}
```

---

## Checklist de Validación Sprint 3

- [ ] La cámara funciona en iOS Safari y Android Chrome
- [ ] La detección de imagen oscura (low-light) muestra el warning correcto
- [ ] El modo offline guarda la foto y la reintenta al reconectar
- [ ] El polling de estado en `/waiting-room` funciona sin bloquear la UI
- [ ] El redirect automático a `/smart-ticket` ocurre cuando el estado es APPROVED
- [ ] El redirect automático a `/check-in` ocurre cuando el estado es REJECTED
- [ ] El countdown del Smart Ticket se actualiza cada segundo sin memory leaks (cleanup del interval)
- [ ] El QR se genera correctamente con el hash de la reserva
- [ ] El botón de WhatsApp tiene el mensaje pre-rellenado con los datos correctos del usuario
- [ ] El área `/(customer)/dashboard` está protegida por middleware (requiere login)
- [ ] `prefers-reduced-motion` pausa las animaciones ambient
- [ ] `npm run build` sin errores

---

## Dependencias a instalar en este Sprint

```bash
npm install qrcode
npm install @types/qrcode --save-dev
```

---

## Entregable Final del Sprint 3

El flujo completo funciona de extremo a extremo (con mocks):

```
/book/[id] → checkout completado
     ↓
/check-in → sube pasaporte y carnet (cámara o galería)
     ↓
/waiting-room → ve el estado en tiempo real
     ↓
(mock approve a los X segundos)
     ↓
/smart-ticket → ve el QR, el balance y el countdown
     ↓
[Toca WhatsApp] → abre WhatsApp con mensaje pre-escrito
```

Este es el flujo que diferencia el producto. Cuando el cliente lo complete por primera vez, debe sentir que acaba de hacer el check-in de un vuelo de negocios, no de alquilar un coche.

