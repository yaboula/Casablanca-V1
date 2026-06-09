# Casablanca‑V1 — Auditoría UI/UX Frontend 2026

**Formato:** Markdown compartible  
**Fecha:** 9 de junio de 2026  
**Proyecto:** Casablanca‑V1 — plataforma premium de alquiler de coches airport‑first para Casablanca Mohammed V Airport  
**Objetivo:** Definir una auditoría profunda y accionable para construir una interfaz de referencia en 2026: premium, rápida, accesible, segura, backend‑aligned y operativamente real.

---

## 1. Resumen ejecutivo

Casablanca‑V1 tiene una base estratégica fuerte: el producto no compite como una web genérica de alquiler de coches, sino como una experiencia de **airport concierge**: reservar antes de aterrizar, completar verificación antes del pickup y usar un smart ticket para una entrega rápida en Casablanca Mohammed V Airport.

La documentación del proyecto ya toma varias decisiones correctas:

- El frontend final debe reconstruirse en **Next.js App Router**.
- El **backend endurecido** es la fuente de verdad para negocio, auth, roles, precios, reservas, documentos, pagos, operador y admin.
- La SPA visual de Emergent debe usarse solo como inspiración visual, no como arquitectura productiva.
- Las rutas basadas en reserva deben usar **UUIDs backend**, no referencias falsas.
- Los mocks pueden existir en tests, fixtures o prototipos aislados, pero no en rutas productivas.

La interfaz 2026 no debe buscar “más efectos visuales”. Debe buscar **confianza operacional**: cada pantalla debe reducir incertidumbre, acelerar una decisión o hacer más seguro un flujo real.

> Principio rector: **cada pixel debe aumentar confianza, velocidad o claridad operacional. Si solo decora, se elimina.**

---

## 2. Fuentes usadas para la auditoría

### 2.1 Fuentes internas del proyecto

- `00-FRONTEND-OVERVIEW.md`
- `01-PRODUCT-UX-SPEC.md`
- `02-INFORMATION-ARCHITECTURE.md`
- `03-ROUTE-MAP.md`
- `04-FRONTEND-TECHNICAL-ARCHITECTURE.md`
- `05-API-CONTRACT-INTEGRATION.md`
- `06-AUTH-SESSION-SECURITY.md`
- `07-STATE-MANAGEMENT-DATA-FLOW.md`
- `08-DESIGN-SYSTEM-THEME.md`
- `09-COMPONENT-ARCHITECTURE.md`
- `10-IMPLEMENTATION-ROADMAP.md`
- `11-TESTING-QA-STRATEGY.md`
- `12-AGENT-HANDOFF-GUIDE.md`
- ADRs: Next App Router, backend as source of truth, no SPA mock store, auth cookie session proxy, reservation UUID routing.

### 2.2 Fuentes externas de referencia

- Shadcn/ui documentation: https://ui.shadcn.com/docs
- Shadcn/ui registry documentation: https://ui.shadcn.com/docs/registry
- Tailwind CSS responsive design: https://tailwindcss.com/docs/responsive-design
- WCAG 2.2 W3C Recommendation: https://www.w3.org/TR/WCAG22/
- What’s New in WCAG 2.2, W3C WAI: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- Core Web Vitals, web.dev: https://web.dev/articles/vitals
- Core Web Vitals, Google Search Central: https://developers.google.com/search/docs/appearance/core-web-vitals
- Next.js Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js Lazy Loading: https://nextjs.org/docs/app/guides/lazy-loading
- Next.js Server Components and Streaming: https://nextjs.org/docs/14/app/building-your-application/rendering/server-components
- Vercel Speed Insights: https://vercel.com/docs/speed-insights
- Laws of UX: https://lawsofux.com/

---

## 3. Veredicto general

