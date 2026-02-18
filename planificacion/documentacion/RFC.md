# RFC: Arquitectura Técnica - MVP V1.0 (Alquiler Premium Casablanca)

**Estado:** Aprobado | **Fecha:** 18 Febrero 2026 | **Enfoque:** Next.js Web App Responsiva & Operativa "Mago de Oz"

Este documento define la arquitectura técnica para una única plataforma web (Next.js App Router) accesible desde cualquier navegador. Los clientes reservan desde la web pública; el operario gestiona entregas desde la ruta protegida `/staff` en el mismo dominio, sin necesidad de instalar ninguna aplicación nativa.

---

### 1. Diseño de Base de Datos (TypeORM ERD)

Al usar una única app con base en roles, centralizamos la autenticación y vinculamos las operaciones físicas a los usuarios del staff. Aquí tienes las entidades clave para TypeORM:

* **`User` (Usuarios y Staff)**
    * `id` (UUID, Primary Key)
    * `email` (VARCHAR, Unique)
    * `password_hash` (VARCHAR)
    * `full_name` (VARCHAR)
    * `phone_number` (VARCHAR) - *Crítico para el soporte y coordinación en ruta vía WhatsApp*.
    * `role` (ENUM: `'USER'`, `'OPERATOR'`, `'ADMIN'`) - *Soporta la arquitectura de roles en la web única*.

* **`Vehicle` (Flota)**
    * `id` (UUID, Primary Key)
    * `license_plate` (VARCHAR, Unique)
    * `model` (VARCHAR) - *Ej. "Audi A4"*
    * `jawaz_tag_id` (VARCHAR) - *Referencia al Tag de peaje que prometemos en la Landing Page*.
    * `sim_card_number` (VARCHAR) - *Referencia a la SIM de 5GB incluida*.
    * `status` (ENUM: `'AVAILABLE'`, `'MAINTENANCE'`, `'RETIRED'`)

* **`Document` (Onboarding Biométrico Pre-Vuelo)**
    * `id` (UUID, Primary Key)
    * `user_id` (UUID, Foreign Key -> `User.id`)
    * `type` (ENUM: `'PASSPORT'`, `'DRIVING_LICENSE'`)
    *   `file_key` (VARCHAR) - *Key del objeto en S3. El backend generará Presigned URLs temporales para su visualización segura*.
    * `status` (ENUM: `'PENDING_REVIEW'`, `'APPROVED'`, `'REJECTED'`)
    * `reviewed_by` (UUID, Foreign Key -> `User.id`, Nullable) - *El operario que hizo la validación manual*.
    * `reviewed_at` (TIMESTAMPTZ, Nullable)

* **`Reservation` (El Núcleo)**
    * `id` (UUID, Primary Key)
    * `user_id` (UUID, Foreign Key -> `User.id`)
    * `vehicle_id` (UUID, Foreign Key -> `Vehicle.id`)
    * `start_time` (TIMESTAMPTZ)
    * `end_time` (TIMESTAMPTZ)
    * `status` (ENUM: `'PENDING_DEPOSIT'`, `'CONFIRMED'`, `'IN_PROGRESS'`, `'COMPLETED'`, `'CANCELLED'`)
    * `total_price` (DECIMAL) - *El precio cerrado sin sorpresas*.
    * `stripe_payment_intent_id` (VARCHAR) - *Referencia al bloqueo de 10€*.
    * `qr_code_hash` (VARCHAR) - *Hash para generar el QR que el operario escaneará en la entrega*.
    * `delivery_video_url` (VARCHAR, Nullable) - *URL del vídeo de 30 segundos grabado por el operario registrando daños*.

---

### 2. Contratos de la API (REST Endpoints)

Estos contratos guiarán el desarrollo del Frontend (Next.js Web App). Todos los endpoints protegidos requerirán un token JWT en la cabecera `Authorization: Bearer <token>`.

**Módulo: Auth**

* `POST /api/v1/auth/register`
    * *Body:* `{ email, password, full_name, phone_number }`
* `POST /api/v1/auth/login`
    * *Body:* `{ email, password }`
    * *Response:* `{ access_token, user: { id, role, ... } }`

**Módulo: Reservations**

* `POST /api/v1/reservations`
    * *Auth:* JWT (`USER`)
    * *Body:* `{ vehicle_id, start_time, end_time }`
    * *Response:* `{ reservation_id, client_secret }` - *Devolvemos el secreto de Stripe para que el frontend procese el bloqueo de 10€ de riesgo cero*.

* `GET /api/v1/reservations/me`
    * *Auth:* JWT (`USER`)
    * *Response:* Lista de reservas del cliente y estado del QR.

**Módulo: Documents (Pre-Vuelo)**

* `POST /api/v1/documents/upload`
    * *Auth:* JWT (`USER`)
    * *Body:* `multipart/form-data` (archivo de imagen y tipo de documento).
    * *Response:* `{ document_id, status: 'PENDING_REVIEW' }` - *Esto simula el escaneo automatizado en la UI del cliente*.

**Módulo: Operator (Operativa en CMN y Mago de Oz)**

* `GET /api/v1/operator/documents/pending`
    * *Auth:* JWT (`OPERATOR`)
    * *Response:* Lista de pasaportes y carnets esperando validación manual.

* `PATCH /api/v1/operator/documents/:id/validate`
    * *Auth:* JWT (`OPERATOR`)
    * *Body:* `{ status: 'APPROVED' | 'REJECTED', notes?: string }`

* `GET /api/v1/operator/deliveries/today`
    * *Auth:* JWT (`OPERATOR`)
    * *Response:* Dashboard con la lista de coches a entregar en CMN hoy, incluyendo su estado de validación documental.

* `POST /api/v1/operator/reservations/:id/deliver`
    * *Auth:* JWT (`OPERATOR`)
    * *Body:* `multipart/form-data` (vídeo de 30 segundos) + `{ qr_code_scanned: string, remaining_amount_collected: boolean }`
    * *Response:* Cambia la reserva a `'IN_PROGRESS'` tras la entrega física en menos de 5 minutos.

---

### 3. Ajuste de Concurrencia: ¿Cambia el Bloqueo Pesimista?

La respuesta corta y directa es: **No, no cambia absolutamente nada a nivel de arquitectura de base de datos.**

El Bloqueo Pesimista (`SELECT ... FOR UPDATE`) que diseñamos protege el **inventario físico** (el coche y sus fechas), independientemente de la carga financiera de la transacción.

El flujo sigue siendo el mismo:

1. El usuario selecciona las fechas y el vehículo.
2. Iniciamos la transacción en PostgreSQL y bloqueamos la fila del coche.
3. Comprobamos que no hay solapamientos de fechas.
4. Creamos la reserva con estado `'PENDING_DEPOSIT'`.
5. Hacemos *commit* para liberar la fila del coche instantáneamente.
6. Pedimos a Stripe que tokenice/bloquee los 10€.
7. A los 15 minutos, nuestro *Worker* de BullMQ revisa si el Webhook de Stripe llegó. Si Stripe no pudo bloquear los 10€ en la tarjeta del cliente, cancelamos la reserva y liberamos el coche. Si tuvo éxito, pasa a `'CONFIRMED'`.

La única diferencia para ti como programador está en la llamada a la API de Stripe: en lugar de crear un `PaymentIntent` para cobrar 800€, crearás un `SetupIntent` (o un `PaymentIntent` con `capture_method: 'manual'`) por valor de 10€. La robustez de nuestra protección contra el *overbooking* permanece intacta.
