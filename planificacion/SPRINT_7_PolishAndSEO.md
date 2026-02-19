# Sprint 7 — "Polish & SEO" 🟡🔵
> **Objetivo:** Pulir todos los detalles. Pasar de "funciona" a "wow".
> **Prerequisito:** Sprints 5 y 6 completados.

---

## Sección A — Detalles de UX 🟡

### [POL-01] · WhatsApp FAB global (cliente)
Un botón flotante de WhatsApp visible en todas las páginas del área cliente.

**Posición:** `fixed bottom-6 right-5 z-40`
**Comportamiento:**
- Mensaje preconfigurado: `"Hola, necesito ayuda con mi reserva en NEXUS."`
- Si hay `reservationId` en el store → añadirlo al mensaje
- Animación de entrada con `spring` en Framer Motion
- Pulse verde para indicar "en línea"

---

### [POL-02] · Skeleton loaders en el catálogo
Al cargar `CatalogGrid` (y en el futuro cualquier fetch async) → mostrar skeletons de Shadcn, no pantalla en blanco.

**Componente:** `VehicleCardSkeleton` — mismas dimensiones que `VehicleCard` pero con `animate-pulse` en bloques grises.
Número de skeletons: 6 (mismo que los vehículos).

---

### [POL-03] · Empty state cuando filtro catálogo da 0 resultados
Ilustración/icono grande + texto "No hay coches disponibles para estas fechas" + CTA "Cambiar fechas".

---

### [POL-04] · Anclas del Header desde otras páginas
`/#fleet` y `/#why` solo funcionan desde la home. Desde `/catalog`, el link debería ser `/` con anchor, no `/#fleet`.

**Fix:** Cambiar `href="/#fleet"` a `href="/#fleet"` (ya correcto en HTML) — pero en el mobile menu cerrar el menú Y navegar. Verificar que `next/link` con hash funciona correctamente.

---

### [POL-05] · Confirmación visual al copiar ID de reserva
En el SmartTicket, si hay un botón o click para copiar el ID → mostrar un check animado temporal en vez de solo un toast.

---

### [POL-06] · Waiting room — posición en cola dinámica
El log "En cola de revisión (pos. 2)" debería simular que baja: pos. 2 → pos. 1 → en revisión.

```ts
setTimeout(() => updateLog("En cola de revisión (pos. 1)"), 10000);
setTimeout(() => updateLog("Tu documento está siendo revisado ahora"), 18000);
```

---

### [POL-07] · `<meta name="theme-color">` para móvil
En el `<head>` del layout:
```html
<meta name="theme-color" content="#2563EB" />
```
Hace que la barra de status del móvil sea azul Nexus.

---

### [POL-08] · SmartTicket countdown con fallback claro
Cuando `pickupDate` es null, en vez de mostrar "—", mostrar:
`"Completa tu reserva para ver el tiempo"`
con un link directo al catálogo.

---

### [POL-09] · Integrar `IntroSplash` o eliminarlo
El componente existe en `src/components/shared/IntroSplash.tsx` pero no está montado en ninguna página. O:
- Montarlo en la home (aparece 1 vez, se guarda en sessionStorage)
- O eliminarlo del proyecto para no tener código muerto

---

### [POL-10] · Imágenes con `alt` descriptivos
Todas las `<Image>` de vehículos deben tener:
```tsx
alt={`${vehicle.brand} ${vehicle.model} — alquiler CMN`}
```

---

## Sección B — SEO y metadatos 🔵

### [SEO-01] · `robots.txt` y `sitemap.xml`
```
/public/robots.txt
/public/sitemap.xml  (o generado dinámicamente en app/sitemap.ts)
```
Rutas a indexar: `/`, `/catalog`, `/catalog/[vehicleId]`.
Rutas a NO indexar: `/check-in`, `/waiting-room`, `/smart-ticket`, `/operator/*`, `/api/*`.

---

### [SEO-02] · `og:image` para compartir en WhatsApp/redes
Sin `og:image`, al compartir el link de NEXUS en WhatsApp no aparece ninguna preview.

**Crear:** `/public/og-image.png` (1200×630px) con logo + tagline + color de marca.
**Añadir a `layout.tsx`:**
```tsx
openGraph: {
  images: [{ url: "/og-image.png", width: 1200, height: 630 }]
}
```

---

### [SEO-03] · `apple-touch-icon.png` y PWA manifest mínimo
Para que al hacer "Añadir a pantalla de inicio" en iOS/Android se vea el icono correcto y el nombre "NEXUS.":
```
/public/apple-touch-icon.png  (180×180)
/public/manifest.json  (name, short_name, theme_color, icons)
```

---

### [SEO-04] · Páginas legales placeholder
`/terms` y `/privacy` — referenciadas en el formulario de registro.

Contenido mínimo: título, fecha de última actualización, párrafo de "política en construcción", botón "Volver".

---

### [SEO-05] · FAQ page
`/faq` — preguntas más comunes:
- ¿Cómo funciona el depósito de 10€?
- ¿Dónde recojo el coche en CMN?
- ¿Qué documentos necesito?
- ¿Puedo cancelar?

Formato accordion (Shadcn `Accordion`), linkeable desde el Footer y SmartTicket.

---

## Checklist del Sprint 7

**UX Polish:**
- [ ] POL-01 · WhatsApp FAB global
- [ ] POL-02 · Skeleton loaders en catálogo
- [ ] POL-03 · Empty state en catálogo filtrado
- [ ] POL-04 · Anclas del Header desde otras páginas
- [ ] POL-05 · Copy ID con check animado
- [ ] POL-06 · Cola dinámica en waiting room
- [ ] POL-07 · `theme-color` meta tag
- [ ] POL-08 · SmartTicket countdown fallback
- [ ] POL-09 · Integrar o eliminar IntroSplash
- [ ] POL-10 · Alt text en imágenes de vehículos

**SEO:**
- [ ] SEO-01 · `robots.txt` + `sitemap.xml`
- [ ] SEO-02 · `og:image` para redes sociales
- [ ] SEO-03 · `apple-touch-icon` + `manifest.json`
- [ ] SEO-04 · Páginas `/terms` y `/privacy`
- [ ] SEO-05 · Página `/faq`