| Dimensión | Estado estimado | Riesgo | Prioridad | Recomendación |
|---|---:|---:|---:|---|
| Posicionamiento producto | Fuerte | Bajo | P0 | Mantener “premium airport concierge” |
| Arquitectura frontend | Bien definida | Medio | P0 | Ejecutar Next App Router sin mezclar SPA |
| Sistema visual | Prometedor | Medio | P1 | Convertir estética Emergent en tokens y componentes auditables |
| UX conversión | Prometedora | Medio | P1 | Reducir ansiedad: precio, documentos, pickup, soporte |
| Accesibilidad | Parcial | Alto | P0 | WCAG 2.2 AA como gate de release |
| Rendimiento | Bien orientado | Medio | P0 | Diseñar desde Core Web Vitals, no optimizar al final |
| Seguridad/session | Bien planteada | Alto si se rompe | P0 | HttpOnly cookie proxy, nunca tokens en browser storage |
| Operador/admin | Correctamente separado | Medio‑alto | P1 | Consolas densas, escaneables, no marketing |
| Testing | Bien documentado | Medio | P0 | Convertir QA en Definition of Done |

### Conclusión ejecutiva

El producto puede alcanzar un estándar excelente en 2026 si se mantiene la disciplina de arquitectura: **backend truth + Next App Router + diseño visual restringido + WCAG AA + Core Web Vitals + testing real**.

El principal peligro no es visual. El principal peligro es que la UI parezca terminada mientras internamente conserva mocks, fake refs, fake QR, estados locales o endpoints inventados.

---

## 4. Principio de interfaz 2026

La interfaz debe sentirse:

- **Premium**, pero no decorativa.
- **Calmada**, pero no lenta.
- **Operacional**, pero no fría.
- **Clara**, pero no simplista.
- **Rápida**, pero no agresiva.
- **Confiable**, porque cada dato importante viene del backend.

### Regla de producto

Casablanca‑V1 no debe vender “lujo” de forma vaga. Debe vender **certeza antes de aterrizar**:

> “Reserve before you land. Verify before pickup. Collect your car at Casablanca Mohammed V Airport in minutes.”

---

## 5. Auditoría de capa visual y componentes

### 5.1 Shadcn/ui como base, no como plantilla

Shadcn/ui no debe tratarse como una librería cerrada de componentes, sino como una base editable para construir un sistema propio. La documentación de Shadcn lo plantea como una forma de construir una component library propia y personalizable.

**Decisión recomendada:** usar Shadcn/ui como base de componentes accesibles y editables, con un registry interno para Casablanca‑V1.

### 5.2 Tailwind CSS como capa de tokens y composición

Tailwind es adecuado para interfaces responsivas y consistentes, especialmente porque permite aplicar utilidades por breakpoint. El riesgo es convertirlo en una acumulación de clases improvisadas. Por eso debe existir una estrategia de tokens.

### 5.3 Tokens mínimos obligatorios

```ts
// Ejemplo conceptual, no contrato final
export const designTokens = {
  radius: {
    sm: "0.375rem",
    md: "0.625rem",
    lg: "0.875rem",
    xl: "1.25rem",
  },
  spacing: {
    pageX: "clamp(1rem, 4vw, 4rem)",
    sectionY: "clamp(3rem, 8vw, 7rem)",
    card: "1.25rem",
  },
  status: {
    pending: "amber",
    approved: "green",
    rejected: "red",
    active: "blue",
    neutral: "zinc",
  },
}
```

### 5.4 Cuatro modos visuales, no uno

| Superficie | Personalidad visual | Densidad | Objetivo |
|---|---|---:|---|
| Marketing | Premium, atmosférica, emocionalmente clara | Baja | Crear confianza y deseo |
| Catalog/detail | Premium + comparativa | Media | Elegir vehículo rápido |
| Customer journey | Calm, guiada, segura | Media | Reducir ansiedad |
| Operator/admin | Operacional, densa, silenciosa | Alta | Decidir y actuar rápido |

### 5.5 Reglas visuales recomendadas

- Usar blanco/off‑white, neutrales y contraste premium.
- Reservar el azul eléctrico para intención primaria o estado activo.
- Evitar gradientes pesados, blobs, orbs y dashboards glossy.
- Mantener radius moderado; no convertir todo en pills.
- Usar sombras solo para jerarquía e interacción real.
- Mantener movimiento sutil, corto y funcional.
- Mantener labels visibles en formularios.
- No depender de color como única comunicación de estado.

