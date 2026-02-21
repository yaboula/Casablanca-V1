# NEXUS ERP — DOC 1: Modelo de Datos Completo

> **Versión:** 1.0 · **Fecha:** 21 febrero 2026  
> **Autor:** Arquitectura NEXUS  
> **Estado:** Borrador técnico — validar antes de iniciar migraciones

---

## Índice

1. [Principios del modelo](#1-principios-del-modelo)
2. [Visión global de tablas](#2-visión-global-de-tablas)
3. [Tablas existentes — modificaciones](#3-tablas-existentes--modificaciones)
4. [Nuevas tablas por módulo](#4-nuevas-tablas-por-módulo)
   - 4.1 [Fundamentos: branches, roles extendidos, audit_log](#41-fundamentos)
   - 4.2 [POS — Punto de Venta Físico](#42-pos--punto-de-venta-físico)
   - 4.3 [Flota Avanzada — mantenimiento y alertas](#43-flota-avanzada)
   - 4.4 [Finanzas — gastos e ingresos](#44-finanzas)
   - 4.5 [RRHH — empleados y turnos](#45-rrhh)
   - 4.6 [CRM Corporativo](#46-crm-corporativo)
5. [Todos los enums del sistema](#5-todos-los-enums-del-sistema)
6. [Mapa de relaciones](#6-mapa-de-relaciones)
7. [Estrategia de índices](#7-estrategia-de-índices)
8. [Orden de migraciones](#8-orden-de-migraciones)
9. [Decisiones de diseño](#9-decisiones-de-diseño)

---

## 1. Principios del modelo

| Principio | Aplicación concreta |
|-----------|-------------------|
| **Inmutabilidad financiera** | Ningún registro de pago o ingreso se borra jamás. Solo se cancela con una contrapartida (refund, credit note). |
| **Trazabilidad total** | Todo cambio de estado queda registrado en `audit_logs` con actor, timestamp, valor anterior y nuevo. |
| **Precios siempre en céntimos** | Todos los campos monetarios son `INTEGER` en céntimos de EUR para evitar errores de coma flotante. Conversión solo en la capa de presentación. |
| **UUIDs como PKs** | Todas las tablas usan `uuid` generado en servidor. Nunca auto-increment secuencial (evita enumeración). |
| **Soft-delete por defecto** | Las entidades operacionales (vehículos, empleados, clientes) tienen `is_active`. El borrado físico solo se permite sobre entidades sin historial. |
| **Single Source of Truth** | Una sola base de datos PostgreSQL. Ni Excel, ni sistemas paralelos, ni cajas físicas off-system. |
| **JSON para datos semi-estructurados** | Campos de configuración variable (features de vehículo, metadatos de auditoría) usan `jsonb` con índices GIN solo donde se consulta. |

---

## 2. Visión global de tablas

### Tablas existentes (no se tocan la PK ni los campos actuales)

| Tabla | Estado | Cambio |
|-------|--------|--------|
| `users` | ✅ Existente | Añadir 3 campos + extender enum `user_role_enum` |
| `vehicles` | ✅ Existente | Añadir 6 campos operacionales |
| `reservations` | ✅ Existente | Añadir 4 campos + canal de venta |
| `reservation_documents` | ✅ Existente | Sin cambios |
| `chat_messages` | ✅ Existente | Sin cambios |
| `stripe_webhook_logs` | ✅ Existente | Sin cambios |

### Nuevas tablas (21 tablas nuevas)

| # | Tabla | Módulo |
|---|-------|--------|
| 1 | `branches` | Fundamentos |
| 2 | `employee_profiles` | Fundamentos / RRHH |
| 3 | `audit_logs` | Fundamentos |
| 4 | `pos_sessions` | POS |
| 5 | `pos_transactions` | POS |
| 6 | `checkin_inspections` | POS / Flota |
| 7 | `inspection_photos` | POS / Flota |
| 8 | `damage_claims` | POS / Flota |
| 9 | `maintenance_records` | Flota Avanzada |
| 10 | `vehicle_odometer_logs` | Flota Avanzada |
| 11 | `vehicle_alerts` | Flota Avanzada |
| 12 | `vehicle_documents` | Flota Avanzada |
| 13 | `expense_categories` | Finanzas |
| 14 | `expenses` | Finanzas |
| 15 | `income_records` | Finanzas |
| 16 | `finance_summaries` | Finanzas (vista materializada) |
| 17 | `work_shifts` | RRHH |
| 18 | `payroll_records` | RRHH |
| 19 | `corporate_clients` | CRM Corporativo |
| 20 | `corporate_contracts` | CRM Corporativo |
| 21 | `corporate_invoices` | CRM Corporativo |

---

## 3. Tablas existentes — modificaciones

### 3.1 `users` — Campos nuevos + Enum extendido

**Enum `user_role_enum` — versión 2:**
```
USER          → cliente final (sin cambio)
OPERATOR      → operador en aeropuerto (sin cambio)
ADMIN         → superadmin (sin cambio)
CASHIER       → ★ NUEVO — agente de mostrador (crea reservas POS, cobra)
MECHANIC      → ★ NUEVO — técnico de taller (gestiona mantenimiento)
MANAGER       → ★ NUEVO — gestor sin acceso financiero completo
```

**Campos nuevos en tabla `users`:**

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `branch_id` | `uuid` FK → `branches` | ✅ | Sucursal asignada principal |
| `avatar_url` | `varchar(500)` | ✅ | Foto de perfil (S3 key) |
| `language` | `varchar(5)` DEFAULT `'es'` | ❌ | Idioma preferido del usuario |

---

### 3.2 `vehicles` — Campos nuevos

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `license_plate` | `varchar(20)` UNIQUE | ❌ | Matrícula — obligatorio para operación real |
| `vin` | `varchar(17)` UNIQUE | ✅ | VIN/bastidor del vehículo |
| `current_mileage_km` | `integer` DEFAULT `0` | ❌ | Kilómetros actuales — actualizado en cada devolución |
| `insurance_expiry` | `date` | ✅ | Fecha vencimiento seguro — dispara alerta 30d antes |
| `itv_expiry` | `date` | ✅ | Fecha vencimiento ITV — dispara alerta 30d antes |
| `branch_id` | `uuid` FK → `branches` | ✅ | Sucursal donde está físicamente |

> **Nota:** `license_plate` y `vin` no son obligatorios en la migración para preservar datos de prueba, pero sí en producción (constraintcheck a nivel de validación).

---

### 3.3 `reservations` — Campos nuevos

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `channel` | `enum reservation_channel_enum` | ❌ DEFAULT `'ONLINE'` | Canal por donde se creó la reserva |
| `branch_id` | `uuid` FK → `branches` | ✅ | Sucursal donde se recogió el vehículo |
| `handled_by_id` | `uuid` FK → `users` | ✅ | Empleado que hizo el check-in/check-out físico |
| `corporate_client_id` | `uuid` FK → `corporate_clients` | ✅ | Si la reserva es de una empresa corporativa |

**Nuevo enum `reservation_channel_enum`:**
```
ONLINE      → reserva hecha desde la web por el cliente
POS         → reserva creada en mostrador por CASHIER/OPERATOR
CORPORATE   → reserva creada vía contrato corporativo
PHONE       → reserva creada telefónicamente por operador
```

---

## 4. Nuevas tablas por módulo

---

### 4.1 Fundamentos

#### Tabla: `branches`
Sucursales o puntos de operación de la empresa. Inicialmente habrá 1 (CMN), pero el modelo lo soporta desde el principio.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `name` | `varchar(120)` | ❌ | Nombre de la sucursal |
| `code` | `varchar(20)` UNIQUE | ❌ | Código corto, ej: `CMN-T1`, `CMN-T2` |
| `address` | `text` | ✅ | Dirección física |
| `city` | `varchar(80)` | ❌ | Ciudad |
| `phone` | `varchar(30)` | ✅ | Teléfono de la sucursal |
| `email` | `varchar(255)` | ✅ | Email de contacto |
| `is_active` | `boolean` DEFAULT `true` | ❌ | Soft-delete |
| `created_at` | `timestamptz` | ❌ | |
| `updated_at` | `timestamptz` | ❌ | |

**Índices:** `code` (UNIQUE), `is_active`

---

#### Tabla: `employee_profiles`
Perfil extendido para usuarios con roles operacionales. Relación 1:1 con `users`.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `user_id` | `uuid` FK → `users` UNIQUE | ❌ | Relación 1:1 |
| `employee_number` | `varchar(20)` UNIQUE | ❌ | Nº interno de empleado, ej: `EMP-0001` |
| `position` | `enum employee_position_enum` | ❌ | Ver enum §5 |
| `hire_date` | `date` | ❌ | Fecha de incorporación |
| `salary_eur_cents` | `integer` | ✅ | Salario mensual bruto en céntimos |
| `contract_type` | `enum contract_type_enum` | ❌ | `FULL_TIME`, `PART_TIME`, `CONTRACTOR` |
| `emergency_contact_name` | `varchar(120)` | ✅ | |
| `emergency_contact_phone` | `varchar(30)` | ✅ | |
| `notes` | `text` | ✅ | Notas internas (solo ADMIN/MANAGER) |
| `is_active` | `boolean` DEFAULT `true` | ❌ | |
| `created_at` | `timestamptz` | ❌ | |
| `updated_at` | `timestamptz` | ❌ | |

**Índices:** `user_id` (UNIQUE), `employee_number` (UNIQUE), `is_active`

---

#### Tabla: `audit_logs`
Registro inmutable de toda acción relevante en el sistema. **Nunca se borra, nunca se actualiza.**

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `actor_id` | `uuid` FK → `users` | ✅ | Quién hizo la acción (null = sistema/cron) |
| `actor_role` | `varchar(20)` | ✅ | Rol en el momento de la acción (snapshot) |
| `entity_type` | `varchar(50)` | ❌ | Nombre de tabla afectada: `reservation`, `vehicle`, `user`, etc. |
| `entity_id` | `uuid` | ❌ | ID del registro afectado |
| `action` | `enum audit_action_enum` | ❌ | Ver enum §5 |
| `old_value` | `jsonb` | ✅ | Estado anterior (solo campos cambiados) |
| `new_value` | `jsonb` | ✅ | Estado nuevo (solo campos cambiados) |
| `metadata` | `jsonb` | ✅ | Contexto adicional: `{ ip, userAgent, channel }` |
| `created_at` | `timestamptz` | ❌ | Timestamp inmutable |

**Índices:** `actor_id`, `entity_type + entity_id` (compuesto), `action`, `created_at` (para queries de rango temporal)
> ⚠️ **Sin `updated_at`** — este registro es append-only. Ningún UPDATE jamás.

---

### 4.2 POS — Punto de Venta Físico

#### Tabla: `pos_sessions`
Una sesión de caja. El CASHIER abre la caja al inicio del turno y la cierra al final.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `cashier_id` | `uuid` FK → `users` | ❌ | CASHIER o OPERATOR que abre la caja |
| `branch_id` | `uuid` FK → `branches` | ❌ | Sucursal de la sesión |
| `status` | `enum pos_session_status_enum` | ❌ | `OPEN`, `CLOSED` |
| `opening_balance_eur_cents` | `integer` DEFAULT `0` | ❌ | Efectivo inicial declarado al abrir |
| `closing_balance_eur_cents` | `integer` | ✅ | Efectivo final declarado al cerrar |
| `expected_balance_eur_cents` | `integer` | ✅ | Balance calculado por el sistema (opening + cobros en efectivo - efectivo entregado) |
| `discrepancy_eur_cents` | `integer` | ✅ | `closing - expected` — diferencia contable |
| `opened_at` | `timestamptz` | ❌ | |
| `closed_at` | `timestamptz` | ✅ | |
| `notes` | `text` | ✅ | Notas al cerrar (incidencias) |

**Índices:** `cashier_id`, `branch_id`, `status`, `opened_at`
> **Regla de negocio:** Un cashier solo puede tener 1 sesión OPEN simultánea por sucursal.

---

#### Tabla: `pos_transactions`
Todo cobro, devolución o movimiento de caja, tanto en efectivo como con datáfono.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `session_id` | `uuid` FK → `pos_sessions` | ❌ | Sesión de caja activa |
| `reservation_id` | `uuid` FK → `reservations` | ✅ | Reserva relacionada (null para gastos operativos) |
| `type` | `enum pos_transaction_type_enum` | ❌ | Ver enum §5 |
| `method` | `enum payment_method_enum` | ❌ | Ver enum §5 |
| `amount_eur_cents` | `integer` | ❌ | Siempre positivo. El tipo indica si es entrada/salida |
| `direction` | `enum transaction_direction_enum` | ❌ | `CREDIT` (entrada) o `DEBIT` (salida) |
| `reference` | `varchar(100)` | ✅ | Referencia externa (nº recibo datáfono, etc.) |
| `description` | `text` | ❌ | Descripción obligatoria para trazabilidad |
| `created_by_id` | `uuid` FK → `users` | ❌ | Empleado que registró la transacción |
| `created_at` | `timestamptz` | ❌ | |

**Índices:** `session_id`, `reservation_id`, `type`, `created_by_id`, `created_at`
> **Regla de negocio:** Ninguna transacción se borra. Las correcciones se hacen con una transacción de signo contrario (`ADJUSTMENT`) con referencia a la original en `description`.

---

#### Tabla: `checkin_inspections`
Registro fotográfico del estado del vehículo en check-in y check-out. Una por evento.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `reservation_id` | `uuid` FK → `reservations` | ❌ | |
| `type` | `enum inspection_type_enum` | ❌ | `CHECKIN` o `CHECKOUT` |
| `performed_by_id` | `uuid` FK → `users` | ❌ | Empleado que realizó la inspección |
| `mileage_km` | `integer` | ❌ | Km en el momento de la inspección |
| `fuel_level` | `enum fuel_level_enum` | ❌ | `FULL`, `THREE_QUARTERS`, `HALF`, `QUARTER`, `EMPTY` |
| `general_condition` | `enum vehicle_condition_enum` | ❌ | `EXCELLENT`, `GOOD`, `FAIR`, `POOR` |
| `damage_notes` | `text` | ✅ | Descripción de daños pre-existentes o nuevos |
| `customer_signature_key` | `varchar(500)` | ✅ | S3 key de la firma digital del cliente |
| `completed_at` | `timestamptz` | ❌ | |

**Índices:** `reservation_id`, `type`, `performed_by_id`

---

#### Tabla: `inspection_photos`
Fotos individuales asociadas a una inspección (hasta 20 por inspección).

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `inspection_id` | `uuid` FK → `checkin_inspections` CASCADE | ❌ | |
| `file_key` | `varchar(500)` | ❌ | S3 key de la foto |
| `position` | `enum car_position_enum` | ✅ | `FRONT`, `REAR`, `LEFT`, `RIGHT`, `INTERIOR`, `OTHER` |
| `sort_order` | `smallint` DEFAULT `0` | ❌ | Orden de visualización |
| `created_at` | `timestamptz` | ❌ | |

**Índices:** `inspection_id`

---

#### Tabla: `damage_claims`
Reclamaciones de daños detectados en el check-out vs check-in.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `reservation_id` | `uuid` FK → `reservations` | ❌ | |
| `checkout_inspection_id` | `uuid` FK → `checkin_inspections` | ❌ | |
| `description` | `text` | ❌ | Descripción del daño |
| `estimated_cost_eur_cents` | `integer` | ✅ | Coste estimado de reparación |
| `final_cost_eur_cents` | `integer` | ✅ | Coste final una vez reparado |
| `status` | `enum damage_claim_status_enum` | ❌ | `OPEN`, `IN_REPAIR`, `INVOICED`, `RESOLVED`, `DISPUTED` |
| `charged_to_customer` | `boolean` DEFAULT `false` | ❌ | Si se ha cobrado al cliente |
| `stripe_charge_id` | `varchar(100)` | ✅ | ID del cargo Stripe si se cobró online |
| `handled_by_id` | `uuid` FK → `users` | ❌ | Empleado responsable |
| `resolved_at` | `timestamptz` | ✅ | |
| `notes` | `text` | ✅ | |
| `created_at` | `timestamptz` | ❌ | |
| `updated_at` | `timestamptz` | ❌ | |

**Índices:** `reservation_id`, `status`, `charged_to_customer`

---

### 4.3 Flota Avanzada

#### Tabla: `maintenance_records`
Cada intervención técnica sobre un vehículo: revisión, taller, ITV, limpieza profunda, etc.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `vehicle_id` | `uuid` FK → `vehicles` | ❌ | |
| `type` | `enum maintenance_type_enum` | ❌ | Ver enum §5 |
| `status` | `enum maintenance_status_enum` | ❌ | `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `scheduled_date` | `date` | ✅ | Fecha prevista |
| `started_at` | `timestamptz` | ✅ | Cuando el vehículo entró en taller |
| `completed_at` | `timestamptz` | ✅ | Cuando el vehículo salió del taller |
| `mileage_at_service_km` | `integer` | ✅ | Km en el momento de la intervención |
| `cost_eur_cents` | `integer` | ✅ | Coste total de la intervención |
| `provider_name` | `varchar(200)` | ✅ | Nombre del taller externo (si aplica) |
| `invoice_key` | `varchar(500)` | ✅ | S3 key de la factura del taller |
| `description` | `text` | ❌ | Descripción del trabajo realizado |
| `next_service_km` | `integer` | ✅ | Km en que toca la próxima revisión (genera alerta) |
| `next_service_date` | `date` | ✅ | Fecha de la próxima revisión (genera alerta) |
| `created_by_id` | `uuid` FK → `users` | ❌ | MECHANIC o ADMIN que creó el registro |
| `created_at` | `timestamptz` | ❌ | |
| `updated_at` | `timestamptz` | ❌ | |

**Índices:** `vehicle_id`, `type`, `status`, `scheduled_date`, `completed_at`

---

#### Tabla: `vehicle_odometer_logs`
Lectura de km en cada entrega y devolución. Permite calcular km por reserva y alertas de mantenimiento.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `vehicle_id` | `uuid` FK → `vehicles` | ❌ | |
| `reservation_id` | `uuid` FK → `reservations` | ✅ | Null si es lectura manual |
| `reading_km` | `integer` | ❌ | Lectura del cuentakilómetros |
| `reading_type` | `enum odometer_reading_type_enum` | ❌ | `CHECKIN`, `CHECKOUT`, `MANUAL`, `MAINTENANCE` |
| `recorded_by_id` | `uuid` FK → `users` | ❌ | |
| `photo_key` | `varchar(500)` | ✅ | Foto del odómetro como prueba |
| `notes` | `varchar(500)` | ✅ | |
| `recorded_at` | `timestamptz` | ❌ | |

**Índices:** `vehicle_id`, `reservation_id`, `recorded_at` DESC

---

#### Tabla: `vehicle_alerts`
Alertas automáticas generadas por el sistema para vencimientos y mantenimiento.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `vehicle_id` | `uuid` FK → `vehicles` | ❌ | |
| `type` | `enum vehicle_alert_type_enum` | ❌ | `ITV_DUE`, `INSURANCE_DUE`, `OIL_DUE`, `KM_SERVICE_DUE`, `REVISION_DUE` |
| `severity` | `enum alert_severity_enum` | ❌ | `INFO` (>30d), `WARNING` (7-30d), `CRITICAL` (<7d o vencida) |
| `due_date` | `date` | ✅ | Fecha de vencimiento |
| `due_km` | `integer` | ✅ | Km en que vence (para alertas por km) |
| `message` | `varchar(500)` | ❌ | Mensaje legible para el operador |
| `is_resolved` | `boolean` DEFAULT `false` | ❌ | |
| `resolved_by_id` | `uuid` FK → `users` | ✅ | |
| `resolved_at` | `timestamptz` | ✅ | |
| `created_at` | `timestamptz` | ❌ | |

**Índices:** `vehicle_id`, `type`, `severity`, `is_resolved`, `due_date`

---

#### Tabla: `vehicle_documents`
Documentos del propio vehículo (seguro, ficha técnica, permiso circulación, etc.).

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `vehicle_id` | `uuid` FK → `vehicles` | ❌ | |
| `type` | `enum vehicle_doc_type_enum` | ❌ | `INSURANCE`, `REGISTRATION`, `ITV_CERTIFICATE`, `OTHER` |
| `file_key` | `varchar(500)` | ❌ | S3 key |
| `expiry_date` | `date` | ✅ | Para generar alertas |
| `issued_by` | `varchar(200)` | ✅ | Entidad emisora |
| `uploaded_by_id` | `uuid` FK → `users` | ❌ | |
| `created_at` | `timestamptz` | ❌ | |

**Índices:** `vehicle_id`, `type`

---

### 4.4 Finanzas

#### Tabla: `expense_categories`
Catálogo maestro de categorías de gasto. Configurable desde el panel ADMIN.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `name` | `varchar(80)` | ❌ | Ej: "Combustible", "Taller externo", "Limpieza", "Seguros" |
| `color_hex` | `varchar(7)` | ✅ | Para UI: `#3B82F6` |
| `icon` | `varchar(50)` | ✅ | Nombre del icono lucide-react |
| `is_active` | `boolean` DEFAULT `true` | ❌ | |
| `sort_order` | `smallint` DEFAULT `0` | ❌ | Orden en el UI |

---

#### Tabla: `expenses`
Todo gasto operacional de la empresa: combustible, talleres, limpieza, suministros, etc.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `category_id` | `uuid` FK → `expense_categories` | ❌ | |
| `vehicle_id` | `uuid` FK → `vehicles` | ✅ | Si el gasto es de un vehículo concreto |
| `branch_id` | `uuid` FK → `branches` | ✅ | Sucursal del gasto |
| `description` | `text` | ❌ | |
| `amount_eur_cents` | `integer` | ❌ | |
| `expense_date` | `date` | ❌ | Fecha del gasto (no necesariamente hoy) |
| `payment_method` | `enum payment_method_enum` | ❌ | `CASH`, `CARD_TERMINAL`, `BANK_TRANSFER` |
| `receipt_key` | `varchar(500)` | ✅ | S3 key del ticket/factura escaneado |
| `is_recurring` | `boolean` DEFAULT `false` | ❌ | Si es un gasto recurrente (seguro mensual, alquiler local...) |
| `approved_by_id` | `uuid` FK → `users` | ✅ | MANAGER o ADMIN que aprobó el gasto |
| `created_by_id` | `uuid` FK → `users` | ❌ | Quien registró el gasto |
| `created_at` | `timestamptz` | ❌ | |

**Índices:** `category_id`, `vehicle_id`, `expense_date`, `created_by_id`

---

#### Tabla: `income_records`
Ingresos que NO vienen de Stripe ni del POS — ventas de activos, indemnizaciones, ajustes contables.  
Los ingresos de alquiler (Stripe + POS) se cruzan vía `reservations` + `pos_transactions`.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `type` | `enum income_type_enum` | ❌ | `ASSET_SALE`, `INSURANCE_PAYOUT`, `REFUND_RECOVERY`, `OTHER` |
| `amount_eur_cents` | `integer` | ❌ | |
| `income_date` | `date` | ❌ | |
| `description` | `text` | ❌ | |
| `reference` | `varchar(100)` | ✅ | Nº de documento externo |
| `branch_id` | `uuid` FK → `branches` | ✅ | |
| `created_by_id` | `uuid` FK → `users` | ❌ | |
| `created_at` | `timestamptz` | ❌ | |

---

#### Vista Materializada: `finance_summaries`
Agregado diario de P&L. Se refresca cada noche vía cron job (BullMQ).  
**No es una tabla TypeORM** — es una PostgreSQL Materialized View con datos pre-calculados para dashboards rápidos.

```sql
-- Campos calculados:
summary_date        DATE            -- Día agregado
branch_id           UUID
total_income_eur_cents    INTEGER   -- Stripe + POS CREDIT
total_expenses_eur_cents  INTEGER   -- expenses + DEBIT pos_transactions
gross_profit_eur_cents    INTEGER   -- income - expenses
total_reservations        INTEGER   -- reservas activas/completadas ese día
avg_vehicle_occupation_pct DECIMAL  -- % flota alquilada ese día
```

---

### 4.5 RRHH

#### Tabla: `work_shifts`
Registro de turnos trabajados. Puede ser manual (ADMIN los introduce) o automático (clock-in/out desde app).

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `employee_id` | `uuid` FK → `users` | ❌ | |
| `branch_id` | `uuid` FK → `branches` | ❌ | |
| `shift_date` | `date` | ❌ | |
| `start_time` | `timetz` | ❌ | Hora inicio (con zona horaria) |
| `end_time` | `timetz` | ✅ | Null si turno no cerrado aún |
| `break_minutes` | `smallint` DEFAULT `0` | ❌ | Tiempo de descanso |
| `total_hours` | `decimal(5,2)` | ✅ | Calculado: `(end - start - break) / 60` |
| `type` | `enum shift_type_enum` | ❌ | `REGULAR`, `OVERTIME`, `ON_CALL` |
| `notes` | `varchar(500)` | ✅ | |
| `created_by_id` | `uuid` FK → `users` | ❌ | Quien registró el turno |
| `created_at` | `timestamptz` | ❌ | |

**Índices:** `employee_id + shift_date` (compuesto), `branch_id`, `shift_date`

---

#### Tabla: `payroll_records`
Registro mensual de nómina por empleado. Solo ADMIN puede crear/modificar.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `employee_id` | `uuid` FK → `users` | ❌ | |
| `period_year` | `smallint` | ❌ | Año: 2026 |
| `period_month` | `smallint` | ❌ | Mes: 1-12 |
| `base_salary_eur_cents` | `integer` | ❌ | Salario base del mes |
| `overtime_eur_cents` | `integer` DEFAULT `0` | ❌ | Horas extra |
| `deductions_eur_cents` | `integer` DEFAULT `0` | ❌ | Deducciones (seguridad social, IRPF) |
| `net_salary_eur_cents` | `integer` | ❌ | `base + overtime - deductions` |
| `status` | `enum payroll_status_enum` | ❌ | `DRAFT`, `APPROVED`, `PAID` |
| `paid_at` | `timestamptz` | ✅ | |
| `payment_reference` | `varchar(100)` | ✅ | Referencia de la transferencia bancaria |
| `created_by_id` | `uuid` FK → `users` | ❌ | |
| `created_at` | `timestamptz` | ❌ | |
| `updated_at` | `timestamptz` | ❌ | |

**Índices:** `employee_id + period_year + period_month` (UNIQUE compuesto), `status`

---

### 4.6 CRM Corporativo

#### Tabla: `corporate_clients`
Empresas con cuenta en NEXUS. Pueden tener precios pactados y facturación mensual.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `company_name` | `varchar(200)` | ❌ | Razón social |
| `trade_name` | `varchar(200)` | ✅ | Nombre comercial |
| `tax_id` | `varchar(30)` | ✅ | CIF/NIF/ICE (Marruecos) |
| `industry` | `varchar(80)` | ✅ | Sector: Turismo, Transporte, etc. |
| `contact_name` | `varchar(120)` | ❌ | Nombre del responsable de cuenta |
| `contact_email` | `varchar(255)` | ❌ | |
| `contact_phone` | `varchar(30)` | ✅ | |
| `billing_address` | `text` | ✅ | |
| `billing_email` | `varchar(255)` | ✅ | Email para enviar facturas automáticas |
| `credit_limit_eur_cents` | `integer` DEFAULT `0` | ❌ | Límite de crédito (0 = pago inmediato) |
| `payment_terms` | `enum payment_terms_enum` | ❌ | `IMMEDIATE`, `NET_15`, `NET_30`, `NET_60` |
| `default_discount_pct` | `smallint` DEFAULT `0` | ❌ | Descuento por defecto 0-100 |
| `assigned_manager_id` | `uuid` FK → `users` | ✅ | MANAGER responsable de esta cuenta |
| `is_active` | `boolean` DEFAULT `true` | ❌ | |
| `notes` | `text` | ✅ | |
| `created_at` | `timestamptz` | ❌ | |
| `updated_at` | `timestamptz` | ❌ | |

**Índices:** `tax_id`, `contact_email`, `is_active`

---

#### Tabla: `corporate_contracts`
Contrato formal vigente entre NEXUS y un cliente corporativo.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `corporate_client_id` | `uuid` FK → `corporate_clients` | ❌ | |
| `contract_number` | `varchar(40)` UNIQUE | ❌ | Ej: `NEXUS-CORP-2026-001` |
| `start_date` | `date` | ❌ | |
| `end_date` | `date` | ✅ | Null = indefinido |
| `agreed_discount_pct` | `smallint` DEFAULT `0` | ❌ | Descuento aplicado a todas las reservas del contrato |
| `max_vehicles_simultaneous` | `smallint` | ✅ | Máximo vehículos en ese momento (límite de flota asignada) |
| `billing_cycle` | `enum billing_cycle_enum` | ❌ | `MONTHLY`, `QUARTERLY`, `PER_RESERVATION` |
| `status` | `enum contract_status_enum` | ❌ | `DRAFT`, `ACTIVE`, `EXPIRED`, `CANCELLED` |
| `signed_document_key` | `varchar(500)` | ✅ | S3 key del contrato firmado escaneado |
| `created_by_id` | `uuid` FK → `users` | ❌ | |
| `created_at` | `timestamptz` | ❌ | |
| `updated_at` | `timestamptz` | ❌ | |

**Índices:** `corporate_client_id`, `contract_number` (UNIQUE), `status`

---

#### Tabla: `corporate_invoices`
Facturas generadas automáticamente para clientes corporativos según su ciclo de facturación.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `uuid` PK | — | |
| `contract_id` | `uuid` FK → `corporate_contracts` | ❌ | |
| `corporate_client_id` | `uuid` FK → `corporate_clients` | ❌ | Desnormalizado para queries rápidas |
| `invoice_number` | `varchar(40)` UNIQUE | ❌ | Ej: `INV-2026-03-001` |
| `period_start` | `date` | ❌ | |
| `period_end` | `date` | ❌ | |
| `subtotal_eur_cents` | `integer` | ❌ | Suma de reservas del periodo |
| `discount_eur_cents` | `integer` DEFAULT `0` | ❌ | Descuento aplicado |
| `tax_eur_cents` | `integer` DEFAULT `0` | ❌ | IVA/TVA |
| `total_eur_cents` | `integer` | ❌ | `subtotal - discount + tax` |
| `status` | `enum invoice_status_enum` | ❌ | `DRAFT`, `SENT`, `PAID`, `OVERDUE`, `CANCELLED` |
| `pdf_key` | `varchar(500)` | ✅ | S3 key del PDF generado |
| `sent_at` | `timestamptz` | ✅ | Cuando se envió por email |
| `paid_at` | `timestamptz` | ✅ | |
| `due_date` | `date` | ❌ | Fecha límite de pago |
| `created_by_id` | `uuid` FK → `users` | ❌ | `system` para auto-generadas, ADMIN para manuales |
| `created_at` | `timestamptz` | ❌ | |
| `updated_at` | `timestamptz` | ❌ | |

**Índices:** `contract_id`, `corporate_client_id`, `invoice_number` (UNIQUE), `status`, `due_date`

---

## 5. Todos los enums del sistema

### Enums existentes (sin cambio en nombre, solo extensión)

```typescript
// user_role_enum
USER | OPERATOR | ADMIN | CASHIER | MECHANIC | MANAGER  // ★ +3 nuevos

// vehicle_status_enum
AVAILABLE | RENTED | MAINTENANCE | INACTIVE              // sin cambio

// reservation_status_enum  
PENDING_DEPOSIT | AWAITING_CAPTURE | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED  // sin cambio
```

### Enums nuevos

```typescript
// reservation_channel_enum
ONLINE | POS | CORPORATE | PHONE

// employee_position_enum
CASHIER | MECHANIC | MANAGER | DRIVER | RECEPTIONIST | SUPERVISOR

// contract_type_enum
FULL_TIME | PART_TIME | CONTRACTOR | INTERN

// pos_session_status_enum
OPEN | CLOSED

// pos_transaction_type_enum
RENTAL_PAYMENT        // pago de alquiler
DEPOSIT_IN            // cobro de fianza
DEPOSIT_REFUND        // devolución de fianza
DAMAGE_CHARGE         // cobro por daños
EXTRA_CHARGE          // cargo adicional (combustible, limpieza extra)
EXPENSE               // gasto operativo (salida de caja)
ADJUSTMENT            // corrección contable

// payment_method_enum
CASH | CARD_TERMINAL | BANK_TRANSFER | STRIPE_ONLINE | CORPORATE_CREDIT

// transaction_direction_enum
CREDIT | DEBIT

// inspection_type_enum
CHECKIN | CHECKOUT

// fuel_level_enum
FULL | THREE_QUARTERS | HALF | QUARTER | EMPTY

// vehicle_condition_enum
EXCELLENT | GOOD | FAIR | POOR

// car_position_enum
FRONT | REAR | LEFT | RIGHT | INTERIOR | ROOF | OTHER

// damage_claim_status_enum
OPEN | IN_REPAIR | INVOICED | RESOLVED | DISPUTED

// maintenance_type_enum
OIL_CHANGE | ITV | TIRES | BRAKES | BODYWORK | CLEANING | AC_SERVICE | BATTERY | OTHER

// maintenance_status_enum
SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED

// odometer_reading_type_enum
CHECKIN | CHECKOUT | MANUAL | MAINTENANCE

// vehicle_alert_type_enum
ITV_DUE | INSURANCE_DUE | OIL_DUE | KM_SERVICE_DUE | REVISION_DUE | DOCS_EXPIRY

// alert_severity_enum
INFO | WARNING | CRITICAL

// vehicle_doc_type_enum
INSURANCE | REGISTRATION | ITV_CERTIFICATE | TECHNICAL_SHEET | OTHER

// income_type_enum
ASSET_SALE | INSURANCE_PAYOUT | REFUND_RECOVERY | GRANT | OTHER

// shift_type_enum
REGULAR | OVERTIME | ON_CALL | HOLIDAY

// payroll_status_enum
DRAFT | APPROVED | PAID

// payment_terms_enum
IMMEDIATE | NET_15 | NET_30 | NET_60

// billing_cycle_enum
MONTHLY | QUARTERLY | PER_RESERVATION

// contract_status_enum
DRAFT | ACTIVE | EXPIRED | CANCELLED

// invoice_status_enum
DRAFT | SENT | PAID | OVERDUE | CANCELLED

// audit_action_enum
CREATE | UPDATE | DELETE | STATUS_CHANGE | LOGIN | LOGOUT
PAYMENT_RECEIVED | PAYMENT_REFUNDED | DOCUMENT_UPLOADED | DOCUMENT_APPROVED
DOCUMENT_REJECTED | CHECKIN | CHECKOUT | QR_SCAN | ALERT_GENERATED
ALERT_RESOLVED | SHIFT_OPEN | SHIFT_CLOSE
```

---

## 6. Mapa de relaciones

```
branches ─────────────────────────┐
  │ 1:N vehicles                  │
  │ 1:N users (branch_id)         │
  │ 1:N pos_sessions              │
  │ 1:N reservations              │
  │ 1:N expenses                  │
  └──────────────────────────────────────────────────────┘

users
  │ 1:1 employee_profiles
  │ 1:N reservations (userId)
  │ 1:N reservations (handled_by_id)
  │ 1:N pos_sessions (cashier_id)
  │ 1:N pos_transactions (created_by_id)
  │ 1:N audit_logs (actor_id)
  │ 1:N maintenance_records (created_by_id)
  │ 1:N work_shifts (employee_id)
  │ 1:N expenses (created_by_id)
  └──────────────────────────────

vehicles
  │ 1:N reservations
  │ 1:N maintenance_records
  │ 1:N vehicle_odometer_logs
  │ 1:N vehicle_alerts
  │ 1:N vehicle_documents
  │ 1:N expenses (vehicle_id)
  └──────────────────────────────

reservations
  │ 1:N reservation_documents
  │ 1:N pos_transactions (reservation_id)
  │ 1:N checkin_inspections
  │ 1:N damage_claims
  │ 1:N chat_messages
  │ N:1 corporate_clients (corporate_client_id)
  └──────────────────────────────

pos_sessions
  │ 1:N pos_transactions
  └──────────────────────────────

checkin_inspections
  │ 1:N inspection_photos
  │ 1:N damage_claims (checkout_inspection_id)
  └──────────────────────────────

corporate_clients
  │ 1:N corporate_contracts
  │ 1:N corporate_invoices
  │ 1:N reservations
  └──────────────────────────────

corporate_contracts
  │ 1:N corporate_invoices
  └──────────────────────────────
```

---

## 7. Estrategia de índices

| Patrón de consulta | Solución |
|-------------------|---------|
| Alertas activas de un vehículo | Índice compuesto `(vehicle_id, is_resolved, severity)` |
| Transacciones de una sesión POS | Índice `session_id` + `created_at DESC` |
| Historial de mantenimiento por vehículo | Índice `(vehicle_id, scheduled_date DESC)` |
| Audit log por entidad | Índice compuesto `(entity_type, entity_id, created_at DESC)` |
| Facturas corporativas vencidas | Índice parcial `WHERE status IN ('SENT','OVERDUE')` |
| Resúmenes financieros por fecha | Vista materializada `finance_summaries` con índice `(summary_date, branch_id)` |
| Turnos de un empleado por mes | Índice compuesto `(employee_id, shift_date)` |

---

## 8. Orden de migraciones

```
Migration 007 — ExtendUserRoleEnum                 (ALTER TYPE)
Migration 008 — CreateBranchesTable
Migration 009 — ExtendUsersTable                   (añadir 3 campos)
Migration 010 — ExtendVehiclesTable                (añadir 6 campos)
Migration 011 — CreateEmployeeProfilesTable
Migration 012 — CreateAuditLogsTable
Migration 013 — CreatePosSessionsTable
Migration 014 — CreatePosTransactionsTable
Migration 015 — CreateCheckinInspectionsTable
Migration 016 — CreateInspectionPhotosTable
Migration 017 — CreateDamageClaimsTable
Migration 018 — ExtendReservationsTable            (añadir 4 campos)
Migration 019 — CreateMaintenanceRecordsTable
Migration 020 — CreateVehicleOdometerLogsTable
Migration 021 — CreateVehicleAlertsTable
Migration 022 — CreateVehicleDocumentsTable
Migration 023 — CreateExpenseCategoriesTable
Migration 024 — CreateExpensesTable
Migration 025 — CreateIncomeRecordsTable
Migration 026 — CreateWorkShiftsTable
Migration 027 — CreatePayrollRecordsTable
Migration 028 — CreateCorporateClientsTable
Migration 029 — CreateCorporateContractsTable
Migration 030 — CreateCorporateInvoicesTable
Migration 031 — CreateFinanceSummariesMaterializedView
```

> **Regla:** Las migraciones de extensión (`Extend*`) usan columnas `DEFAULT` o `nullable: true` para no romper datos existentes de prueba.

---

## 9. Decisiones de diseño

### ¿Por qué `audit_logs` y no triggers de PostgreSQL?
Los triggers de PG son más rápidos pero invisibles en el código TypeScript. Con `audit_logs` alimentado desde el servicio NestJS tenemos control total: podemos enriquecer con IP, rol, contexto de negocio. El rendimiento es suficiente para el volumen de esta operación.

### ¿Por qué `finance_summaries` como vista materializada y no tabla?
Los datos financieros agregados se calculan siempre a partir de `reservations` + `pos_transactions` + `expenses`. Una tabla duplicaría datos y podría desincronizarse. La vista materializada se refresca con `REFRESH MATERIALIZED VIEW CONCURRENTLY` cada noche sin bloquear lecturas.

### ¿Por qué `amount_eur_cents` siempre positivo con campo `direction`?
Evita errores de signo. Un `-500` en un float es ambiguo: ¿es un cobro negativo o un error? Con `amount = 500` + `direction = DEBIT` el significado es inequívoco y las sumas son triviales sin riesgo de doble negativo.

### ¿Por qué `branch_id` en `vehicles` y `reservations` si ahora solo hay una sucursal?
Costará 0 esfuerzo añadirlo ahora. Añadirlo después requeriría una migración con datos en producción y refactorizar toda la lógica de filtrado. El principio es: **si is estructuralmente correcto, modelarlo desde el principio.**

### ¿Por qué `corporate_client_id` desnormalizado en `corporate_invoices`?
`invoices` → `contracts` → `clients` es un JOIN innecesario en cada query del dashboard. Desnormalizar `corporate_client_id` directo en `invoices` es un trade-off explícito para performance de lectura. La integridad la garantiza la FK, no la aplicación.

---

*Próximo documento: **DOC 2 — Mapa de Endpoints** (todos los endpoints nuevos, agrupados por módulo, con método, ruta, roles, body y response)*
