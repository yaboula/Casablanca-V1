# SPRINT 4 — "The Control Room"
## Operator Dashboard + i18n + Divisa + Calidad Global

**Duración estimada:** 7–10 días  
**Prerequisito:** Sprints 1, 2 y 3 completados  
**Objetivo:** Entregar el cuadro de mandos del operario (el "Mago de Oz") y cerrar todos los gaps de calidad, internacionalización y divisa antes de la beta pública.

---

## El Concepto Diferencial: "Dispatching Intelligence"

### ¿Por qué nadie lo hace así?

Las apps internas de las empresas de alquiler son grids de tablas con botones genéricos. Son funcionales pero generan errores humanos: el operario en CMN, con cansancio y bajo presión de tiempo, maneja 8 entregas simultáneas con una interfaz confusa.

Nosotros construimos un **Dashboard de Despacho con Priorización Visual Automática**:

1. Las entregas se ordenan por urgencia automáticamente (el que aterriza en 30 minutos aparece primero, con un badge rojo pulsante).
2. La validación de documentos es un flujo de "swipe para aprobar / rechazar" inspirado en apps de moderación — la acción más frecuente del operario, hecha con un solo gesto.
3. El escáner QR está siempre accesible con un FAB (Floating Action Button) — no hay que navegar a otra pantalla.

---

## Tareas del Sprint 4

### TAREA 4.1 — Layout del Área del Operario

**Fichero:** `src/app/(operator)/layout.tsx`

El operario usa esto en su móvil en el aeropuerto. El diseño es radicalmente diferente al del cliente.

**Principios de diseño del Operator Layout:**
- Fondo `bg-slate-950` (casi negro) — reduce el brillo de pantalla en entornos oscuros del aeropuerto
- Tipografía ligeramente mayor que en la web cliente (`text-base` mínimo para leer rápido)
- Sin animaciones de entrada — las cosas aparecen inmediatamente. El operario no quiere esperar al intro splash.
- Bottom Tab Navigation (nunca hamburger — el hamburger mata la eficiencia)
- Badge de notificación en la pestaña "Docs Pendientes" con el número en tiempo real

**Bottom Tab Bar (4 pestañas):**
```
[📋 Entregas Hoy] [📄 Documentos] [🔍 Buscar] [👤 Mi Perfil]
```

---

### TAREA 4.2 — Dashboard "Entregas de Hoy" ⭐ ÚNICO

**Fichero:** `src/app/(operator)/dashboard/page.tsx` — `"use client"`

#### El Header de Estado del Día

```
┌─────────────────────────────────────────────┐
│  Jue 19 Feb · CMN Operations                │
│                                             │
│  ENTREGAS HOY            DOCS PENDIENTES    │
│      8                        3             │
│  ──────────────────────────────────────────  │
│  BALANCE A COBRAR HOY                        │
│  6.320 €  ← en grande, imposible perder     │
└─────────────────────────────────────────────┘
```

El "Balance a Cobrar" es el KPI más importante del día del operario. Debe estar a la vista siempre, sin necesidad de calcular nada mentalmente.

#### La Lista de Entregas — Ordenada por Urgencia

Cada tarjeta de entrega tiene:
```
┌─────────────────────────────────────────────┐
│  🔴 EN 25 MIN                              │  ← Badge urgencia
│                                             │
│  Ahmed Benjelloun          Audi A4          │
│  CMN T2 · Llegada 10:15    MAT: 1234AB5    │
│                                             │
│  Docs: ✅ APROBADOS                         │
│  Cobrar: 790 €                              │
│                                             │
│  [Escanear QR ▶] [Ver detalles →]          │
└─────────────────────────────────────────────┘
```

**Sistema de urgencia por color:**
- `bg-red-500` pulsante → aterriza en < 30 min
- `bg-amber-500` pulsante → aterriza en < 2 horas  
- `bg-slate-700` (sin parpadeo) → aterriza en > 2 horas

