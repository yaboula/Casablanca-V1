# Sprint 6 — "Core UX" 🟠
> **Objetivo:** Pantallas importantes incompletas. El producto funciona pero se siente a medias.
> **Prerequisito:** Sprint 5 completado.

---

## Issues a resolver

### [UX-01] · Galería de fotos en detalle de vehículo `/catalog/[vehicleId]`
Un cliente no reserva un coche premium viendo 1 sola foto.

**Lo que necesita:**
- Array de `imageUrls[]` por vehículo en `MOCK_VEHICLES` (3-5 imágenes por coche)
- Galería con imagen principal grande + thumbnails horizontales
- Swipe en mobile (Framer Motion `drag="x"`)
- Lightbox al hacer click en desktop (fullscreen overlay)

---

### [UX-02] · Filtro de disponibilidad en el catálogo
El `useBookingStore` guarda fechas pero `CatalogGrid` las ignora.

**Lo que necesita:**
- Si hay fechas seleccionadas en el store → mostrar un banner "Mostrando disponibilidad para X – Y"
- Porcentaje de "disponibilidad" por coche (campo en `MOCK_VEHICLES: availabilityRate`)
- Badge visual en las cards: "Disponible" / "Últimas unidades" / "Agotado"

---

### [UX-03] · SmartTicket respeta EUR/MAD
El balance y precios del Smart Ticket están hardcodeados en EUR.

**Fix:** Importar `useCurrencyStore` y `<Price />` en `SmartTicketClient` para mostrar el balance en la divisa activa.

---

### [UX-04] · Waiting room — flujo de rechazo completo
Cuando el documento es rechazado:
- Mostrar el motivo claramente (card de error con icono X rojo)
- Botón "Re-subir documento" que lleva de vuelta a `/check-in?reservationId=...`
- No dejar al usuario bloqueado en la pantalla sin salida

---

### [UX-05] · Dashboard personalizado
Saludar al usuario por su nombre/username.

```tsx
// Leer de la cookie de sesión
const session = getSessionFromCookie();
const username = session?.email?.split("@")[0] ?? "viajero";
// → "Hola, ahmed 👋"
```

También: si no hay reservas activas → mostrar un CTA llamativo de "Reservar tu primer coche" en vez del empty state genérico.

---

### [UX-06] · Perfil — modo edición
La página de perfil es solo lectura. Añadir:
- Botón "Editar" en cada sección
- Campos editables para nombre, email, teléfono (con `PhoneInput`)
- Toast de confirmación al guardar (mock, sin backend)
- Avatar: click para "subir foto" (mock — solo preview local)

---

### [UX-07] · Toggle mostrar/ocultar contraseña en login y registro
Input password sin botón de ojo.

**Fix:** Añadir botón `<Eye>` / `<EyeOff>` (Lucide) que toggle entre `type="password"` y `type="text"`.

---

### [UX-08] · Validación inline en formularios
Los errores solo aparecen como toasts arriba. Estándar moderno: el campo en cuestión se pone en rojo.

**Campos a validar inline:**
- Email: formato válido al perder el foco (`onBlur`)
- Contraseña: mínimo 8 caracteres con indicador de fuerza
- Nombre: mínimo 2 caracteres
- Teléfono: número válido para el país seleccionado

---

### [UX-09] · Selector de horas con medias horas
El BookingPanel muestra horas enteras (00:00, 01:00...). Los vuelos llegan a horas como 14:45.

**Fix:** Generar el array de horas con intervalos de 30 minutos:
```ts
const HOURS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});
```

---

### [UX-10] · Preview de documento subido en check-in
En `DocumentUploadStep`, al subir una imagen no se ve ningún preview.

**Fix:** Usar `URL.createObjectURL(file)` para mostrar una preview del documento antes de "confirmar" el envío.

---

## Checklist del Sprint 6

- [ ] UX-01 · Galería de fotos en detalle de vehículo
- [ ] UX-02 · Filtro y badges de disponibilidad en catálogo
- [ ] UX-03 · SmartTicket con `<Price />` component
- [ ] UX-04 · Waiting room — flujo de rechazo + re-subida
- [ ] UX-05 · Dashboard personalizado con username
- [ ] UX-06 · Perfil editable
- [ ] UX-07 · Toggle show/hide password
- [ ] UX-08 · Validación inline en formularios
- [ ] UX-09 · Horas en intervalos de 30 min
- [ ] UX-10 · Preview de imagen en DocumentUploadStep
