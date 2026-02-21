# User Flow Detallado - Alquiler de Coches Casablanca (Web & App)

Este diagrama representa el flujo completo del usuario, desde la reserva en casa hasta la devolución del vehículo, incluyendo la interacción con el sistema backend, Stripe y el Operario (App Staff).

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as 👤 Cliente (Web/App)
    participant Sistema as 🧠 Sistema (Backend/DB)
    participant Stripe as 💳 Stripe
    actor Operario as 👮 Operario (App Staff)

    Note over Cliente, Sistema: 🗓️ FASE 1: RESERVA & BLOQUEO (Desde Casa)
    Cliente->>Sistema: Selecciona Fechas + Vehículo
    Sistema->>Sistema: Verifica Disponibilidad (Bloqueo Pesimista)
    Sistema->>Cliente: Muestra Resumen Precio Cerrado (10€ Fianza)
    Cliente->>Stripe: Autoriza Bloqueo 10€ (SetupIntent)
    Stripe-->>Sistema: Webhook: Éxito
    Sistema->>Sistema: Crea Reserva (Status: CONFIRMED)
    Sistema->>Cliente: Email Confirmación + Link WhatsApp

    Note over Cliente, Operario: 📄 FASE 2: DIGITAL CHECK-IN (Asíncrono T-48h)
    Cliente->>Sistema: Sube Foto Pasaporte + Carnet
    Sistema->>Sistema: Guarda en S3 (Status: PENDING_REVIEW)
    Sistema->>Operario: Notificación: "Nuevos Docs Pendientes"
    
    Note right of Operario: EFECTO "MAGO DE OZ" 🧙‍♂️ / VALIDACIÓN
    Operario->>Sistema: Revisa Documentos manualmente
    alt Documentos OK
        Operario->>Sistema: Aprueba Documentos (Status: APPROVED)
        Sistema-->>Cliente: Notificación Push/Email: "Ready to Drive ✅"
        Sistema->>Cliente: Genera QR de Recogida Único
    else Documentos Rechazados
        Operario->>Sistema: Rechaza (Status: ACTION_REQUIRED)
        Sistema-->>Cliente: Notificación Crítica: "Resubir Foto (Borrosa/Caducada)"
        Cliente->>Sistema: Resube Documentos (Bucle)
    end
    
    Note over Cliente, Operario: ✈️ FASE 3: LLEGADA A CASABLANCA (Tiempo Real)
    Cliente->>Operario: WhatsApp: "He aterrizado" 🛬
    Operario->>Operario: Consulta Dashboard "Entregas Hoy"
    Operario->>Cliente: WhatsApp: "Te espero en Puerta 2"
    
    Note right of Operario: INTERACCIÓN FÍSICA & FALLBACKS 🤝
    alt Cliente tiene QR y Batería
        Cliente->>Operario: Muestra QR de Recogida
        Operario->>Sistema: Escanea QR con App Staff
    else Fallback (Sin Batería/Red)
        Cliente->>Operario: Da Nombre/Matrícula
        Operario->>Sistema: Búsqueda Manual en App
    end

    Sistema->>Operario: Valida Reserva y Muestra Datos
    Note right of Operario: Muestra "COBRAR: 790€" (Balance)
    
    Operario->>Operario: Graba Video Estado Coche (30s)
    bucket Operario: Background Upload (Si red lenta)
    Operario->>Sistema: Sube Video de Entrega (Async)
    
    Operario->>Cliente: Cobra Restante (Efectivo/TPV)
    Operario->>Sistema: Marca Reserva: IN_PROGRESS
    Operario->>Cliente: Entrega Llaves + SIM + Tag Jawaz

    Note over Cliente, Sistema: 🚗 FASE 4: DEVOLUCIÓN (Drop & Go)
    Cliente->>Operario: WhatsApp: "Llego en 30 min" 📍
    Operario->>Cliente: Espera en Salidas T2
    Operario->>Cliente: Revisión Rápida + Cobro Peajes Jawaz
    Operario->>Sistema: Marca Reserva: COMPLETED
    Sistema->>Stripe: Libera Bloqueo 10€ (o captura si hubo incidencia)
    Sistema->>Cliente: Email: "Gracias y Buen Viaje"
```