El parpadeo se hace con Framer Motion `animate={{ opacity: [1, 0.4, 1] }}` en loop. En el aeropuerto, el movimiento llama la atención del operario aunque no esté mirando la pantalla.

**Estado de documentos inline:**
- `✅ APROBADOS` — Verde, el operario puede proceder
- `⏳ EN REVISIÓN` — Amarillo con el botón "Revisar ahora →" (atajo directo)
- `❌ RECHAZADOS` — Rojo con "Cliente notificado"

---

### TAREA 4.3 — Validación de Documentos con Swipe ⭐ ÚNICO

**Fichero:** `src/app/(operator)/documents/page.tsx`  
**Fichero:** `src/components/operator/DocumentReviewCard.tsx` — `"use client"`

#### El Stack de Revisión (como Tinder, pero para documentos)

En lugar de una tabla con botones de aprobar/rechazar, el operario ve **una tarjeta por documento, con gesticulación de swipe**:

```
┌─────────────────────────────────────────────┐
│  3 pendientes de revisión                   │
│                                             │
│         ← [RECHAZAR]    [APROBAR] →         │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  │     [FOTO DEL DOCUMENTO]            │    │
│  │     Cargada con Presigned URL S3    │    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  PASAPORTE                                  │
│  Ahmed Benjelloun                           │
│  Reserva: #CMN-2026-001                     │
│  Subido hace: 8 min                         │
│                                             │
│  [✓ APROBAR — deslizar →]                  │
│  [✗ RECHAZAR con motivo — deslizar ←]       │
└─────────────────────────────────────────────┘
```

**Implementación del Swipe:**
```tsx
// Framer Motion drag con detección de velocidad y distancia
// Si el usuario desliza > 120px a la derecha → APROBAR
// Si desliza > 120px a la izquierda → modal de rechazo (con motivo)
// Si suelta antes → la tarjeta vuelve al centro (spring bounce)

const handleDragEnd = (info: PanInfo) => {
  if (info.offset.x > 120) approveDocument(doc.id);
  if (info.offset.x < -120) setShowRejectModal(true);
};
```

**Indicador visual durante el arrastre:**
- Al arrastrar a la derecha: el borde de la tarjeta se vuelve verde gradualmente
- Al arrastrar a la izquierda: el borde se vuelve rojo gradualmente
- Overlay de ícono ✓ o ✗ aparece con `opacity` proporcional al desplazamiento

**Al aprobar:** La tarjeta sale volando hacia la derecha con `x: 400` y la siguiente entra desde la izquierda.

**Al rechazar:** Modal bottom-sheet con opciones preestablecidas de motivo:
- "Imagen borrosa o mal enfocada"
- "Documento caducado"
- "Documento incompleto (falta página)"
- "Nombre no coincide con la reserva"
- Opción de texto libre

---

### TAREA 4.4 — Escáner QR con FAB

**Fichero:** `src/components/operator/QRScannerFAB.tsx` — `"use client"`  
**Fichero:** `src/components/operator/QRScannerModal.tsx` — `"use client"`

Un **Floating Action Button** (`position: fixed, bottom: 96px, right: 24px`) siempre visible en todas las pantallas del operario con un ícono de QR.

Al pulsarlo → Bottom Sheet con el escáner de cámara:

```bash
npm install @zxing/browser
```

`@zxing/browser` decodifica QR codes desde el stream de la cámara en tiempo real (sin servidor, puramente en el cliente). Es la librería más fiable para esto en la web.

**Flujo del escáner:**
1. El operario pulsa el FAB
2. Se abre un Bottom Sheet con el viewfinder de la cámara trasera
3. El usuario centra el QR del cliente en el marco
4. `@zxing/browser` detecta el hash automáticamente
5. Se hace una llamada al backend: `GET /api/v1/operator/reservations/verify?qr_hash=...`
6. Si válido → **La hoja se transforma en la tarjeta de entrega** del cliente (nombre, cobro pendiente, estado docs)
7. Si fallback (sin batería, sin QR) → El operario tiene la búsqueda manual visible debajo del viewfinder

