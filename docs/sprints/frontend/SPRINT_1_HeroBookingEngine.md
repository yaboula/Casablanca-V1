# SPRINT 1 — "The Command Center"
## Hero + Booking Engine + Infraestructura Base

**Duración estimada:** 5–7 días  
**Objetivo:** El usuario aterriza en la home y puede iniciar una reserva completa sin salir de la página. El formulario no es un formulario: es un panel de control contextual.

---

## El Concepto Diferencial: "Ambient Booking Panel"

### ¿Por qué nadie lo hace así?

Hertz, Sixt, Europcar: formulario de 5 campos en una caja gris. Airbnb: modal tradicional con calendario. Nosotros: **el panel de reserva no interrumpe la experiencia**, vive integrado en el Hero como un elemento flotante con física propia.

### La Mecánica

- En **móvil**: El panel vive como un **Bottom Drawer** (cajón inferior) que el usuario puede arrastrar hacia arriba con el pulgar (swipe gesture). Siempre visible sin hacer scroll.
- En **desktop**: El panel aparece como una **"Mission Card"** flotante a la derecha del headline, con glassmorphism sutil sobre el fondo de puntos.
- Los **precios se actualizan en tiempo real** con un efecto de ticker (como las pantallas de vuelos en el aeropuerto) al seleccionar fechas.
- La **selección de fechas NO es un calendario tradicional**. Es una **Dual Timeline Slider** — dos marcadores deslizables sobre una línea de tiempo horizontal con los próximos 30 días. Rápido, táctil, único.

---

## Tareas del Sprint 1

### TAREA 1.1 — Infraestructura de Estado Global (Zustand)

**Fichero:** `src/stores/useBookingStore.ts`

Instalar Zustand:
```bash
npm install zustand
```

**Contenido del store:**
```typescript
// Estado global que persiste la selección del usuario entre páginas
interface BookingStore {
  // Fechas seleccionadas (epoch timestamps para fácil cálculo)
  pickupDate: number | null;
  returnDate: number | null;
  // Vehículo seleccionado desde el catálogo
  selectedVehicleId: string | null;
  // Localización de recogida (MVP: solo CMN)
  pickupLocation: 'CMN_T1' | 'CMN_T2';
  // Precio calculado (número limpio, sin currency)
  totalPriceEUR: number | null;
  totalDays: number | null;
  // Acciones
  setDates: (pickup: number, returnDate: number) => void;
  setVehicle: (id: string, pricePerDay: number) => void;
  setLocation: (loc: 'CMN_T1' | 'CMN_T2') => void;
  reset: () => void;
}
```

**Lógica clave:** Cuando `pickupDate` y `returnDate` cambian, recalcular automáticamente `totalDays` y `totalPriceEUR`.

---

### TAREA 1.2 — Sistema de Tipos Compartidos

**Fichero:** `src/types/index.ts`

```typescript
// Entidades del dominio (mirror del RFC, para el frontend)
export type ReservationStatus =
  | 'PENDING_DEPOSIT'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type DocumentStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type VehicleCategory = 'SEDAN' | 'SUV' | 'LUXURY' | 'COMPACT';

export interface Vehicle {
  id: string;
  model: string;
  brand: string;
  category: VehicleCategory;
  pricePerDay: number; // Siempre en EUR, número limpio
  currency: 'EUR';     // Campo de divisa explícito
  imageUrl: string;
  transmission: 'AUTOMATIC' | 'MANUAL';
  seats: number;
  luggageCount: number;
  features: string[];  // ['SIM 5GB', 'Tag Jawaz', 'Seguro Todo Riesgo']
  isAvailable: boolean;
}

export interface Reservation {
  id: string;
  vehicleId: string;
  pickupDate: string;   // ISO 8601
  returnDate: string;   // ISO 8601
  totalDays: number;
  totalPriceEUR: number;
  depositPaidEUR: number; // Siempre 10€
  balanceDueEUR: number;  // totalPriceEUR - 10
  status: ReservationStatus;
  qrCodeHash: string | null;
}
```

---