---

## 6. Auditoría de accesibilidad y cumplimiento WCAG 2.1/2.2 AA

### 6.1 Diagnóstico

La documentación del proyecto ya menciona fundamentos correctos: navegación por teclado, focus visible, headings semánticos, alt text, contraste, labels asociados, `aria-live` para estados y no comunicar únicamente por color.

Para una interfaz 2026, esto debe dejar de ser checklist manual y convertirse en **gate de release**.

### 6.2 WCAG 2.2: criterios relevantes

WCAG 2.2 añade criterios importantes sobre foco visible/no obstruido, movimientos de arrastre, tamaño mínimo de objetivo, ayuda consistente, entrada redundante y autenticación accesible. Estos puntos importan directamente en Casablanca‑V1 porque el producto contiene formularios, login, checkout, documentos, dashboard, ticket y consola operator.

### 6.3 Reglas AA no negociables

| Área | Regla práctica |
|---|---|
| Contraste | Texto normal con ratio mínimo 4.5:1; no confiar en “se ve bien” |
| Focus | Todo control interactivo debe tener focus visible |
| Formularios | Labels siempre visibles; error cerca del campo; mensaje accesible |
| Badges | Estado comunicado con texto, color y/o icono, nunca solo color |
| Upload | Progreso y errores recuperables; input accesible |
| Waiting room | Cambios relevantes con `aria-live`, sin spam de anuncios |
| Dialogs | Focus trap, Escape, título y descripción |
| Tablas admin | Headers correctos, orden claro, acciones nombradas |
| Mobile/operator | Touch targets cómodos y acciones críticas fáciles de tocar |

### 6.4 Riesgos de accesibilidad del proyecto

| Riesgo | Impacto | Mitigación |
|---|---:|---|
| Badges con contraste bajo | Alto | Tokens semánticos testados con contraste AA |
| Formularios con placeholders como labels | Alto | Labels persistentes obligatorios |
| Waiting room con estados live mal anunciados | Medio‑alto | `aria-live="polite"` + fallback visible |
| Dialogs o dropdowns mal gestionados | Medio | Primitives Shadcn auditadas + tests teclado |
| Operator/admin demasiado denso sin jerarquía | Medio | Tablas semánticas + filtros + focus claro |

---

## 7. Auditoría de rendimiento y velocidad

### 7.1 Core Web Vitals como contrato

Core Web Vitals mide experiencia real en tres ejes principales:

- **LCP:** carga percibida del contenido principal.
- **INP:** capacidad de respuesta a interacciones.
- **CLS:** estabilidad visual.

### 7.2 Presupuesto recomendado

| Métrica | Objetivo recomendado |
|---|---:|
| LCP mobile | ≤ 2.5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0.1 |
| JS inicial landing | Mínimo; sin Stripe ni operator/admin code |
| Hero image | Optimizada, con dimensiones reservadas |
| Fonts | Máximo 1 familia base + 1 display si realmente aporta |
| Booking | Sin layout shifts entre pasos |
| Operator | Acciones con feedback inmediato + refetch fiable |

### 7.3 Reglas Next.js/Vercel

- Usar Server Components por defecto para landing, catalog, detail y páginas iniciales con datos canónicos.
- Usar Client Components solo donde haya interacción real: forms, Stripe Elements, uploads, SSE, filtros interactivos.
- Lazy‑load de Stripe, modals, mapas, dashboards pesados y componentes no críticos.
- Usar `loading.tsx`, Suspense y streaming para evitar rutas bloqueadas por datos lentos.
- Medir con Lighthouse en desarrollo y Speed Insights/RUM en producción.

### 7.4 Anti‑patrones de rendimiento

- Cargar Stripe en la home.
- Cargar operador/admin en bundles públicos.
- Hero images sin tamaño reservado.
- Skeletons que causan layout shift al reemplazarse.
- Filtros de catalog completamente client‑side cuando los datos pueden venir server‑rendered.
- Animaciones decorativas repetidas en operator/admin.

