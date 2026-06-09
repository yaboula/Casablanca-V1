# Auditoría de la Documentación Frontend — Casablanca-V1

> **Fecha**: 9 de junio, 2026  
> **Alcance**: Exclusivamente `docs/frontend/` (13 documentos + 5 ADRs)  
> **Método**: Análisis de lo que la documentación **especifica**, lo que **omite**, y lo que **debería mejorar** — juzgado contra 4 capas de referencia  
> **No incluye**: Código fuente, implementación actual, ni análisis técnico del SPA  

---

## Documentos evaluados

| # | Documento | Bytes | Rol |
|---|---|---|---|
| 00 | [FRONTEND-OVERVIEW.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/00-FRONTEND-OVERVIEW.md) | 4,329 | Contexto y decisiones finales |
| 01 | [PRODUCT-UX-SPEC.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/01-PRODUCT-UX-SPEC.md) | 5,660 | Personas, journey, psicología |
| 02 | [INFORMATION-ARCHITECTURE.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/02-INFORMATION-ARCHITECTURE.md) | 3,282 | Rutas, navegación, roles |
| 03 | [ROUTE-MAP.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/03-ROUTE-MAP.md) | 4,761 | Tabla detallada de rutas |
| 04 | [FRONTEND-TECHNICAL-ARCHITECTURE.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/04-FRONTEND-TECHNICAL-ARCHITECTURE.md) | 4,312 | Framework, folders, fetch model |
| 05 | [API-CONTRACT-INTEGRATION.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/05-API-CONTRACT-INTEGRATION.md) | 4,533 | Endpoints, adapters, errores |
| 06 | [AUTH-SESSION-SECURITY.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/06-AUTH-SESSION-SECURITY.md) | 3,471 | Cookies, tokens, guards |
| 07 | [STATE-MANAGEMENT-DATA-FLOW.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/07-STATE-MANAGEMENT-DATA-FLOW.md) | 3,411 | Ownership rules, flows |
| 08 | [DESIGN-SYSTEM-THEME.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/08-DESIGN-SYSTEM-THEME.md) | 4,336 | Visual language, tokens, patterns |
| 09 | [COMPONENT-ARCHITECTURE.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/09-COMPONENT-ARCHITECTURE.md) | 3,245 | Capas, per-feature plan, anti-patterns |
| 10 | [IMPLEMENTATION-ROADMAP.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/10-IMPLEMENTATION-ROADMAP.md) | 6,150 | 8 fases con validation y DoD |
| 11 | [TESTING-QA-STRATEGY.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/11-TESTING-QA-STRATEGY.md) | 3,453 | Unit, e2e, visual, a11y checks |
| 12 | [AGENT-HANDOFF-GUIDE.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/12-AGENT-HANDOFF-GUIDE.md) | 3,633 | Onboarding para agentes |
| ADR-001 | [next-app-router.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/adr/ADR-001-next-app-router.md) | 1,532 | Decision: Next.js App Router |
| ADR-002 | [backend-as-source-of-truth.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/adr/ADR-002-backend-as-source-of-truth.md) | 1,311 | Decision: backend owns state |
| ADR-003 | [no-spa-mock-store.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/adr/ADR-003-no-spa-mock-store.md) | 1,240 | Decision: kill mock store |
| ADR-004 | [auth-cookie-session-proxy.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/adr/ADR-004-auth-cookie-session-proxy.md) | 1,336 | Decision: HttpOnly proxy |
| ADR-005 | [reservation-uuid-routing.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/adr/ADR-005-reservation-uuid-routing.md) | 1,266 | Decision: UUID routes |

**Total**: ~56,300 bytes de especificación

---

## Capa 1 — Visual y de Componentes (Shadcn/ui + Tailwind CSS)

**Fuentes**: Shadcn/ui design system, Tailwind CSS best practices

### 1.1 Lo que la documentación hace bien