### TAREA 1.3 — Componente `<Price />`

**Fichero:** `src/components/shared/Price.tsx`

Componente centralizado para todo el proyecto. Resuelve el error #9 del reporte anterior.

**Comportamiento:**
- Recibe `amount: number` y `currency: 'EUR' | 'MAD'`
- Formatea con `Intl.NumberFormat` correctamente
- Animación de cambio de valor con Framer Motion (como un ticker)
- Prop `size`: `'sm' | 'md' | 'lg' | 'hero'` para los distintos contextos

```tsx
// Uso en el booking panel:
<Price amount={800} currency="EUR" size="hero" animated />

// Salida: "800 €" con transición de número al cambiar
```

---

### TAREA 1.4 — Componente `<DualTimelineSlider />` ⭐ ÚNICO

**Fichero:** `src/components/shared/DualTimelineSlider.tsx`

**Este es el componente estrella del Sprint 1. No existe en ninguna librería.**

**Visual:**
```
[HOY] ──●────────────────●── [+30 días]
         ↑ RECOGIDA      ↑ DEVOLUCIÓN
      Jue 19 Feb      Mar 24 Feb  (5 días)
```

**Especificaciones técnicas:**
- Un `<div>` con una línea base horizontal
- Dos "thumbs" arrastrables (Framer Motion `drag="x"` con constraints)
- El "thumb" de recogida no puede cruzar al de devolución y viceversa
- Entre ambos thumbs: un resaltado de color `bg-blue-600/20`
- Al soltar los thumbs, snapping al día más cercano (segmentos de 1 día)
- Debajo de cada thumb: tooltip sticky con la fecha formateada en el idioma del sistema
- En **móvil** (`< md`): Los thumbs tienen `w-14 h-14` para ser pulsados con el pulgar
- Emite `onDatesChange({ pickup: Date, return: Date, days: number })`
- Performance: usar `transform: translateX()` via Framer Motion MotionValues (GPU-only, no layout recalc)

**Por qué es diferencial:**  
El usuario en el aeropuerto NO quiere abrir un calendario de 5 semanas. Quiere arrastrar dos puntos en una línea. Es la forma más natural y rápida de seleccionar un rango en un contexto de viaje.

---

### TAREA 1.5 — Componente `<BookingPanel />` (Mobile Bottom Drawer + Desktop Float)

**Fichero:** `src/components/shared/BookingPanel.tsx` — `"use client"`

**Comportamiento en móvil (< md):**
- Estado `collapsed`: Solo visible la barra superior con `"Ver disponibilidad → 10€"` y precio con ticker
- Estado `expanded`: El panel sube con `drag="y"` y `dragConstraints` hasta ocupar 80% de la pantalla
- Handle visual (pastilla gris) para el swipe
- Framer Motion `AnimatePresence` con `y: "100%"` → `y: "0%"`

**Comportamiento en desktop (≥ md):**
- Panel fijo flotante `sticky top-6` a la derecha del Hero
- Glassmorphism: `bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl`
- No hace scroll con la página durante la primera sección

**Contenido del panel (3 pasos inline, sin navegación):**

```
PASO 1 — SELECCIÓN
├── Header: "¿Cuándo llegas a CMN?"
├── Selector de ubicación: Toggle pill CMN T1 / CMN T2
├── <DualTimelineSlider />
├── Resumen: "5 días · desde 800€ total"
└── CTA: "Ver coches disponibles →"

PASO 2 — VEHÍCULO (mini-catálogo inline)
├── Header: "Elige tu coche"  
├── Grid 1-col de Vehicle mini-cards con animación stagger
├── Cada card: foto, modelo, precio/día, disponibilidad
└── Al seleccionar → el panel transiciona al PASO 3

PASO 3 — CONFIRMACIÓN + PAGO  
├── Resumen visual: vehículo + fechas + precio total
├── Desglose: "10€ ahora · 790€ al recoger"
├── Input email (único dato requerido en este punto)
└── CTA final: "Bloquear mi coche — 10€"
```