**Búsqueda manual (fallback):**
```
[Matrícula del vehículo]  ─  o  ─  [Nombre del cliente]
[🔍 Buscar]
```

---

### TAREA 4.5 — Pantalla de Entrega (Confirmación Final)

**Fichero:** `src/app/(operator)/delivery/[reservationId]/page.tsx`

Después de escanear el QR o búsqueda manual, el operario ve:

```
┌─────────────────────────────────────────────┐
│  ✅ RESERVA VALIDADA                        │
│                                             │
│  Ahmed Benjelloun                           │
│  Pasaporte ✓ · Carnet ✓                   │
│                                             │
│  ─────────────────────────────────────────  │
│  COBRAR AHORA                               │
│                                             │
│       790 €                                 │
│  en efectivo o TPV                          │
│                                             │
│  ─────────────────────────────────────────  │
│  CHECKLIST DE ENTREGA                       │
│  ☑ Llaves entregadas                        │
│  ☑ SIM 5GB entregada                        │
│  ☑ Tag Jawaz activado                       │
│                                             │
│  [📹 Grabar vídeo estado del coche (30s)]  │
│                                             │
│  [✅ Confirmar entrega y cobro]             │
└─────────────────────────────────────────────┘
```

**El botón de vídeo:**
- Abre la cámara para grabar 30 segundos exactos (timer visuala)
- Al terminar → muestra "Guardado localmente. Subiendo en background..."
- Usa `Background Sync API` si está disponible, fallback a subida directa
- No bloquea la confirmación de entrega — el operario puede marcar como "Entregado" aunque el vídeo aún se esté subiendo

---

### TAREA 4.6 — Internacionalización (i18n) con `next-intl`

```bash
npm install next-intl
```

**Estructura de ficheros:**
```
src/
  messages/
    es.json    ← Español (idioma de desarrollo, completo)
    fr.json    ← Francés (MVP: strings principales)
    ar.json    ← Árabe (MVP: strings principales, RTL)
  i18n/
    request.ts
    routing.ts
```

**Routing con prefijo de idioma:**
```
/es/           → Home en español (default, sin prefijo en URL)
/fr/           → Home en francés  
/ar/           → Home en árabe con dir="rtl"
```

**Implementación RTL para árabe:**
- El `layout.tsx` raíz lee el locale actual y añade `dir="rtl"` al `<html>` tag
- Los componentes usan clases Tailwind con prefijo `rtl:` para inversiones de padding/margin/flex
- Ejemplo: `pl-4 rtl:pl-0 rtl:pr-4`
- Las animaciones de entrada (`x: -40` → `x: 0`) se invierten en RTL: `x: dir === 'rtl' ? 40 : -40`

**Strings clave a traducir en MVP (es/fr/ar):**
- Títulos y CTAs del Hero
- El Booking Panel (fechas, ubicación, precios)
- Mensajes de estado del Check-in (PENDING, APPROVED, REJECTED)
- El Smart Ticket
- Mensajes de error y éxito (Sonner toasts)

**El Header incluye el selector de idioma funcional** que persiste en `localStorage` y en la URL.

---

### TAREA 4.7 — Componente `<Price />` con Toggle MAD/EUR

**Extensión del componente definido en Sprint 1.**

**Toggle de divisa en el Header:**
- Un pill `€ EUR | DH MAD` que al hacer clic cambia la divisa activa
- El estado se guarda en `localStorage` y en un Zustand store separado: `useCurrencyStore`
- Ratio de conversión hardcodeado en MVP: `1 EUR = 10.8 MAD` (actualizable como constante en `src/lib/constants.ts`)

