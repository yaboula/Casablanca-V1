# SPRINT 2 — "Fleet Intelligence"
## Catálogo de Vehículos + Página de Detalle + Flujo de Reserva

**Duración estimada:** 5–7 días  
**Prerequisito:** Sprint 1 completado (Store de Zustand operativo, tipos definidos)  
**Objetivo:** El usuario puede explorar la flota, filtrar, ver el detalle de un vehículo y lanzar el flujo de reserva completo.

---

## El Concepto Diferencial: "Living Fleet Cards"

### ¿Por qué nadie lo hace así?

Las webs de alquiler de coches tienen grids de fotos estáticas con precios. Sin vida, sin contexto, sin personalidad. Las "Living Fleet Cards" son tarjetas que:

1. **Reaccionan físicamente** al cursor (desktop) y al giroscopio del dispositivo (móvil) con efecto parallax 3D. La foto del coche parece flotar dentro de la tarjeta.
2. **Muestran disponibilidad como contexto**, no como texto. Una barra de "ocupación de la semana" visual aparece en el hover like a mini heatmap.
3. **Tienen un estado de "selección" memorable**: cuando el usuario elige un coche desde el Booking Panel del Sprint 1, la tarjeta correspondiente en el catálogo hace un "pulse" de confirmación con `layoutId` compartido.

---

## Tareas del Sprint 2

### TAREA 2.1 — Ruta y Estructura del Catálogo

**Fichero:** `src/app/catalog/page.tsx` — **Server Component**

Esta es la única página del proyecto en la que el SEO importa de verdad (el usuario puede buscar "alquilar coche CMN aeropuerto"). Por tanto, es Server Component.

**Estructura de la URL:**
```
/catalog                          → todos los coches
/catalog?category=SUV             → filtrado por categoría
/catalog?pickup=2026-03-01&return=2026-03-06  → con fechas pre-rellenadas desde el Booking Panel
```

**Los `searchParams` de la URL se leen en el Server Component** y se pasan como `initialFilters` a los Client Components de filtrado. Así, los filtros son linkables y compartibles.

**Layout de la página:**
```
[HEADER]
[FILTROS — barra horizontal sticky]
[RESULTADOS — grid responsivo]
[FOOTER]
```

En desktop: La barra de filtros es sticky bajo el Header.  
En móvil: Los filtros son un Bottom Sheet que se activa con el botón "Filtrar".

---

### TAREA 2.2 — Componente `<FilterBar />` ⭐ ÚNICO

**Fichero:** `src/components/vehicles/FilterBar.tsx` — `"use client"`

**Diseño:** Una barra horizontal de pastillas (pills) scrollable horizontalmente en móvil. No hay sidebar.

**Filtros del MVP:**
```
[Todos] [SUV] [Sedán] [Lujo] [Compacto]   ← Categoría (una selección)
[· Precio ↓]  [· Precio ↑]               ← Ordenación
[€ ─────── €€€] slider básico (opcional)  ← Rango de precio
```

**Comportamiento especial:**
- El filtro activo tiene un `bg-blue-600 text-white` con una transición de `layoutId="active-filter"` que hace que el "foco" se mueva fluidamente de pastilla en pastilla (como el componente de pestañas animadas de Linear).
- Al activar un filtro, la URL se actualiza con `router.push` (shallow) para que sea compartible.
- El número de resultados se actualiza debajo de la barra: `"3 coches disponibles para tus fechas"`

---

### TAREA 2.3 — Componente `<VehicleCard />` ⭐ ÚNICO (Living Card)

**Fichero:** `src/components/vehicles/VehicleCard.tsx` — `"use client"`

**Reemplaza completamente al `TrustCard.tsx` actual.** Este componente es la pieza de UI más memorable del producto.

#### Efecto 3D Parallax (Desktop)

```tsx
// Usando useMotionValue + useTransform de Framer Motion
// Se calcula la posición del ratón relativa al centro de la tarjeta
// y se transforma en rotateX / rotateY (máximo ±8 grados)
// La imagen del coche tiene un transform adicional de translateZ(20px)
// creando una ilusión de profundidad real

const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);
const imageTranslateX = useTransform(mouseX, [-0.5, 0.5], [-6, 6]);
const imageTranslateY = useTransform(mouseY, [-0.5, 0.5], [-6, 6]);
```