**Transición entre pasos:** `layoutId` de Framer Motion + `AnimatePresence mode="wait"`. El panel no "salta" — el contenido hace crossfade suave.

---

### TAREA 1.6 — Refactorización del Hero en `page.tsx`

**El Hero actual tiene `"use client"` global. Lo dividimos en:**

| Componente | Directiva | Razón |
|---|---|---|
| `HeroSection` (server) | Server Component | SSR, SEO, no tiene interactividad |
| `HeroAnimations` | `"use client"` | Solo el spotlight de ratón y las animaciones de entrada |
| `BookingPanel` | `"use client"` | Estado del formulario |
| `IntroSplash` | `"use client"` | Timer y animaciones |

**La raíz `page.tsx` pasa a ser un Server Component puro** que importa los Client Components necesarios.

---

### TAREA 1.7 — Middleware de Autenticación (base)

**Fichero:** `src/middleware.ts`

```typescript
// Proteger rutas del operador desde el principio
// Aunque el backend no exista, las rutas deben estar bloqueadas
export const config = {
  matcher: ['/(operator)/:path*', '/(customer)/:path*'],
};
```

Redirige a `/login` si no hay sesión. Por ahora, la sesión es un cookie mockeada.

---

### TAREA 1.8 — Páginas de Auth (estructura)

**Ficheros:**
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/layout.tsx`

**Diseño del Login:**
- Pantalla dividida: izquierda imagen CMN aeropuerto / derecha formulario
- En móvil: solo el formulario con el logo encima
- Input `email` y `password` de Shadcn
- Link a registro
- **NO hay "Login con Google/Facebook"** en MVP (añade complejidad de Auth0 innecesaria)

---

### TAREA 1.9 — Header Completo

**Fichero:** `src/components/layout/Header.tsx`

**Estados del Header:**
1. **No autenticado**: Logo | "Ver flota" | "Iniciar sesión" (pill border)
2. **Autenticado (cliente)**: Logo | "Mis reservas" | Avatar con dropdown
3. **Autenticado (operador)**: Logo | Badge "Staff" | "Dashboard" | Avatar

**Comportamiento scroll:**
- Al scroll > 60px: `bg-white/95 backdrop-blur shadow-sm` con transición
- Al inicio: `bg-transparent` sobre el Hero

---

### TAREA 1.10 — Footer

**Fichero:** `src/components/layout/Footer.tsx`

**Contenido mínimo MVP:**
- Logo + tagline
- Links: "Flota" · "Cómo funciona" · "Contacto (WhatsApp)"
- "© 2026 NEXUS. CMN · Aeropuerto Mohammed V"
- Selector de idioma (placeholder para Sprint 4): `ES | FR | AR`
- Selector de divisa (placeholder): `€ EUR | MAD DH`

---

## Checklist de Validación Sprint 1

Antes de marcar el Sprint como completo, verificar:

- [ ] `npm run build` sin errores TypeScript
- [ ] El `DualTimelineSlider` funciona en móvil real (touch events)
- [ ] El `BookingPanel` se puede abrir/cerrar con swipe en móvil
- [ ] El precio en el panel se actualiza al cambiar fechas (en tiempo real)
- [ ] El Store de Zustand mantiene el estado al navegar entre `/` y `/catalog`
- [ ] Las rutas `/(operator)/` devuelven 302 a `/login` sin sesión
- [ ] No hay `console.error` en la consola del navegador
- [ ] Lighthouse Mobile Score > 85 (Performance)
- [ ] El Hero carga sin `"use client"` en el Server Component raíz

---

## Dependencias a instalar en este Sprint

```bash
npm install zustand
npm install date-fns
```

- `zustand` — Estado global del booking
- `date-fns` — Formateo de fechas sin inflar el bundle (tree-shakeable)

---

## Entregable Final del Sprint 1

El usuario puede:
1. Abrir la home y ver el Hero
2. Interactuar con el Booking Panel (arrastrar el timeline slider)
3. Ver el precio actualizarse en tiempo real
4. (Mock) Completar los 3 pasos del panel y llegar a la pantalla de confirmación