---

## 8. Laws of UX aplicadas a Casablanca‑V1

| Ley UX | Aplicación concreta |
|---|---|
| Jakob’s Law | No reinventar login, checkout, navegación, tablas o upload |
| Hick’s Law | Una decisión primaria por pantalla; reducir opciones simultáneas |
| Fitts’s Law | CTAs grandes, cercanos y fáciles de tocar, sobre todo en mobile/operator |
| Miller’s Law | Booking en chunks: viaje, conductor, revisión, pago, confirmación |
| Peak‑End Rule | Los momentos memorables deben ser confirmation y smart ticket |
| Goal‑Gradient Effect | Stepper claro de progreso: reserva → pago → documentos → ticket |
| Tesler’s Law | La complejidad real se mueve a adapters, estados y backend truth; no se oculta con fake UI |
| Von Restorff Effect | Un único CTA visualmente dominante por paso |
| Law of Proximity | Precio, depósito y condiciones cerca del CTA de pago |

### Momentos psicológicos críticos

1. **Antes de pagar:** miedo a hidden fees y reserva falsa.
2. **Después de pagar:** “¿qué hago ahora?”.
3. **Upload docs:** miedo a rechazo o privacidad.
4. **Waiting room:** miedo a estar bloqueado sin respuesta.
5. **Smart ticket:** “¿el operador aceptará esto?”.
6. **Pickup:** correspondencia entre mundo físico y estado digital.

La mejor interfaz debe diseñar especialmente estos seis momentos.

---

## 9. Arquitectura frontend recomendada

### 9.1 Estructura base

```txt
src/
  app/
    (public)/
    (auth)/
    (customer)/
    operator/
    api/
  components/
    ui/
    layout/
    marketing/
    presentational/
  features/
    auth/
    catalog/
    booking/
    reservations/
    documents/
    waiting-room/
    smart-ticket/
    dashboard/
    operator/
    admin/
  lib/
    api/
    auth/
    adapters/
    config/
    sse/
    stripe/
    validation/
    utils/
  stores/
  types/
```

### 9.2 Modelo de flujo de datos

```txt
backend response
→ feature service
→ adapter
→ view model
→ presentational component
```

### 9.3 Reglas por capa

| Capa | Puede conocer | No debe conocer |
|---|---|---|
| `components/ui` | estados visuales genéricos | reglas de negocio |
| `components/presentational` | view models | DTOs backend crudos |
| `features/*` | dominio, servicios, hooks, adapters | secretos o auth tokens crudos |
| `lib/api` | proxy, fetch, errores | UI visual específica |
| `stores` | drafts, preferencias, UI temporal | reservas/documentos/pagos como verdad durable |

---

## 10. Seguridad, auth y sesión

### 10.1 Estrategia recomendada

- Browser JavaScript no debe poseer access token ni refresh token como estado durable.
- Access/refresh tokens deben almacenarse en cookies HttpOnly.
- Next route handlers deben crear sesión, refrescar tokens, limpiar logout y proxyear `/api/v1`.
- SSE debe pasar por proxy porque EventSource no permite headers Authorization personalizados.

### 10.2 Riesgos principales

| Riesgo | Severidad | Mitigación |
|---|---:|---|
| Token en localStorage | Crítico | HttpOnly cookie proxy |
| Refresh mal rotado | Alto | Centralizar `/api/auth/refresh` |
| SSE con token en URL | Alto | `/api/sse/*` proxy |
| UI permite navegar a roles incorrectos | Medio | Guards tempranos + backend 403 graceful |
| Stale user data tras expiración | Medio | Session expired UX + redirect target |

---

## 11. Auditoría por journey

### 11.1 Home

**Objetivo:** explicar valor en el primer viewport.

Debe responder:

1. Qué es Casablanca‑V1.
2. Dónde opera.
3. Qué gana el usuario.
4. Qué pasa después.
5. Por qué puede confiar.

