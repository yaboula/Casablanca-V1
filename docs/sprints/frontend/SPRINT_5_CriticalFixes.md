# Sprint 5 — "Critical Fixes" 🔴
> **Objetivo:** Cerrar todos los flujos rotos. Sin esto, la app no es demo-able.
> **Prioridad:** MÁXIMA — bloquea todo lo demás.

---

## Issues a resolver

### [FIX-01] · Página de confirmación post-pago
**Ruta faltante:** `/booking/confirmed`

Actualmente: BookFlowClient → pago → redirige directo a `/check-in` sin confirmación.

**Lo que necesita:**
- Número de reserva generado (e.g. `CMN-2026-XXX`)
- Resumen del coche + fechas + importe total
- CTA principal: "Completar check-in ahora"
- CTA secundario: "Lo haré más tarde" → redirige a `/dashboard`
- Animación de éxito (confetti ligero o check animado)

---

### [FIX-02] · ID de reserva viajando por todo el pipeline
El `BookFlowClient` genera un ID fake al confirmar el pago y lo guarda en el store. Ese ID debe pasarse como query param a cada etapa:

```
/booking/confirmed?id=CMN-2026-XXX
  → /check-in?reservationId=CMN-2026-XXX
    → /waiting-room?reservationId=CMN-2026-XXX
      → /smart-ticket?reservationId=CMN-2026-XXX
```

**Cambios en `useBookingStore`:** añadir campo `reservationId: string | null`.

---

### [FIX-03] · Ruta `/customer/reservations` → 404
El Header manda a `/customer/reservations` pero la ruta real es `/(customer)/dashboard`.

**Fix:** Cambiar el Link en Header de `/customer/reservations` a `/dashboard`.

---

### [FIX-04] · Imágenes de vehículos reales
Los 6 coches del catálogo usan `placeholder.svg`. Fix en dos pasos:
1. Cambiar el `imageUrl` de `MOCK_VEHICLES` a URLs de Unsplash (como ya hace el Hero).
2. Añadir `onError` en todos los `<Image>` para fallback cuando falle la carga.

---

### [FIX-05] · Simulación de pago más coherente
El paso 3 del BookFlow (pago de 10 €) debe:
- Tras confirmar → generar `reservationId = "CMN-" + Date.now().toString(36).toUpperCase()`
- Guardarlo en el store
- Redirigir a `/booking/confirmed?id=...` (FIX-01)

---

### [FIX-06] · Validación de teléfono con PhoneInput
`contactValid` usa `phone.trim().length >= 6` sobre el valor completo que ya incluye el dial code.
Debe validar solo la parte numérica después del código de país (mínimo 6 dígitos).

**Fix en `BookFlowClient.tsx`:**
```ts
const contactValid = name.trim().length >= 2 && phone.replace(/[^\d]/g, "").length >= 8;
```

---

### [FIX-07] · BookingPanel — mínimo 1 día entre recogida y devolución
Si `returnDate <= pickupDate` → `totalDays = 0` → precio `0 €`.

**Fix:** En `BookingPanel`, deshabilitar en el calendario de devolución todos los días <= pickupDate + 1.

---

### [FIX-08] · Login — "¿Olvidaste tu contraseña?" sin destino
El link existe pero no conduce a ninguna ruta.

**Fix rápido:** Añadir `href="/forgot-password"` y crear una página simple que muestre "Funcionalidad próximamente — contacta por WhatsApp" hasta tener backend.

---

## Checklist del Sprint 5

- [ ] FIX-01 · Página `/booking/confirmed`
- [ ] FIX-02 · `reservationId` en store + query params encadenados
- [ ] FIX-03 · Link `/customer/reservations` → `/dashboard` en Header
- [ ] FIX-04 · Imágenes Unsplash en `MOCK_VEHICLES`
- [ ] FIX-05 · Generación de `reservationId` en BookFlow step 3
- [ ] FIX-06 · Validación de teléfono real
- [ ] FIX-07 · Mínimo 1 día en BookingPanel
- [ ] FIX-08 · Página `/forgot-password` placeholder