**El componente `<Price />`:**
```tsx
// Ejemplos de uso
<Price amount={800} />
// Renderiza: "800 €" o "8 640 DH" según la preferencia del usuario

// Con animación ticker al cambiar de divisa
// Los números se "cuentan" hacia el nuevo valor (como el CountUp del hero)
```

---

### TAREA 4.8 — Calidad Global (Deuda Técnica)

Estas tareas cierran todos los problemas identificados en el reporte inicial:

**8.1 — Eliminar las métricas falsas**
Reemplazar `{ to: 500, suffix: "+", label: "Clientes satisfechos" }` por:
- `{ to: 3, suffix: " min", label: "Tiempo medio de entrega" }` ← real y creíble
- `{ to: 10, prefix: "€", suffix: "", label: "Para reservar tu coche" }` ← mantener
- `{ to: 24, suffix: "h", label: "Soporte en CMN" }` ← mantener

**8.2 — Mover `IntroSplash` a componente separado**
`src/components/shared/IntroSplash.tsx` — eliminar las 150 líneas del `page.tsx` raíz.

**8.3 — Eliminar el nombre de operario hardcodeado**
`"Muéstrale este código a Karim"` en [src/app/smart-ticket/page.tsx](../src/app/smart-ticket/page.tsx) debe ser dinámico: el nombre verá desde los datos de la reserva.

**8.4 — Resolver el error Mermaid del `user_flow.md`**
La línea `bucket Operario:` → `Note right of Operario:`

**8.5 — Página 404 personalizada**
`src/app/not-found.tsx` con diseño consistente con la marca y un CTA de regreso al inicio.

**8.6 — `generateMetadata` en todas las páginas**
Cada `page.tsx` debe exportar `generateMetadata` (o `metadata`) con:
- `title`: específico de la página
- `description`: para SEO
- `openGraph`: para compartir en WhatsApp/redes sociales (cuando el operario comparte el enlace con un cliente)

**8.7 — Variables de entorno documentadas**
Crear `src/lib/constants.ts` con todas las constantes que irán a `.env` en el backend:
```typescript
export const OPERATOR_WHATSAPP = process.env.NEXT_PUBLIC_OPERATOR_WHATSAPP ?? '';
export const EUR_TO_MAD_RATE = 10.8;
export const DEPOSIT_AMOUNT_EUR = 10;
export const DOCUMENT_POLLING_INTERVAL_MS = 30_000;
```

---

## Checklist de Validación Sprint 4

**Operator Dashboard:**
- [ ] Las entregas se ordenan por urgencia (los más próximos primero)
- [ ] El badge de urgencia pulsa en rojo cuando < 30 min
- [ ] El swipe de aprobación/rechazo funciona con el dedo en móvil iOS y Android
- [ ] El escáner QR decodifica correctamente en condiciones de luz variable del aeropuerto
- [ ] La búsqueda manual por nombre/matrícula funciona
- [ ] El botón de vídeo no bloquea la confirmación de entrega
- [ ] El FAB del escáner es accesible desde todas las pantallas del operario

**i18n:**
- [ ] `/fr` carga en francés correctamente
- [ ] `/ar` carga en árabe con `dir="rtl"` en el HTML
- [ ] Las animaciones de entrada se invierten en RTL
- [ ] El selector de idioma en el Header persiste entre sesiones
- [ ] No hay strings hardcodeados en ningún componente (todo pasa por `useTranslations()`)

**Divisa:**
- [ ] El toggle EUR/MAD en el Header funciona en todas las páginas
- [ ] `<Price />` renderiza correctamente en ambas divisas
- [ ] El Smart Ticket muestra el balance pendiente en la divisa seleccionada por el usuario

**Calidad:**
- [ ] Las métricas del Hero son reales (no "500 clientes")
- [ ] Página 404 personalizada funciona en rutas inexistentes  
- [ ] `generateMetadata` está en todas las páginas
- [ ] 0 `console.error` en producción
- [ ] Lighthouse Score: Performance > 90, Accessibility > 95
- [ ] `npm run build` sin ningún warning de TypeScript