**Recomendación:** primer viewport con claim concreto, selector/CTA simple, proceso de 3 pasos y señal de soporte.

**Evitar:** claims genéricos de luxury, fake urgency, ubicaciones no soportadas.

### 11.2 Catalog

**Objetivo:** comparar vehículos reales.

Obligatorio:

- `GET /vehicles`.
- Vehicle UUID como identidad.
- Precio y specs reales.
- Skeleton grid.
- Empty state útil.
- Filtros solo si coinciden con backend.

Prohibido:

- ratings falsos;
- disponibilidad inventada;
- specs mock;
- tarjetas visualmente premium pero contractualmente falsas.

### 11.3 Vehicle detail

**Objetivo:** convertir interés en intención de reserva.

Estructura recomendada:

1. Galería optimizada.
2. Nombre, categoría, precio.
3. CTA sticky “Reserve this vehicle”.
4. Specs reales.
5. Pickup en Casablanca Mohammed V Airport.
6. Documentos requeridos.
7. Pago/deposit explicado.
8. FAQ corta.

### 11.4 Booking/payment

**Objetivo:** crear reserva real y pago seguro.

Debe usar:

- `GET /vehicles/:id`.
- `POST /reservations`.
- `Idempotency-Key`.
- Stripe client secret generado por backend.
- Backend price summary como verdad.

Flujo recomendado:

1. Trip details.
2. Driver/customer details.
3. Review price/deposit.
4. Secure payment.
5. Confirmation.

### 11.5 Confirmation

**Objetivo:** convertir éxito técnico en seguridad emocional.

Debe mostrar:

- vehículo;
- fechas;
- pickup location;
- estado;
- próximo paso;
- documentos necesarios;
- soporte.

CTA único: **Begin check‑in**.

### 11.6 Check‑in

**Objetivo:** que la verificación parezca fast‑track, no burocracia.

Debe incluir:

- checklist de Passport + Driving License;
- privacidad explicada;
- progreso visible;
- errores recuperables;
- rechazo con razón y re‑upload.

No debe pedir selfie si el backend no lo soporta.

### 11.7 Waiting room

**Objetivo:** mantener calma durante revisión.

Debe mostrar:

- estado real;
- documentos recibidos;
- progreso de review;
- último update;
- soporte;
- fallback HTTP si SSE falla.

No debe fingir live status.

### 11.8 Smart ticket

**Objetivo:** probar que el pickup está listo.

Debe incluir:

- QR real desde reservation detail/backend truth;
- vehículo;
- pickup point;
- customer name;
- estado ready;
- instrucción clara para mostrarlo al operador.

Prohibido:

- QR frontend‑generated como verdad;
- endpoint `/tickets` inexistente;
- fake booking code como identidad productiva.

### 11.9 Operator console

**Objetivo:** revisión y handoff rápido.

Debe ser:

- densa;
- rápida de escanear;
- orientada a colas;
- fuerte en badges;
- clara en acciones;
- silenciosa visualmente.

Prioridades:

- pending documents;
- ready pickups;
- search;
- QR/manual check‑in;
- complete reservation;
- refetch tras cada acción.

### 11.10 Admin console

**Objetivo:** gestión compacta y segura.

Debe incluir:

- stats reales;
- users;
- vehicles;
- `licensePlate`;
- destructive actions explícitas;
- formularios densos pero claros.

---

## 12. Riesgos críticos y mitigaciones

| Riesgo | Severidad | Señal temprana | Mitigación |
|---|---:|---|---|
| Preservar mock store SPA | Crítica | imports desde AppStore/mock data | regla lint/PR: no mocks productivos |
| Mezclar React Router y Next App Router | Alta | rutas duplicadas | eliminar SPA como path productivo |
| Usar fake refs | Alta | URLs tipo `/ticket/:ref` | UUID backend obligatorio |
| Inventar endpoints | Alta | `/tickets`, `/documents/status` | services solo desde contrato API |
| Token leak | Crítica | localStorage/sessionStorage auth | HttpOnly cookie session proxy |
| Pricing calculado como verdad frontend | Alta | total final local | backend EUR cents canonical |
| UI premium con contraste bajo | Alta | badges/text subtle | tokens AA + axe |
| Operator demasiado decorativo | Media‑alta | cards grandes, poca densidad | filas/tables, priority sorting |
| Waiting room falso | Alta | estado local “approved” | SSE + refetch + backend truth |
| Performance tardío | Media | Stripe y dashboards en bundle inicial | lazy load + server components |