#### Efecto Giroscopio (Móvil)

```tsx
// DeviceOrientationEvent API
// Se activa solo en móviles (window.DeviceOrientationEvent exists)
// Con fallback graceful si el usuario no concede permiso (iOS 13+)
// La tarjeta rota suavemente según la inclinación del dispositivo
// Máximo ±5 grados para no marear

useEffect(() => {
  if (typeof window === 'undefined') return;
  const handler = (e: DeviceOrientationEvent) => {
    // beta = inclinación frente-atrás, gamma = izq-der
    rotateX.set(clamp((e.beta ?? 0) * 0.15, -5, 5));
    rotateY.set(clamp((e.gamma ?? 0) * 0.15, -5, 5));
  };
  window.addEventListener('deviceorientation', handler);
  return () => window.removeEventListener('deviceorientation', handler);
}, []);
```

#### Estructura Visual de la Tarjeta

```
┌─────────────────────────────────────────┐
│ [IMAGEN CON PARALLAX]                   │
│  ↑ La foto "flota" ligeramente sobre    │
│    el fondo de la tarjeta               │
│                                         │
│  Badge: "DISPONIBLE ●" / "ÚLTIMAS 2 ●" │
├─────────────────────────────────────────┤
│ Audi A4                                 │
│ Sedán · Automático · 5 plazas           │
│                                         │
│ ✓ SIM 5GB  ✓ Tag Jawaz  ✓ Todo Riesgo  │
│                                         │
│ ▓▓▓▓░░░  "Alta demanda esta semana"    │
│ [HEAT BAR de ocupación]                 │
│                                         │
│ 800 € total  ─────  [Reservar →]        │
└─────────────────────────────────────────┘
```

#### El "Heat Bar" de Ocupación

Una barra de 7 segmentos (los próximos 7 días) donde cada segmento tiene un color que indica la presión de disponibilidad:
- `bg-emerald-400` → libre (< 30% ocupación simulada)
- `bg-amber-400` → media demanda
- `bg-red-400` → últimas unidades

En MVP v1, estos valores son pseudo-aleatorios pero seeded por el `vehicleId` (para que siempre sean los mismos y no cambien en cada render).

#### Interacción de Selección

Cuando el usuario hace clic en "Reservar":
1. La tarjeta hace un `scale: [1, 1.03, 1]` pulse
2. El precio en el Booking Panel del Sprint 1 se actualiza vía Zustand
3. Si el usuario está en móvil, el BottomDrawer del Booking Panel sube automáticamente a `expanded`

---

### TAREA 2.4 — Página de Detalle del Vehículo

**Fichero:** `src/app/catalog/[vehicleId]/page.tsx` — **Server Component** con secciones Client

**Layout:**

```
[← Volver al catálogo]

┌──────────────────────────────────────────────┐
│                                              │
│   [GALERÍA / FOTO HERO del coche - grande]  │
│                                              │
└──────────────────────────────────────────────┘

[Audi A4]  [Sedán · Premium]

┌──────────────────┐  ┌─────────────────────────┐
│ SPECS            │  │ BOOKING SUMMARY CARD    │
│ ─────────────    │  │ (versión mini del panel)│
│ 5 plazas         │  │                         │
│ Automático       │  │ Fechas seleccionadas    │
│ 2 maletas        │  │ 5 días                  │
│                  │  │ 800 € total             │
│ INCLUYE          │  │                         │
│ ─────────────    │  │ [Reservar — 10€] →      │
│ ✓ SIM 5GB        │  └─────────────────────────┘
│ ✓ Tag Jawaz      │
│ ✓ Seguro TR      │
│ ✓ Sin kilometraje│
└──────────────────┘
```

En **móvil**, el "Booking Summary Card" es un Bottom Bar fija en la parte inferior (como Airbnb), no un panel lateral.

---

### TAREA 2.5 — Flujo de Reserva `/book/[vehicleId]`

**Ruta:** `src/app/book/[vehicleId]/page.tsx` — `"use client"`

Esta página es el paso de pago. El usuario llega aquí cuando hace clic en "Reservar — 10€" desde el panel o desde el detalle.

**3 micro-pasos en la misma página (sin navegación):**