---

## Dependencias a instalar en este Sprint

```bash
npm install next-intl
npm install @zxing/browser
```

---

## Entregable Final del Sprint 4 = MVP Frontend Completo

Al finalizar este sprint, el frontend está **100% listo para conectar con el backend**:

### Mapa completo de páginas del producto

```
PÚBLICO (sin auth)
├── /           → Home + Booking Panel (Sprint 1)
├── /catalog    → Catálogo con filtros (Sprint 2)
├── /catalog/[id] → Detalle de vehículo (Sprint 2)
├── /book/[id]  → Flujo de reserva (Sprint 2)
├── /login      → Login (Sprint 1)
└── /register   → Registro (Sprint 1)

CLIENTE (auth: role USER)
├── /(customer)/dashboard           → Mis reservas
├── /(customer)/reservation/[id]    → Detalle reserva
├── /(customer)/profile             → Perfil
├── /check-in?reservationId=...     → Check-in docs (Sprint 3)
├── /waiting-room?reservationId=... → Estado verificación (Sprint 3)
└── /smart-ticket?reservationId=... → QR Boarding Pass (Sprint 3)

OPERARIO (auth: role OPERATOR)
├── /(operator)/dashboard           → Entregas del día (Sprint 4)
├── /(operator)/documents           → Cola de revisión con swipe (Sprint 4)
├── /(operator)/delivery/[id]       → Pantalla de entrega (Sprint 4)
└── /(operator)/profile             → Perfil del operario

GLOBAL
├── /[locale]/...                   → i18n: /es/, /fr/, /ar/ (Sprint 4)
└── /not-found                      → 404 personalizado (Sprint 4)
```

### Lo que queda para el Backend (Fase 2)

Cuando el equipo pase a la fase backend, el frontend ya tiene:
- Todos los **tipos TypeScript** de las entidades (copiarlos al backend)
- Todos los **contratos de API** esperados (definidos en el RFC)
- Todas las **llamadas a la API** comentadas con `// TODO: conectar con POST /api/v1/...`
- Todos los **estados de carga** implementados con Skeleton Loaders (sin spinner genéricos)
- El **Store de Zustand** listo para ser hidratado por respuestas reales del backend

El paso de mock a real será reemplazar las funciones en `src/lib/mock-data.ts` con `fetch()` calls reales. **El componente no cambia, solo la fuente de datos.**

---

## Visión Técnica de Conjunto

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEXUS. — MVP FRONTEND                        │
├────────────────────┬────────────────────────────────────────────┤
│  SPRINT 1          │  SPRINT 2                                   │
│  ─────────────     │  ────────────────                          │
│  Hero               │  Catálogo + filtros                        │
│  Booking Panel      │  Living Fleet Cards                        │
│  DualTimelineSlider │  Efecto 3D Parallax                       │
│  Zustand Store      │  Gyroscope móvil                          │
│  Auth Layout        │  Flujo /book/[id]                         │
│  Header + Footer    │  Datos mock + tipos                       │
├────────────────────┼────────────────────────────────────────────┤
│  SPRINT 3          │  SPRINT 4                                   │
│  ─────────────     │  ────────────────                          │
│  Check-in cámara   │  Operator Dashboard                        │
│  Swipe aprobación  │  Swipe docs operario                      │
│  Waiting Room      │  QR Scanner FAB                           │
│  Smart Ticket QR   │  i18n ES/FR/AR (RTL)                      │
│  Countdown real    │  Toggle EUR/MAD                           │
│  WhatsApp deep     │  Calidad + 404 + SEO                      │
│  link              │                                            │
└────────────────────┴────────────────────────────────────────────┘
```

Este es el sistema completo. Cada decisión está justificada por el contexto del usuario (aeropuerto, sol, cansancio, red inestable) y por el objetivo de negocio (confianza, premiumness, velocidad). No hay decisión de diseño arbitraria.