---

## 13. Plan de implementación recomendado

### Phase 0 — Inventory and preservation

**Objetivo:** inventariar qué visual se conserva y qué mock se elimina.

Gate adicional:

- Mapa “port visual only”.
- Lista de mocks a eliminar.
- Decisión clara de baseline frontend.

### Phase 1 — Next foundation + auth/session + shell

**Objetivo:** establecer Next App Router, sesión segura y route groups.

Gate adicional:

- Login/register/session/logout funcionales.
- Access/refresh no legibles desde browser JS.
- Guards customer/operator/admin.
- Shell responsive con focus visible.

### Phase 2 — Public home/catalog/detail

**Objetivo:** adquisición y browsing real sobre backend vehicles.

Gate adicional:

- No mock vehicles.
- LCP optimizado.
- Cards sin overflow en 390px.
- Filtros contract‑aligned.

### Phase 3 — Booking/payment/confirmation

**Objetivo:** crear reservas reales y pago seguro.

Gate adicional:

- Idempotency key.
- Stripe lazy‑loaded.
- No fake totals/fake refs.
- Duplicate submit protected.
- Error backend normalizado.

### Phase 4 — Check‑in/waiting/ticket/dashboard

**Objetivo:** completar customer journey.

Gate adicional:

- Upload accesible.
- Waiting SSE + fallback HTTP.
- Ticket backend‑truth.
- Dashboard con una next action.

### Phase 5 — Operator console

**Objetivo:** flujo real de operador.

Gate adicional:

- Pending docs.
- Approve/reject.
- QR/manual check‑in.
- Complete reservation.
- Densidad y usabilidad táctil.

### Phase 6 — Admin console

**Objetivo:** gestión de stats/users/fleet.

Gate adicional:

- `licensePlate` incluido.
- Destructive actions claras.
- Tables accesibles.
- Role guards.

### Phase 7 — E2E and hardening

**Objetivo:** probar el producto extremo a extremo.

Gate adicional:

- Playwright customer happy path.
- Playwright operator flow.
- Auth/role tests.
- Accessibility tests.
- Core Web Vitals baseline.
- Visual screenshots en rutas críticas.

---

## 14. Definition of Done UI 2026

Una pantalla no está terminada hasta que cumple todo esto:

- Usa backend truth.
- No usa mocks productivos.
- Tiene loading state.
- Tiene empty state.
- Tiene error state.
- Tiene success/confirmation state.
- Funciona en 390px mobile.
- Es navegable por teclado.
- Tiene focus visible.
- Pasa contraste WCAG AA.
- No depende solo del color para estados.
- No rompe LCP/CLS/INP.
- Tiene copy claro de “qué pasa después”.
- Tiene tests o QA documentado.

---

## 15. Checklist de revisión por PR

### Arquitectura

- [ ] ¿La ruta pertenece al route group correcto?
- [ ] ¿La página usa Next App Router y no React Router?
- [ ] ¿Los datos backend se cargan por service/helper typed?
- [ ] ¿Hay adapter DTO → view model?
- [ ] ¿No se usa backend DTO crudo en componentes visuales?

### Seguridad

- [ ] ¿No hay tokens en localStorage/sessionStorage?
- [ ] ¿La llamada autenticada pasa por proxy/server helper?
- [ ] ¿Logout limpia cookies y UI state?
- [ ] ¿Forbidden/unauthorized tienen UX clara?

### UX

- [ ] ¿Existe un único CTA primario?
- [ ] ¿El usuario sabe qué pasa después?
- [ ] ¿El copy evita promesas no soportadas?
- [ ] ¿La pantalla reduce una ansiedad real del journey?