#### PASO A — Resumen y Confirmación
```
[Foto del coche pequeña]  Audi A4 · 5 días
Recogida: CMN T1 · Jue 19 Feb 10:00
Devolución: Mar 24 Feb 10:00

DESGLOSE DE PRECIO
─────────────────────────────────
Alquiler (5 días × 160€)     800 €
Depósito de seguridad        +10 €  ← ya incluido
Peajes Jawaz                  incl.
Seguro Todo Riesgo            incl.
─────────────────────────────────
TOTAL                        800 €
Pagas ahora                   10 €  ← en verde
Pagas al recoger el coche    790 €

[Continuar →]
```

#### PASO B — Datos de Contacto
```
Tu email (para el QR y confirmación)
[___________________________]

Tu teléfono WhatsApp (para coordinación)
[+212 ___________________]

[Continuar →]
```

#### PASO C — Pago (Mock en Sprint 2, Stripe real en backend)
```
[Componente Stripe Card Element — o skeleton hasta Sprint backend]
Pago seguro · 10 € · Bloqueo 48h

[🔒 Pagar 10€ y confirmar reserva]
```

Al completar → redirect a `/check-in` con el `reservationId` en la URL.

---

### TAREA 2.6 — Datos Mock para Desarrollo (sin Backend)

**Fichero:** `src/lib/mock-data.ts`

Un array de `Vehicle[]` con 6 coches con todos los campos del tipo definido en Sprint 1. Este fichero se elimina cuando el backend esté listo.

```typescript
export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    model: 'A4',
    brand: 'Audi',
    category: 'SEDAN',
    pricePerDay: 160,
    currency: 'EUR',
    imageUrl: '/images/vehicles/audi-a4.jpg', // Asset local, no Unsplash
    transmission: 'AUTOMATIC',
    seats: 5,
    luggageCount: 2,
    features: ['SIM 5GB', 'Tag Jawaz', 'Seguro Todo Riesgo'],
    isAvailable: true,
  },
  // ... 5 más
];
```

**IMPORTANTE:** Las imágenes van en `public/images/vehicles/` como assets locales. Se usan con `next/image` con `width` y `height` definidos. Adios Unsplash.

---

### TAREA 2.7 — Hook `useVehicleFilters`

**Fichero:** `src/hooks/useVehicleFilters.ts`

Encapsula la lógica de filtrado para no contaminar el componente de UI.

```typescript
// Recibe la lista de vehículos y los filtros activos
// Devuelve la lista filtrada + ordenada
// Completamente tipado y testeble
export function useVehicleFilters(
  vehicles: Vehicle[],
  filters: ActiveFilters
): Vehicle[] { ... }
```

---

### TAREA 2.8 — Animación de Entrada del Grid (Stagger Premium)

Cuando el catálogo carga o los filtros cambian:
- Las tarjetas hacen exit con `opacity: 0, scale: 0.95`
- Las nuevas tarjetas entran con stagger de `0.05s` entre cada una
- `AnimatePresence mode="popLayout"` para que las que salen y entran se animen correctamente sin "saltar"

Este nivel de detalle en las transiciones de filtro es algo que Airbnb hace, pero no las webs de alquiler de coches.

---

## Checklist de Validación Sprint 2

- [ ] El efecto 3D parallax funciona en Chrome/Safari desktop
- [ ] El giroscopio funciona en iOS Safari (con permiso) y Android Chrome
- [ ] Los filtros actualizan la URL (shareable links)
- [ ] Las imágenes usan `next/image` en todos los sitios
- [ ] El tipo `Vehicle` es respetado en todos los componentes (0 errores TS)
- [ ] El `useBookingStore` se actualiza al seleccionar un vehículo desde el catálogo
- [ ] La página `/catalog` tiene `generateMetadata` con título y descripción SEO
- [ ] El Bottom Bar de reserva en móvil (detalle) no tapa contenido importante
- [ ] `npm run build` sin errores

---

## Dependencias a instalar en este Sprint

Ninguna nueva. Todo se hace con las dependencias existentes + `date-fns` del Sprint 1.

---

## Entregable Final del Sprint 2

El usuario puede:
1. Navegar de la home al catálogo completo
2. Filtrar vehículos por categoría sin recargar la página
3. Ver el efecto 3D en las tarjetas
4. Entrar al detalle de un coche
5. Iniciar el flujo de reserva y llegar a la pantalla de pago (mock)
6. El Zustand store mantiene coherencia entre catálogo, detalle y panel del hero

