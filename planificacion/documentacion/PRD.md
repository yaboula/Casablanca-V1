# PRD V2.0: MVP Plataforma Unificada "Alquiler de Coches Casablanca"

## 1. Visión y Estrategia Unificada
* **Producto:** Plataforma Web Responsiva (Next.js) optimizada para Mobile-First pero con experiencia premium en Escritorio.
* **Filosofía:** "Hazlo donde quieras". El proceso de reserva y el embarque (subida de documentos) son accesibles desde cualquier navegador, en cualquier dispositivo, sin necesidad de instalar nada.

## 2. Historias de Usuario (Flujo Unificado)

### A) Fase de Reserva e Incorporación (Web o App)
* **US-1 (Reserva de Baja Fricción):** El usuario selecciona coche y fechas. Solo se congela 10€ vía Stripe. El diseño debe aclarar que los 10€ son fianza/gestión, no el pago total.
* **US-2 (Check-in digital y Estados):** Tras reservar, el usuario sube fotos. El sistema debe gestionar tres estados visuales claros:
    1.  **En Revisión:** Bloqueo de seguridad que genera confianza. 
    2.  **Aprobado:** Check verde, tranquilidad antes de volar.
    3.  **Acción Requerida (Rechazado):** Notificación crítica con botón para reintentar (foto borrosa/caducado).
* **US-3 (Estado de Validación):** El sistema muestra "Pendiente de revisión" (Efecto Mago de Oz), generando confianza de proceso de seguridad.

### B) Fase Operativa (Staff Dashboard — Ruta Protegida `/staff`)
* **US-4 (Gestión de Entregas y Pagos):** El operador ve las entregas del día. La interfaz destaca el **"Balance Pendiente"** (Ej: "Cobrar 790€ en efectivo") y desglose de impuestos locales (MAD).
* **US-5 (Validación, Entrega y Fallbacks):** 
    *   **Flujo Principal:** Escaneo de QR y validación biométrica manual.
    *   **Fallback:** Si falla el escaneo, búsqueda manual por matrícula o teléfono.
    *   **Modo Offline/Latencia:** La subida del vídeo de 30s de daños se realiza en **Background**. La App confirma "Capturado" localmente para no detener al cliente, y sincroniza cuando la red lo permite.


## 3. Especificaciones Técnicas (Basadas en RFC)
* **Base de datos:** Centralizada. Los roles (USER, OPERATOR) definen qué funciones están autorizadas en la interfaz.
* **Núcleo de Entidades:** User, Vehicle, Reservation, Document.
* **Infraestructura:** Un Backend Único (Cerebro) que sirve a la Web Responsiva. El operario accede al Staff Dashboard desde el navegador de su móvil en la ruta protegida `/staff`.

## 4. No-Objetivos (Lo que NO haremos)
* No habrá aplicación nativa (React Native / iOS / Android). Todo ocurre en el navegador web.
* No habrá notificaciones Push nativas de App. Las alertas críticas se envían por Email o WhatsApp.
* No habrá proceso de IA para documentos; la validación la hace el operador desde el Staff Dashboard (`/staff`).