| Aspecto | Documento | Valoración |
|---|---|---|
| **Brand feeling** definido: premium, precise, calm, airport-native, trustworthy | [08:9-16](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/08-DESIGN-SYSTEM-THEME.md#L9-L16) | ✅ Excelente — da dirección clara sin ser genérico |
| **Visual principles**: restraint over decoration, expensive through spacing/typography | [08:20-24](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/08-DESIGN-SYSTEM-THEME.md#L20-L24) | ✅ Alineado con Shadcn/ui philosophy |
| **Component layers** definidos: UI primitives → Layout → Marketing → Presentational → Feature → Smart | [09:5-12](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/09-COMPONENT-ARCHITECTURE.md#L5-L12) | ✅ Buena separación de responsabilidades |
| **Anti-patterns** documentados explícitamente (raw DTOs, localStorage, fake refs, fake QR) | [09:84-93](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/09-COMPONENT-ARCHITECTURE.md#L84-L93) | ✅ Protección contra errores comunes |
| **Adapter-based model**: backend → service → adapter → view model → component | [09:39-47](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/09-COMPONENT-ARCHITECTURE.md#L39-L47) | ✅ Correcto pattern para Shadcn/ui components |
| **Marketing vs Operational surfaces** diferenciados | [08:149-163](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/08-DESIGN-SYSTEM-THEME.md#L149-L163) | ✅ Crucial — evita "marketing UI" en operator panels |
| **4 layout shells** definidos (Public, Customer, Operator, Admin) | [08:140-147](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/08-DESIGN-SYSTEM-THEME.md#L140-L147) | ✅ Alineado con Next.js route groups |
| **Visual patterns to avoid** documentados (blobs, orbs, glossy dashboards, fake QR, hidden labels) | [08:186-194](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/08-DESIGN-SYSTEM-THEME.md#L186-L194) | ✅ Buena barrera anti-slop |

### 1.2 Gaps y deficiencias

#### G-01 — Sin especificación de Design Tokens concretos

> [!CAUTION]
> **Severidad: Alta**

Doc 08 describe *dirección* de colores ("restrained electric blue accent", "neutral text scale") pero **no define tokens concretos**. No hay:

- Valores HSL/OKLCH para primary, secondary, muted, destructive
- Escala tipográfica con sizes/weights específicos
- Escala de spacing (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)
- Escala de border-radius concreta
- Escala de shadows

**Impacto**: Cada agente o desarrollador que implemente interpretará "restrained electric blue" de forma diferente. Shadcn/ui requiere una definición precisa de CSS variables en `:root` para funcionar consistentemente.

**Referencia Shadcn/ui**: El sistema espera tokens definidos en `index.css` como `--primary: 222.2 84% 4.9%`. Doc 08 no proporciona estos valores.

**Recomendación**: Añadir a Doc 08 una sección "Token Specification" con los valores exactos HSL para todas las variables que Shadcn/ui consume.

---

#### G-02 — Sin especificación de fuentes tipográficas

> **Severidad: Media**

Doc 08 dice:
- *"Use a strong display style for marketing headlines"*
- *"Use readable sans text for forms, dashboards, and operator/admin"*
- *"Do not use viewport-scaled font sizes"*

Pero **no nombra ninguna fuente**. No dice si usar Inter, Geist, Satoshi, Outfit, ni define font stacks. No hay font-size ramp documentado (h1–h6, body, caption, label).

**Impacto**: La tipografía es el 60-70% de la identidad visual. Sin fuentes nombradas, no hay consistencia entre implementadores.

**Recomendación**: Especificar: display font, body font, mono font (si aplica). Definir el ramp tipográfico con clamp() values concretos.

---

#### G-03 — Sin paleta de colores semánticos completa

> **Severidad: Media**

Doc 08 define solo dirección de colores semánticos:

```
green: approved/ready
amber: pending/review
red: rejected/error
blue: active/primary
```

Pero falta:
- **Info** — no tiene color definido
- **Warning vs destructive** — amber es "pending" y red es "error", pero no hay distinción entre warning (reversible) y destructive (irreversible)
- **Success** — green es "approved/ready" pero no hay definición para "operation successful" (toast, form submit)
- **Neutral scales** — no se especifica cuántos grays (100–900) ni si usar neutral, zinc, slate, o stone

**Referencia Shadcn/ui**: El sistema necesita `--destructive`, `--muted`, `--accent`, `--ring`, `--chart-1` a `--chart-5`. Doc 08 no cubre charts ni ring.

---

#### G-04 — Sin especificación de responsive breakpoints

> **Severidad: Media**

Doc 08 menciona "Desktop scaling must work across 1366, 1440, 1536, 1920 and 2560 widths" y "Mobile/tablet must remain clean and touch-friendly". Pero no define:

- Breakpoints concretos (sm, md, lg, xl, 2xl)
- Container max-widths
- Comportamiento de grid collapse por breakpoint
- Mobile-first vs desktop-first approach

**Referencia Tailwind CSS**: El framework tiene breakpoints default (640, 768, 1024, 1280, 1536). Doc 08 no confirma si se usan los defaults o se personalizan.

**Recomendación**: Definir breakpoints, container widths, y reglas de collapse para las 5 anchuras target.

---

#### G-05 — Sin especificación de iconos

> **Severidad: Baja**

Ningún documento especifica qué biblioteca de iconos usar. Las opciones para Shadcn/ui son:
- `lucide-react` (default de Shadcn/ui)
- `@radix-ui/react-icons`
- `@phosphor-icons/react`

Sin definir esto, los implementadores podrían mezclar librerías.

**Recomendación**: Definir icon library, strokeWidth standard (1.5 o 2.0), y icon sizing scale.

---

#### G-06 — Component inventory sin prioridad de implementación

> **Severidad: Baja**

Doc 09 lista componentes por feature (auth, catalog, booking, etc.) pero no asigna prioridad individual. Doc 10 (roadmap) define fases, pero dentro de cada fase no prioriza qué componentes son MVP vs nice-to-have.

**Ejemplo**: En la feature "operator", ¿son los "stats cards" P2 o P3? En "admin", ¿es "vehicle form" necesario para MVP?

---

#### G-07 — Sin guía de motion específica

> **Severidad: Baja**

Doc 08 dice motion should "clarify transitions, stay subtle and short" y lista what to avoid. Pero no define:

- Easing curves concretas (ease-out-quart, cubic-bezier values)
- Duration ranges (150ms–400ms para interactions, 400ms–800ms para page transitions)
- Qué componentes deben animarse (reveal on scroll, page transitions, tab changes)
- Reduced motion strategy (`prefers-reduced-motion` handling)

**Referencia Tailwind CSS**: `tailwindcss-animate` está en las dependencias. Debería documentarse cómo se integra.

---

### 1.3 Resumen Capa 1

| Aspecto | Score | Detalle |
|---|---|---|
| Dirección visual y brand | 9/10 | Excelente: claro, diferenciado, no genérico |
| Component architecture | 8/10 | Buena estructura de capas, adapter model |
| Token specification | 3/10 | Dirección sin valores concretos |
| Typography specification | 2/10 | Solo dirección, sin fuentes ni ramp |
| Responsive specification | 4/10 | Target widths sin breakpoints concretos |
| Motion specification | 4/10 | Solo guidelines, sin curvas ni duraciones |
| **Score global** | **5.7/10** | Buena dirección, pobre especificación implementable |

---

## Capa 2 — Estructura y Reglas Legales (WCAG 2.1 / 2.2 AA)

**Fuente**: WCAG 2.1 / 2.2 (Nivel AA)

### 2.1 Lo que la documentación cubre

Doc 08 tiene una sección "Accessibility Basics" ([08:174-183](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/08-DESIGN-SYSTEM-THEME.md#L174-L183)):

```
- keyboard reachable controls
- visible focus states
- semantic headings
- alt text for real vehicle imagery
- sufficient contrast
- form labels tied to inputs
- aria-live for status updates where appropriate
- do not rely on color alone for status
```

Doc 11 tiene una sección "Accessibility Checks" ([11:119-127](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/11-TESTING-QA-STRATEGY.md#L119-L127)):

```
- keyboard navigation
- visible focus states
- labels on inputs
- alt text for vehicle images
- aria-live for waiting/SSE updates where appropriate
- no color-only status communication
- contrast on badges and buttons
```

### 2.2 Análisis WCAG criterio por criterio

#### Criterios CUBIERTOS en la documentación

| Criterio WCAG | Docs reference | Cobertura |
|---|---|---|
| **1.1.1** Non-text Content | "alt text for real vehicle imagery" | ⚠️ Solo mención, sin reglas concretas (qué alt text para hero vs card vs gallery) |
| **1.3.1** Info and Relationships | "semantic headings" | ⚠️ Mencionado pero sin definir heading hierarchy por page type |
| **1.4.1** Use of Color | "do not rely on color alone for status" | ✅ Bien cubierto — badges deben tener texto + color |
| **1.4.3** Contrast | "sufficient contrast" + "contrast on badges and buttons" | ⚠️ Sin ratios numéricos (4.5:1 body, 3:1 large text) |
| **2.1.1** Keyboard | "keyboard reachable controls" + "keyboard navigation" | ⚠️ Mencionado sin detallar tab order expectations |
| **2.4.7** Focus Visible | "visible focus states" (×2, docs 08 y 11) | ⚠️ Sin definir CÓMO deben verse (color, width, offset) |
| **3.3.2** Labels | "form labels tied to inputs" + "labels on inputs" | ⚠️ Sin especificar `htmlFor`/`id` pattern ni floating label rules |
| **4.1.3** Status Messages | "aria-live for status updates" | ⚠️ Solo para "waiting/SSE updates", no para form errors, toasts, booking step changes |

#### Criterios OMITIDOS en la documentación

> [!WARNING]
> Los siguientes criterios WCAG 2.1/2.2 AA son **obligatorios** y no aparecen en ningún documento:

| Criterio WCAG | Requerimiento | Impacto para Casablanca |
|---|---|---|
| **1.3.5** Identify Input Purpose | `autocomplete` attributes en inputs de usuario | BookingFlow requiere nombre, email, teléfono, tarjeta — debe usar `autocomplete="given-name"`, `email`, `tel`, `cc-number` |
| **1.4.10** Reflow | Contenido usable a 320px sin scroll horizontal | El BookingWidget de 5 columnas y la Route Map table necesitan estrategia de reflow |
| **1.4.11** Non-text Contrast | Componentes UI interactivos ≥3:1 contra adyacente | Focus rings, input borders, toggle switches, checkbox borders |
| **1.4.12** Text Spacing | No bloquear override de spacing por usuario | Relevante si se usa `!important` en CSS |
| **1.4.13** Content on Hover/Focus | Contenido en hover/focus debe ser dismissable, hoverable, persistent | Popovers de Calendar, Tooltips, Dropdowns |
| **2.4.1** Bypass Blocks | Skip navigation link | Header + navegación repetida en todas las páginas |
| **2.4.2** Page Titled | Título único descriptivo por página | Doc 03 define 20+ rutas, ninguna tiene título especificado |
| **2.4.4** Link Purpose | Texto de link comprensible fuera de contexto | "View vehicle" vs "Click here" |
| **2.4.6** Headings and Labels | Headings descriptivos y únicos | Sin heading hierarchy definida por page template |
| **2.4.11** Focus Not Obscured (2.2) | Focus no oculto por sticky headers | Sticky app header mencionado pero sin focus-obscured handling |
| **2.5.8** Target Size (2.2) | Targets ≥ 24×24px (minimum), recomendado 44×44px | Sin definir minimum touch target sizes |
| **3.1.1** Language of Page | `lang` attribute en `<html>` | Sin mención de idioma ni i18n strategy |
| **3.1.2** Language of Parts | Indicar cambios de idioma en contenido | Copy en inglés pero airport/city names en francés/árabe |
| **3.2.3** Consistent Navigation | Navegación consistente entre páginas | 4 shells documentados pero sin regla de consistencia interna |
| **3.3.4** Error Prevention (Legal) | Reservas son transacciones financieras legales — requieren confirmación reversible | Doc 01 menciona confirmation page pero no documenta "undo/cancel" antes de submit |

### 2.3 Gaps estructurales en accesibilidad

#### G-08 — Sin conformance target declarado

> [!CAUTION]
> **Severidad: Alta**

Ningún documento declara "el frontend debe cumplir WCAG 2.1 Level AA" como objetivo formal. Las menciones de accesibilidad están en secciones llamadas "Accessibility Basics" y "Accessibility Checks" — el lenguaje "basics" y "checks" sugiere un esfuerzo secundario, no un requisito de primera clase.

**Recomendación**: Añadir al Doc 00 (Overview) o como ADR-006: "WCAG 2.1 Level AA is a non-negotiable requirement for all public and customer-facing routes."

---

#### G-09 — Sin estrategia de testing de accesibilidad

> **Severidad: Alta**

Doc 11 lista checks manuales de a11y pero no define:

- Herramientas automatizadas (axe-core, Lighthouse a11y audit, Pa11y)
- Integración en CI/CD
- Thresholds de pass/fail
- Frequency of audits
- Responsable de a11y review

**Recomendación**: Añadir a Doc 11: "Run `axe-core` via Playwright on every P1 route. Score must be 0 violations for critical/serious. Add Lighthouse a11y audit with threshold ≥90."

---

#### G-10 — Sin definición de focus ring system

> **Severidad: Media**

"Visible focus states" se menciona dos veces pero sin definir:

- Color de focus ring (¿accent blue? ¿neutral? ¿outline vs box-shadow?)
- Width (2px mínimo para visibilidad, 3px recomendado)
- Offset (para que no se superponga con bordes de inputs)
- Contraste contra fondo (≥3:1 requerido por 1.4.11)

**Referencia Shadcn/ui**: Usa `ring` utility de Tailwind. Doc 08 debería especificar `--ring` token color y la strategy.

---

#### G-11 — Sin heading hierarchy por page template

> **Severidad: Media**

"Semantic headings" se menciona pero no se define cuál es el `<h1>` de cada ruta. Para 20+ rutas, esto es importante:

| Ruta | h1 debería ser |
|---|---|
| `/` | "Arrive at a higher standard" (o el tagline del hero) |
| `/catalog` | "Choose your vehicle" |
| `/catalog/[vehicleId]` | Vehicle name (ej. "BMW i7 xDrive60") |
| `/book/[vehicleId]` | "Complete your reservation" |
| `/dashboard` | "Your dashboard" |
| `/operator/dashboard` | "Deliveries" |

Sin esto, los implementadores podrían poner headings decorativos en vez de semánticos.

---

#### G-12 — Sin estrategia de idioma/locale

> **Severidad: Media**

Doc 04 menciona `NEXT_PUBLIC_DEFAULT_LOCALE` como variable de entorno, y Doc 07 menciona "locale preference" en localStorage. Pero no hay:

- Idiomas soportados
- Strategy de i18n (intl messages, next-intl, etc.)
- Reglas para mixed-language content (copy en inglés, names en francés/árabe)
- `lang` attribute handling
- RTL consideration (árabe es RTL si se soporta)

Para un producto en Casablanca, el soporte de francés y potencialmente árabe es relevante.

---

### 2.4 Resumen Capa 2

| Aspecto | Score | Detalle |
|---|---|---|
| Awareness de a11y | 6/10 | Se menciona como "basics" en 2 docs |
| Criterios WCAG cubiertos | 3/10 | 8 de 26 criterios AA tocados, todos superficialmente |
| Criterios WCAG omitidos | 1/10 | 15+ criterios AA sin mención alguna |
| Testing strategy de a11y | 2/10 | Lista manual sin herramientas ni CI |
| Focus management | 2/10 | Mencionado sin especificación |
| Language/locale | 2/10 | Variable de entorno sin strategy |
| **Score global** | **3.2/10** | Awareness sin rigor — insuficiente para 2026 |

---

## Capa 3 — Rendimiento y Velocidad (web.dev + Vercel/Next.js)

**Fuentes**: web.dev (Google), guías de Vercel / Next.js

### 3.1 Lo que la documentación hace bien

| Aspecto | Documento | Valoración |
|---|---|---|
| **SSR/SSG decision**: Server Components para data fetch, Client Components para forms/Stripe/SSE | [04:33-41](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/04-FRONTEND-TECHNICAL-ARCHITECTURE.md#L33-L41) | ✅ Correcta separación server/client |
| **Skeleton loaders** documentados por ruta (catalog grid, vehicle detail, booking step, operator rows) | [04:148-156](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/04-FRONTEND-TECHNICAL-ARCHITECTURE.md#L148-L156) | ✅ Cobertura completa de loading states |
| **Error boundaries** por segment con mapping a user actions | [04:130-144](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/04-FRONTEND-TECHNICAL-ARCHITECTURE.md#L130-L144) | ✅ Bien pensado |
| **Fetch model** con `serverFetch` y `clientFetch` separados | [04:110-113](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/04-FRONTEND-TECHNICAL-ARCHITECTURE.md#L110-L113) | ✅ Best practice de Next.js App Router |
| **TanStack Query** para client-side server state, mutations, SSE invalidation | [07:33-41](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/07-STATE-MANAGEMENT-DATA-FLOW.md#L33-L41) | ✅ Correcto para 2026 |
| **No localStorage para backend-owned entities** | [07:59-61](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/07-STATE-MANAGEMENT-DATA-FLOW.md#L59-L61) | ✅ Previene stale data |

### 3.2 Gaps y deficiencias

#### G-13 — Sin Image Optimization Strategy

> [!CAUTION]
> **Severidad: Alta**

Ningún documento menciona `next/image`, formatos modernos (WebP, AVIF), lazy loading de imágenes, ni image sizing strategy.

Para un producto con catálogo de vehículos (galería de imágenes), esto es crítico:
- Vehicle cards con thumbnails
- Vehicle detail con galería
- Hero con imagen principal
- Smart ticket con QR

**Referencia web.dev**: "Serve images in next-gen formats" es uno de los top Lighthouse audit items. "Properly size images" previene bandwidth waste.

**Referencia Vercel/Next.js**: `next/image` con automatic format negotiation, responsive srcset, blur placeholder, priority loading para above-the-fold.

**Recomendación**: Añadir sección a Doc 04 o Doc 08: "Image Strategy — use `next/image` with priority for hero/above-fold, lazy for catalog grid, WebP with AVIF fallback, blur placeholders from backend thumbnails."

---

#### G-14 — Sin Font Loading Strategy

> **Severidad: Alta**

Ningún documento menciona `next/font`, `font-display`, preloading de fuentes, ni FOIT/FOUT handling.

**Referencia web.dev**: "Avoid render-blocking resources" — fonts via `@import url()` son render-blocking. CLS causado por font swap es un problema medible.

**Referencia Vercel/Next.js**: `next/font/google` o `next/font/local` con inlining automático de CSS, font-display: swap, y zero layout shift.

**Recomendación**: Añadir a Doc 04: "Use `next/font` for all typefaces. No external font loading via `<link>` or CSS `@import`."

---

#### G-15 — Sin Core Web Vitals targets

> **Severidad: Alta**

Ningún documento define targets de rendimiento:
- LCP (Largest Contentful Paint) — target: <2.5s
- CLS (Cumulative Layout Shift) — target: <0.1
- INP (Interaction to Next Paint) — target: <200ms
- TTFB (Time to First Byte) — target: <800ms

**Referencia web.dev**: Core Web Vitals son la métrica estándar desde 2021. Para un producto "premium" en 2026, estos targets deberían estar documentados.

**Recomendación**: Añadir a Doc 11 (Testing): "Core Web Vitals targets: LCP <2.5s, CLS <0.1, INP <200ms. Measure via Lighthouse CI on P1 routes."

---

#### G-16 — Sin Bundle Size Strategy

> **Severidad: Media**

Ningún documento aborda:
- Bundle size budgets (ej. "initial JS <200KB gzipped")
- Tree-shaking considerations
- Dynamic imports / code splitting strategy más allá del route-level automático de Next.js
- Dependency audit process
- Third-party script loading (Stripe, analytics)

Doc 04 menciona "TanStack Query, Zustand, react-hook-form" como dependencies pero no evalúa su peso combinado.

**Referencia Vercel/Next.js**: `@next/bundle-analyzer` para tracking, barrel file avoidance, selective imports.

---

#### G-17 — Sin Caching Strategy

> **Severidad: Media**

La documentación no aborda:
- `revalidate` strategy para ISR (catálogo de vehículos)
- `stale-while-revalidate` para datos semi-estáticos
- Cache headers para API proxy responses
- TanStack Query `staleTime` / `gcTime` defaults recomendados
- Static vs dynamic rendering decision por ruta

**Referencia Vercel/Next.js**: Data caching, full route cache, router cache — cada uno con comportamiento distinto en App Router.

**Recomendación**: Definir por ruta si es `static`, `dynamic`, o `ISR(revalidate: X)`:

| Ruta | Rendering strategy recomendado |
|---|---|
| `/` | Static (rebuild on deploy) |
| `/catalog` | ISR (revalidate: 60s) o Static con on-demand revalidation |
| `/catalog/[vehicleId]` | ISR (revalidate: 60s) con `generateStaticParams` |
| `/login`, `/register` | Static shell + client form |
| `/book/[vehicleId]` | Dynamic (auth required) |
| `/reservations/[id]/*` | Dynamic (auth + fresh data) |
| `/dashboard` | Dynamic (auth + fresh data) |
| `/operator/*` | Dynamic (auth + real-time) |

---

#### G-18 — Sin SSE Performance Considerations

> **Severidad: Media**

Doc 04 y Doc 05 mencionan SSE proxying pero no documentan:
- Reconnection strategy con exponential backoff
- Memory management para long-lived connections
- Fallback a HTTP polling si SSE falla
- Impact en server resources (connection limits)
- Client-side cleanup en route transitions

Doc 07 ([07:88-93](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/07-STATE-MANAGEMENT-DATA-FLOW.md#L88-L93)) tiene un flow básico de SSE pero sin performance guardrails.

---

#### G-19 — Sin Stripe Performance Guidelines

> **Severidad: Baja**

Stripe Elements es un third-party script pesado (~80KB). La documentación menciona Stripe como componente pero no aborda:
- Lazy loading de Stripe SDK (solo en `/book/[vehicleId]`)
- `loadStripe` fuera del render path
- Stripe Element mounting performance

---

### 3.3 Resumen Capa 3

| Aspecto | Score | Detalle |
|---|---|---|
| Server/Client separation | 9/10 | Bien documentado en Doc 04 |
| Loading states strategy | 8/10 | Skeletons por ruta, error boundaries |
| Data fetching architecture | 8/10 | serverFetch + TanStack Query |
| Image optimization | 0/10 | Sin mención alguna |
| Font loading | 0/10 | Sin mención alguna |
| Core Web Vitals targets | 0/10 | Sin targets definidos |
| Bundle size management | 1/10 | Solo lista dependencies |
| Caching strategy | 1/10 | Sin rendering strategy por ruta |
| SSE performance | 3/10 | Flow básico sin guardrails |
| **Score global** | **4.1/10** | Buena arquitectura de datos, cero optimización documentada |

---

## Capa 4 — Psicología UX (Laws of UX)

**Fuente**: Laws of UX (Jon Yablonski)

### 4.1 Lo que la documentación hace bien

Doc 01 ([PRODUCT-UX-SPEC.md](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/01-PRODUCT-UX-SPEC.md)) es el documento más fuerte del conjunto. Contiene:

| Aspecto | Valoración |
|---|---|
| **5 personas concretas** con goals, fears, needed info, y UX treatment | ✅ Excelente — rara vez hecho a este nivel |
| **Journey de 11 pasos** con UX objective, backend truth, trust signals, primary CTA, friction to reduce, y must-not-show por cada paso | ✅ Excepcionalmente completo |
| **Psychological frictions** listados explícitamente (arrival uncertainty, hidden-fee anxiety, payment confusion, document rejection fear, pickup doubt, ticket doubt) | ✅ Demuestra empatía real con el usuario |
| **Conversion strategy** con 7 principios claros (concrete first viewport, explain process before payment, premium restraint vs discount pressure, one CTA per step) | ✅ Bien pensado |
| **"What must not be shown"** como guardrails negativos | ✅ Protege contra errores |
| **Marketing/copywriting rules** específicas para el producto | ✅ Elimina ambigüedad |

### 4.2 Análisis por ley de UX

#### ✅ Ley de Jakob — Bien aplicada

Doc 01 journey sigue patterns de booking que los usuarios conocen (search → catalog → detail → book → confirm → check-in → ticket). La tabla de journey ([01:23-35](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/01-PRODUCT-UX-SPEC.md#L23-L35)) documenta cada paso con su CTA y su modelo mental esperado.

**Sin embargo, Gap G-20**:

> **Severidad: Media**

El journey tiene **11 pasos visibles** (Home → Catalog → Detail → Booking → Payment → Confirmation → Check-in → Waiting → Smart ticket → Pickup → Dashboard). Esto es **más largo que cualquier rental competitor** (Sixt: 4 pasos, Enterprise: 3 pasos, Avis: 4 pasos). Los usuarios de car rental no esperan un journey de 11 pasos.

La justificación (document verification antes de pickup) es válida, pero la documentación no aborda cómo **percibir** menos pasos aunque sean necesarios.

**Recomendación**: Documentar una "journey perception" strategy: agrupar pasos en 3 fases visibles para el usuario ("Reserve" → "Verify" → "Pickup") aunque internamente sean 11 rutas.

---

#### ⚠️ Ley de Fitts — Parcialmente cubierta

Doc 08 define que buttons deben incluir clear states (default, hover, active, loading, disabled, destructive) y que "Primary CTAs should be obvious. Secondary actions should not compete."

**Gap G-21**: Sin definición de **minimum target sizes**. Para un producto mobile-first de aeropuerto (usuarios con maletas, en movimiento, con una mano), targets ≥ 48×48px serían apropiados. La documentación no especifica sizes para buttons, filter pills, nav items, ni form controls.

---

#### ⚠️ Ley de Hick — Parcialmente cubierta

Doc 01 dice "one primary CTA per step" ✅ y la conversion strategy limita opciones. Pero:

**Gap G-22**: La documentación no limita el número de filtros en el catálogo. Doc 03 dice "filters must match backend" pero sin definir qué filtros. Si el backend expone 10 filtros, ¿se muestran todos? ¿Se priorizan 3-4?

**Gap G-23**: Doc 02 define 4 navigation contexts (Public, Customer, Operator, Admin) con Primary + Secondary nav. Pero no limita el número de items por nav. Para Hick's Law, cada nav context debería tener ≤7 items primarios.

---

#### ❌ Ley de Miller — No cubierta

> **Severidad: Media**

Ningún documento aborda los límites de la memoria de trabajo del usuario:
- ¿Cuántos vehicle cards por página antes de paginar? (recommendation: ≤12 por vista, con pagination)
- ¿Cuántos stats cards en operator/admin dashboard? (recommendation: ≤7 KPIs visibles)
- ¿Cuántas secciones en la home page antes de fatiga? (recommendation: ≤7 secciones significativas)

---

#### ❌ Ley de Postel — No cubierta

> **Severidad: Media**

La documentación define que el frontend debe normalizar backend errors ([05:136-141](file:///d:/Users/aboul/Desktop/ACD/docs/frontend/05-API-CONTRACT-INTEGRATION.md#L136-L141)) en 5 categorías. Pero no define:
- Input normalization (trimming, case-insensitive email, phone format flexibility)
- Graceful degradation cuando el backend está offline (Doc 04 solo dice "retry/support message")
- Progressive enhancement strategy (¿funciona sin JS para contenido público?)

---

#### ❌ Peak-End Rule — Parcialmente cubierta

Doc 01 identify confirmation y smart ticket como momentos clave. Pero:

**Gap G-24**: El smart ticket es descrito solo como "Prove pickup is ready" con QR + vehicle + time. No hay documentación sobre hacerlo un momento **memorable** (exportable, compartible, visualmente trophy). Para Peak-End Rule, el último contacto digital antes del pickup físico debería ser el componente más cuidado del producto.

**Recomendación**: Añadir a Doc 01 o Doc 08: "The Smart Ticket is the trophy moment — the last digital touchpoint before physical handoff. It must be the most visually refined component in the product. Shareable, screenshot-worthy, wallet-exportable when feasible."

---

#### ❌ Doherty Threshold — No cubierto

> **Severidad: Media**

Ningún documento menciona response time targets. Para un producto premium, system response <400ms (Doherty Threshold) debería ser un non-negotiable documentado. Esto afecta:
- Catalog loading after filter change
- Booking step transitions
- Document upload feedback
- Operator action feedback (approve/reject)

---

#### ❌ Aesthetic-Usability Effect — Implícito pero no documentado

La documentación transmite que el producto debe ser "premium" y "calm". Pero no articula explícitamente que **calidad visual = confianza percibida = más conversión** — especialmente relevante para un producto que pide payment before arrival a turistas que nunca han visitado la empresa.

**Gap G-25**: Sin documentación de "trust through design" — cómo la calidad visual específicamente reduce la fricción psicológica de reservar con una empresa desconocida en Casablanca. Esto debería ser un principio de diseño de primera clase, no implícito.

---

#### ❌ Von Restorff Effect — No cubierto

Sin documentación de qué elementos deben "destacar" visualmente por su importancia:
- CTA de booking en la home
- Precio total en el booking summary
- Status badge más urgente en operator dashboard
- Next action en customer dashboard

---

#### ❌ Zeigarnik Effect — No cubierto pero oportunidad fuerte

El Zeigarnik Effect (la gente recuerda tareas incompletas más que completas) es perfectamente aplicable al journey:
- "2 of 3 steps completed" en el dashboard
- "Documents pending" como reminder en el waiting room
- Booking draft que persiste si el usuario abandona

Doc 07 permite "booking draft in Zustand/sessionStorage" pero no articula el por qué psicológico ni cómo presentarlo.

---

### 4.3 Resumen Capa 4

| Aspecto | Score | Detalle |
|---|---|---|
| Personas y empathy mapping | 10/10 | Excepcionalmente detallado |
| Journey mapping | 9/10 | 11 pasos con trust/friction/CTA |
| Conversion psychology | 8/10 | 7 principios claros |
| Jakob's Law (familiar patterns) | 7/10 | Journey sigue patrones conocidos pero es largo |
| Fitts's Law (target sizing) | 3/10 | Sin sizes definidos |
| Hick's Law (choice limiting) | 5/10 | 1 CTA per step pero sin limits en nav/filters |
| Miller's Law (memory limits) | 1/10 | Sin mención |
| Peak-End Rule | 4/10 | Momentos identificados pero sin craft guidance |
| Doherty Threshold (response time) | 0/10 | Sin mención |
| Aesthetic-Usability Effect | 4/10 | Implícito, no articulado |
| Von Restorff (isolation effect) | 0/10 | Sin mención |
| Zeigarnik Effect (incomplete tasks) | 2/10 | Draft persistence sin articulación |
| **Score global** | **5.8/10** | Excelente empathy, pobre en principios cognitivos formales |

---

## Matriz de Hallazgos Consolidada

### Por severidad

| ID | Capa | Sev. | Hallazgo | Doc(s) afectado(s) |
|---|---|---|---|---|
| G-01 | 🎨 Visual | **Alta** | Sin tokens de diseño concretos (HSL values, spacing scale, radius scale) | 08 |
| G-08 | ⚖️ WCAG | **Alta** | Sin conformance target WCAG declarado | 00, 08 |
| G-09 | ⚖️ WCAG | **Alta** | Sin estrategia de testing de accesibilidad automatizada | 11 |
| G-13 | ⚡ Perf | **Alta** | Sin Image Optimization Strategy (`next/image`, WebP, lazy) | 04, 08 |
| G-14 | ⚡ Perf | **Alta** | Sin Font Loading Strategy (`next/font`, font-display) | 04, 08 |
| G-15 | ⚡ Perf | **Alta** | Sin Core Web Vitals targets (LCP, CLS, INP) | 11 |
| G-02 | 🎨 Visual | **Media** | Sin especificación de fuentes tipográficas concretas | 08 |
| G-03 | 🎨 Visual | **Media** | Paleta semántica incompleta (sin info, warning vs destructive, chart colors) | 08 |
| G-04 | 🎨 Visual | **Media** | Sin breakpoints ni container widths concretos | 08 |
| G-10 | ⚖️ WCAG | **Media** | Sin definición de focus ring system | 08 |
| G-11 | ⚖️ WCAG | **Media** | Sin heading hierarchy por page template | 08, 03 |
| G-12 | ⚖️ WCAG | **Media** | Sin estrategia de idioma/locale/i18n | 04 |
| G-16 | ⚡ Perf | **Media** | Sin Bundle Size Strategy ni budgets | 04 |
| G-17 | ⚡ Perf | **Media** | Sin Caching/Rendering Strategy por ruta | 04 |
| G-18 | ⚡ Perf | **Media** | Sin SSE performance guardrails | 04, 07 |
| G-20 | 🧠 UX | **Media** | Journey de 11 pasos sin perception grouping | 01 |
| G-21 | 🧠 UX | **Media** | Sin minimum target sizes (Fitts's Law) | 08 |
| G-22 | 🧠 UX | **Media** | Sin límite de filtros en catálogo (Hick's Law) | 03 |
| G-24 | 🧠 UX | **Media** | Smart Ticket sin craft guidance para Peak-End Rule | 01, 08 |
| G-25 | 🧠 UX | **Media** | Sin "trust through design" como principio articulado | 08 |
| G-05 | 🎨 Visual | **Baja** | Sin especificación de icon library | 08 |
| G-06 | 🎨 Visual | **Baja** | Component inventory sin prioridad individual | 09 |
| G-07 | 🎨 Visual | **Baja** | Sin motion specification concreta (curves, durations) | 08 |
| G-19 | ⚡ Perf | **Baja** | Sin Stripe lazy loading guidance | 04 |
| G-23 | 🧠 UX | **Baja** | Sin límite de nav items por context (Hick's Law) | 02 |

### Por documento

| Documento | Gaps encontrados | Score |
|---|---|---|
| 00 — Overview | G-08 | 8/10 — Sólido, falta declarar WCAG target |
| 01 — Product UX | G-20, G-24, G-25 | 9/10 — El mejor doc, gaps menores |
| 02 — Info Architecture | G-23 | 8/10 — Bien estructurado |
| 03 — Route Map | G-11, G-22 | 7/10 — Exhaustivo pero sin metadata de heading/filters |
| 04 — Tech Architecture | G-12, G-13, G-14, G-16, G-17, G-18, G-19 | 5/10 — Buena estructura, muchas omisiones de performance |
| 05 — API Contract | — | 9/10 — Muy completo |
| 06 — Auth/Session | — | 9/10 — Bien pensado |
| 07 — State Management | — | 9/10 — Reglas de ownership claras |
| 08 — Design System | G-01, G-02, G-03, G-04, G-05, G-07, G-10, G-21 | 4/10 — Buena dirección, pobre especificación |
| 09 — Component Arch | G-06 | 8/10 — Buena separación de capas |
| 10 — Roadmap | — | 9/10 — Fases claras con DoD |
| 11 — Testing | G-09, G-15 | 5/10 — Falta a11y automation y CWV targets |
| 12 — Agent Handoff | — | 8/10 — Útil y práctico |
| ADRs (5) | — | 9/10 — Decisiones bien argumentadas |

---

## Plan de Acción: Documentación que falta

### Tier 1 — Crítico para la mejor interfaz 2026

| Acción | Doc target | Contenido necesario |
|---|---|---|
| **Crear Token Specification** | 08 (nueva sección) | Valores HSL concretos para todos los Shadcn/ui tokens, spacing scale (4–64px), radius scale, shadow scale |
| **Crear Typography Specification** | 08 (nueva sección) | Font families (display + body + mono), font-size ramp con clamp() values, weight rules per context |
| **Declarar WCAG AA como target formal** | 00 o nuevo ADR-006 | Statement formal + criterios cubiertos + ownership |
| **Definir Image Strategy** | 04 (nueva sección) | `next/image`, formatos, lazy/priority, blur placeholder, sizing per component |
| **Definir Font Loading Strategy** | 04 (nueva sección) | `next/font`, fallback fonts, font-display |
| **Definir Core Web Vitals targets** | 11 (nueva sección) | LCP <2.5s, CLS <0.1, INP <200ms, measurement strategy |

### Tier 2 — Importante para calidad premium

| Acción | Doc target | Contenido necesario |
|---|---|---|
| Completar paleta semántica | 08 | info, warning vs destructive, success, chart-1 to chart-5, neutral scale |
| Definir breakpoints y containers | 08 | sm–2xl values, container max-widths, grid collapse rules |
| Definir focus ring system | 08 | Color, width, offset, contrast requirements |
| Definir heading hierarchy per route | 03 o 08 | h1 per route, h2-h3 patterns per page type |
| Crear Rendering Strategy Matrix | 04 | static/ISR/dynamic per route con justificación |
| Definir journey perception grouping | 01 | 3-4 phases visibles para el usuario (Reserve → Verify → Pickup) |
| Definir minimum target sizes | 08 | Buttons ≥44px, filter pills ≥44px, nav items ≥44px on mobile |
| Articular Smart Ticket como trophy moment | 01 o 08 | Craft guidance, shareability, visual refinement priority |
| Documentar "trust through design" | 08 | Principio explícito: visual quality = trust = conversion |

### Tier 3 — Mejoras de completitud

| Acción | Doc target | Contenido necesario |
|---|---|---|
| Definir icon library | 08 | Package name, strokeWidth, sizing scale |
| Definir motion specification | 08 | Easing curves, duration ranges, reduced-motion strategy |
| Definir locale/i18n strategy | 04 (nueva sección) | Idiomas, i18n library, RTL, `lang` attribute |
| Add a11y testing tools to QA | 11 | axe-core, Lighthouse a11y, CI integration |
| Component priority within roadmap phases | 09 o 10 | MVP vs nice-to-have per phase |
| SSE performance guardrails | 04 o 07 | Reconnection backoff, cleanup, fallback polling |
| Bundle size budget | 04 | Initial JS <200KB gzip, dependency audit process |
| Catalog filter/pagination limits | 03 | Max visible filters, items per page, Hick's Law alignment |
| Stripe lazy loading | 04 | loadStripe on route entry, not on app init |

---

> [!TIP]
> **La documentación de Casablanca-V1 es inusualmente buena** para un proyecto de este tamaño. Los documentos 01 (UX Spec), 05 (API Contract), 06 (Auth), 07 (State), y los 5 ADRs son de calidad profesional. El gap principal no es la dirección estratégica (que es fuerte) sino la **especificación implementable**: tokens sin valores, guidelines sin números, y performance sin targets. Cerrar estos gaps convertirá buenas intenciones en una especificación que cualquier desarrollador o agente puede implementar sin interpretación.