### Accesibilidad

- [ ] ¿Todos los inputs tienen labels visibles?
- [ ] ¿Errores están cerca del campo?
- [ ] ¿Focus visible?
- [ ] ¿Teclado completo?
- [ ] ¿Contraste AA?
- [ ] ¿Estados no dependen solo de color?

### Rendimiento

- [ ] ¿El componente necesita realmente ser client component?
- [ ] ¿Stripe o librerías pesadas están lazy‑loaded?
- [ ] ¿Images tienen tamaño reservado?
- [ ] ¿Skeleton no genera layout shift?
- [ ] ¿No se cargan bundles operator/admin en público?

### Backend truth

- [ ] ¿No hay fake refs?
- [ ] ¿No hay fake QR?
- [ ] ¿No hay endpoints inventados?
- [ ] ¿No hay pricing final calculado como verdad frontend?
- [ ] ¿No hay estados productivos derivados de mocks?

---

## 16. Métricas recomendadas

| Categoría | Métrica | Meta |
|---|---|---:|
| Conversión | Home → catalog | Medir baseline tras release |
| Conversión | Detail → booking start | Mejorar con CTA/sticky summary |
| Conversión | Booking start → reservation created | Alta prioridad |
| Conversión | Reservation → payment success | Alta prioridad |
| Journey | Confirmation → check‑in start | Alta prioridad |
| Journey | Check‑in completed | Alta prioridad |
| Operación | Pending docs review time | Reducir |
| Operación | Ready pickup handoff time | Reducir |
| UX | Support clicks during waiting | Interpretar como señal de ansiedad |
| Performance | LCP/INP/CLS | Cumplir Core Web Vitals |
| Accessibility | Axe violations critical/serious | 0 antes de release |

---

## 17. Recomendación final

Casablanca‑V1 ya tiene una dirección de producto y arquitectura superior a una landing genérica de alquiler. La oportunidad está en convertir esa dirección en un sistema ejecutable:

1. **Arquitectura:** Next App Router, route groups, server/client separation.
2. **Verdad de negocio:** backend como source of truth, UUIDs, adapters, sin mocks productivos.
3. **Diseño:** Shadcn/ui + Tailwind como sistema propio, premium por claridad y restricción.
4. **Accesibilidad:** WCAG 2.2 AA como gate, no como mejora posterior.
5. **Rendimiento:** Core Web Vitals desde el diseño, no al final.
6. **UX:** Laws of UX aplicadas a los momentos de ansiedad real: pago, documentos, waiting, ticket y pickup.
7. **QA:** Playwright, adapter tests, auth tests, visual screenshots y mobile checks como Definition of Done.

La mejor interfaz 2026 para este proyecto no será la más llamativa. Será la que haga que el cliente piense:

> “Todo está claro. Mi coche existe. Mi reserva es real. El operador me espera. Puedo aterrizar tranquilo.”

---

## 18. Apéndice — Prompt de implementación para agentes

Usar este bloque como instrucción para cualquier agente que vaya a construir una fase:

```txt
Build Casablanca‑V1 frontend according to the 2026 UI/UX audit.
Use Next.js App Router as the production foundation.
Do not use React Router SPA routes as production architecture.
Do not use SPA mock store, fake reservations, fake refs, fake QR, fake payments, or mock operator/admin actions in production routes.
Use backend APIs as the source of truth.
Map backend DTOs through feature adapters before rendering presentational components.
Use Shadcn/ui as editable component foundation and Tailwind CSS through design tokens.
Meet WCAG 2.2 AA for keyboard, focus, contrast, labels, status communication, dialogs, tables, and live states.
Protect Core Web Vitals: keep public routes server-rendered where possible, lazy-load Stripe/heavy client libraries, reserve image dimensions, avoid layout shift.
For each route, include loading, empty, error, success states and clear “what happens next” copy.
Run relevant build, unit, adapter, auth, Playwright, accessibility, and mobile checks before claiming completion.
```
