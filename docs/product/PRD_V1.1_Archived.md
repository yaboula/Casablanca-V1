# PRD: MVP V1.0 - Alquiler de Coches Premium (Casablanca)

**Documento de Definición de Producto | Fase:** Lanzamiento Inicial

## 1. Visión y Objetivo del Producto

* **Visión:** Redefinir la experiencia de alquiler de vehículos en Marruecos transformándola de una transacción estresante a un servicio de "conserjería de movilidad" sin fricción, basándonos en la confianza absoluta, la conectividad inmediata y la transparencia financiera.
* **Objetivo del MVP:** Lanzar una plataforma híbrida (Reserva Web + Operativa Física vía WhatsApp) capaz de captar clientes internacionales que aterrizan en el aeropuerto de Casablanca (CMN), validando el modelo de negocio con un tiempo de espera en la entrega del vehículo garantizado de **0 minutos** y asegurando *Unit Economics* positivos desde el primer alquiler.

## 2. Target (Público Objetivo)

* **Perfil:** Viajeros internacionales (turismo y negocios) que aterrizan en el Aeropuerto Internacional Mohammed V (Casablanca).
* **Puntos de dolor actuales:** Miedo a estafas locales, frustración por franquicias ocultas o bloqueos altísimos en tarjetas de crédito, largas colas tras un vuelo pesado, falta de conectividad móvil (roaming caro) al llegar al país, y estrés por no saber cómo funcionan los peajes locales.

## 3. Non-Goals (Fuera de Alcance para el MVP)

*Para garantizar que salimos a producción rápido, el equipo técnico **NO** desarrollará:*

* **Integración de API de Vuelos:** La gestión de retrasos se hará manualmente vía WhatsApp por el operario en esta fase.
* **Producción de Vídeo "Anti-Stock":** Usaremos fotos reales de los coches bien iluminadas, pero sin producción de vídeo en la cabecera por ahora.
* **Desarrollo Nativo Puro (Swift/Kotlin):** NO haremos dos aplicaciones por separado. En su lugar, desarrollaremos UNA sola aplicación multiplataforma (React Native) basada en roles (Cliente / Operario) para optimizar recursos.
* **Telemetría y GPS en Tiempo Real Web:** No mostraremos mapas en vivo de dónde está el coche en la web.
* **Algoritmo de Precios Dinámicos (Dynamic Pricing):** Los precios serán fijos o gestionados manualmente en el backend según la temporada.

---

## 4. Historias de Usuario (User Stories) Core - PARTE A

### A) Fase de Reserva Web (Baja Fricción y Conversión)

* **US-W1 (Navegación y Propuesta de Valor):** * *Como* viajero internacional,
* *Quiero* ver claramente en la web (Landing Page) que el alquiler incluye una SIM de 5GB gratis, el Tag de peaje Jawaz y un seguro real sin franquicias ocultas,
* *Para* decidir instantáneamente que esta opción es superior a las agencias tradicionales.


* **US-W2 (Resumen de Reserva Claro):** * *Como* usuario,
* *Quiero* visualizar un desglose de precio 100% cerrado al seleccionar mis fechas,
* *Para* tener la tranquilidad de que no habrá costes sorpresa en el mostrador.


* **US-W3 (Checkout de Riesgo Cero - Integración Stripe):** * *Como* usuario en la pasarela de pago,
* *Quiero* confirmar mi reserva autorizando únicamente un bloqueo/tokenización de 10€ en mi tarjeta, con la promesa explícita de pagar el resto en la entrega,
* *Para* minimizar mi riesgo financiero y completar la reserva sin dudarlo.


* **US-W4 (Confirmación y Redirección al Canal de Soporte):** * *Como* usuario que acaba de reservar,
* *Quiero* recibir un email automático con un enlace directo a nuestro WhatsApp corporativo,
* *Para* tener guardado el contacto de mi "Conserje Local" inmediatamente.

### B) Fase Pre-Vuelo (Cero Papel y Onboarding Biométrico)

*El objetivo aquí es trasladar el aburrido proceso de mostrador al sofá de la casa del cliente, días antes de volar.*

* **US-PV1 (Escaneo Simulado en App):** * *Como* cliente,
* *Quiero* usar la cámara integrada en la App para escanear mi pasaporte y carnet viendo un mensaje de "Validando seguridad...",
* *Para* sentir que el proceso es automático, tecnológico y seguro.

* **US-PV2 (Validación Manual Backend):** * *Como* admin/operario,
* *Quiero* recibir esas fotos en mi panel/app interna para validarlas visualmente (Mago de Oz) y pulsar "Aprobar",
* *Para* ahorrar costes de APIs biométricas en esta fase inicial.

* **US-PV3 (Recordatorio Automático T-24h):** * *Como* sistema backend,
* *Quiero* enviar un WhatsApp/Email automático 24 horas antes del vuelo a los clientes que aún no han subido su documentación,
* *Para* garantizar que el 100% de los clientes lleguen al aeropuerto con el trámite hecho.

### C) Fase Operativa en Marruecos (Entrega, Soporte y Drop & Go)

*El objetivo aquí es la ejecución física perfecta. Todo fluye a través de WhatsApp y el contacto humano es rápido y premium.*

* **US-OP1 (El "Ping" de Aterrizaje):** * *Como* cliente que acaba de aterrizar y encender su móvil en CMN,
* *Quiero* recibir o enviar un WhatsApp rápido a mi "Conserje",
* *Para* saber exactamente en qué punto de la terminal de llegadas me está esperando el coche sin tener que buscar mostradores.

* **US-OP2 (Entrega Física, Pago y Kit Explorador):** * *Como* operario en el aeropuerto,
* *Quiero* comprobar visualmente que la cara del cliente coincide con el pasaporte verificado, cobrar el importe total restante (en efectivo o TPV físico), y entregarle las llaves junto con el coche que ya tiene el Tag Jawaz instalado y la SIM de 5GB,
* *Para* completar la entrega en menos de 5 minutos cronometrados.

* **US-OP3 (Soporte en Ruta - "El Fixer"):** * *Como* cliente conduciendo por Marruecos,
* *Quiero* poder escribir al mismo número de WhatsApp ante cualquier duda (peajes, aparcamiento, pinchazos),
* *Para* sentirme respaldado y seguro en un país desconocido.

* **US-OP4 (Devolución VIP "Drop & Go"):** * *Como* cliente conduciendo de vuelta al aeropuerto,
* *Quiero* compartir mi "Ubicación en Tiempo Real" por WhatsApp 30 minutos antes de llegar,
* *Para* que el operario me espere a pie de acera en la Terminal de Salidas, recoja las llaves, me cobre en efectivo los peajes de Jawaz consumidos, y yo pueda entrar directo a mi vuelo en 60 segundos.

### Nueva Sub-sección en Fase C: Operativa del Staff (App Interna)

*Se añade el uso de la App por parte de nuestro equipo.*

* **US-OP-STAFF1 (Dashboard Operario):** * *Como* operario logueado en la App,
* *Quiero* ver la lista de coches a entregar hoy en CMN con sus estados de validación,
* *Para* organizar mi trabajo en el aeropuerto.

* **US-OP-STAFF2 (Flujo de Entrega y Vídeo):** * *Como* operario,
* *Quiero* usar la App para escanear el QR del cliente, grabar el vídeo de 30 segundos de daños y marcar el coche como "Entregado",
* *Para* que todo quede registrado en la base de datos al instante.
