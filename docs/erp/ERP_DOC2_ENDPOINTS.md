# NEXUS ERP — DOC 2: Mapa Completo de Endpoints

> **Versión:** 1.0 · **Fecha:** 21 febrero 2026  
> **Basado en:** DOC 1 (modelo de datos) + controllers existentes analizados  
> **Prefijo global:** `/api/v1`

---

## Índice

1. [Leyenda y convenciones](#1-leyenda-y-convenciones)
2. [Endpoints existentes — referencia rápida](#2-endpoints-existentes--referencia-rápida)
3. [Nuevos endpoints por módulo](#3-nuevos-endpoints-por-módulo)
   - 3.1 [Branches — Sucursales](#31-branches--sucursales)
   - 3.2 [Employees — Personal](#32-employees--personal)
   - 3.3 [Audit Log](#33-audit-log)
   - 3.4 [POS — Punto de Venta Físico](#34-pos--punto-de-venta-físico)
   - 3.5 [Inspections — Check-in fotográfico](#35-inspections--check-in-fotográfico)
   - 3.6 [Damage Claims — Reclamaciones](#36-damage-claims--reclamaciones)
   - 3.7 [Fleet — Flota avanzada](#37-fleet--flota-avanzada)
   - 3.8 [Finance — Finanzas](#38-finance--finanzas)
   - 3.9 [HRM — RRHH](#39-hrm--rrhh)
   - 3.10 [CRM — Clientes Corporativos](#310-crm--clientes-corporativos)
   - 3.11 [Analytics — Dashboard ejecutivo](#311-analytics--dashboard-ejecutivo)
4. [Extensiones de endpoints existentes](#4-extensiones-de-endpoints-existentes)
5. [Matriz de permisos por rol](#5-matriz-de-permisos-por-rol)
6. [Convenciones de respuesta](#6-convenciones-de-respuesta)
7. [Convenciones de errores](#7-convenciones-de-errores)

---

## 1. Leyenda y convenciones

### Roles (de menor a mayor privilegio)
```
USER        → cliente final
CASHIER     → agente de mostrador
MECHANIC    → técnico de taller
OPERATOR    → operador aeropuerto
MANAGER     → gestor de sucursal
ADMIN       → superadmin total
```

### Notación de roles en tablas
```
🔓 PUBLIC      → sin autenticación
🔑 AUTH        → cualquier usuario autenticado
👤 USER+       → USER o superior
💼 CASHIER+    → CASHIER, OPERATOR, MANAGER, ADMIN
🔧 MECHANIC+   → MECHANIC, MANAGER, ADMIN
👁 OPERATOR+   → OPERATOR, MANAGER, ADMIN
📊 MANAGER+    → MANAGER, ADMIN
👑 ADMIN       → solo ADMIN
```

### Formato de rutas
```
Colección:   GET    /recurso
Crear:       POST   /recurso
Leer uno:    GET    /recurso/:id
Actualizar:  PATCH  /recurso/:id
Borrar:      DELETE /recurso/:id
Acción:      POST   /recurso/:id/accion   (verbos como "approve", "close", etc.)
```

---

## 2. Endpoints existentes — referencia rápida

> No se modifican. Documentados para contexto.

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/auth/register` | 🔓 PUBLIC | Registro de nuevo usuario |
| POST | `/auth/login` | 🔓 PUBLIC | Login, devuelve JWT |
| POST | `/auth/refresh` | 🔓 PUBLIC | Renovar access token |
| GET | `/auth/me` | 🔑 AUTH | Usuario actual |
| GET | `/users/me` | 🔑 AUTH | Perfil del usuario |
| PATCH | `/users/me` | 🔑 AUTH | Actualizar teléfono |
| GET | `/vehicles` | 🔓 PUBLIC | Catálogo con disponibilidad por fechas |
| GET | `/vehicles/:id` | 🔓 PUBLIC | Detalle de un vehículo |
| POST | `/reservations` | 🔑 AUTH | Crear reserva + Stripe PI |
| GET | `/reservations/my` | 🔑 AUTH | Mis reservas |
| GET | `/reservations/:id` | 🔑 AUTH | Detalle reserva |
| PATCH | `/reservations/:id/cancel` | 🔑 AUTH | Cancelar reserva |
| POST | `/documents/presign` | 🔑 AUTH | Presigned URL S3 para subir doc |
| POST | `/documents/confirm` | 🔑 AUTH | Confirmar doc subido a S3 |
| GET | `/documents/:reservationId` | 🔑 AUTH | Documentos de una reserva |
| GET | `/operator/deliveries` | 👁 OPERATOR+ | Entregas del día |
| POST | `/operator/delivery/:id/scan-qr` | 👁 OPERATOR+ | Escanear QR check-in |
| PATCH | `/operator/delivery/:id/checkin` | 👁 OPERATOR+ | Check-in manual |
| GET | `/operator/search` | 👁 OPERATOR+ | Buscar reservas/clientes |
| GET | `/admin/stats` | 👑 ADMIN | KPIs generales |
| GET | `/admin/users` | 👑 ADMIN | Listar usuarios |
| PATCH | `/admin/users/:id` | 👑 ADMIN | Cambiar rol/estado usuario |
| GET | `/admin/vehicles` | 👑 ADMIN | Todos los vehículos |
| POST | `/admin/vehicles` | 👑 ADMIN | Crear vehículo |
| PATCH | `/admin/vehicles/:id` | 👑 ADMIN | Actualizar vehículo |
| DELETE | `/admin/vehicles/:id` | 👑 ADMIN | Soft-delete vehículo |
| DELETE | `/admin/vehicles/:id/permanent` | 👑 ADMIN | Hard-delete vehículo |
| GET | `/sse/reservation/:id` | 🔑 AUTH | Stream SSE de una reserva |
| GET | `/health` | 🔓 PUBLIC | Health check |

---

## 3. Nuevos endpoints por módulo

---

### 3.1 Branches — Sucursales

**Controller:** `BranchesController` · **Prefijo:** `/branches`

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 1 | GET | `/branches` | 📊 MANAGER+ | Listar todas las sucursales |
| 2 | GET | `/branches/:id` | 📊 MANAGER+ | Detalle de una sucursal |
| 3 | POST | `/branches` | 👑 ADMIN | Crear sucursal |
| 4 | PATCH | `/branches/:id` | 👑 ADMIN | Actualizar sucursal |
| 5 | DELETE | `/branches/:id` | 👑 ADMIN | Soft-delete (is_active = false) |

**POST `/branches` — Body:**
```json
{
  "name": "CMN Terminal 1",
  "code": "CMN-T1",
  "address": "Aéroport Mohammed V, Terminal 1",
  "city": "Casablanca",
  "phone": "+212522539040",
  "email": "cmn-t1@nexus.ma"
}
```

**GET `/branches` — Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "CMN Terminal 1",
      "code": "CMN-T1",
      "city": "Casablanca",
      "isActive": true,
      "vehicleCount": 12,
      "activeReservations": 3
    }
  ],
  "total": 1
}
```

---

### 3.2 Employees — Personal

**Controller:** `EmployeesController` · **Prefijo:** `/employees`

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 6 | GET | `/employees` | 📊 MANAGER+ | Listar empleados con paginación y filtros |
| 7 | GET | `/employees/:id` | 📊 MANAGER+ | Perfil completo de un empleado |
| 8 | POST | `/employees` | 👑 ADMIN | Crear perfil de empleado (user debe existir) |
| 9 | PATCH | `/employees/:id` | 👑 ADMIN | Actualizar datos del empleado |
| 10 | DELETE | `/employees/:id` | 👑 ADMIN | Soft-delete (is_active = false) |
| 11 | GET | `/employees/:id/activity` | 📊 MANAGER+ | Historial de operaciones del empleado |
| 12 | GET | `/employees/:id/shifts` | 📊 MANAGER+ | Turnos del empleado (mes actual por defecto) |

**GET `/employees?page=1&limit=20&branchId=uuid&position=CASHIER&isActive=true`**

**POST `/employees` — Body:**
```json
{
  "userId": "uuid-del-user-existente",
  "employeeNumber": "EMP-0001",
  "position": "CASHIER",
  "hireDate": "2026-01-15",
  "salaryEurCents": 180000,
  "contractType": "FULL_TIME",
  "emergencyContactName": "Fatima B.",
  "emergencyContactPhone": "+212612345678"
}
```

**Response estándar de empleado:**
```json
{
  "data": {
    "id": "uuid",
    "employeeNumber": "EMP-0001",
    "position": "CASHIER",
    "hireDate": "2026-01-15",
    "contractType": "FULL_TIME",
    "isActive": true,
    "user": {
      "id": "uuid",
      "fullName": "Ahmed Benali",
      "email": "ahmed@nexus.ma",
      "role": "CASHIER",
      "phone": "+212612345678"
    }
  }
}
```

---

### 3.3 Audit Log

**Controller:** `AuditController` · **Prefijo:** `/audit`

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 13 | GET | `/audit` | 👑 ADMIN | Historial completo con filtros |
| 14 | GET | `/audit/entity/:type/:id` | 📊 MANAGER+ | Historial de un registro concreto |
| 15 | GET | `/audit/actor/:userId` | 👑 ADMIN | Todas las acciones de un usuario |

**GET `/audit?page=1&limit=50&action=STATUS_CHANGE&entityType=reservation&from=2026-02-01&to=2026-02-28`**

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "actor": { "id": "uuid", "fullName": "Carmen L.", "role": "OPERATOR" },
      "entityType": "reservation",
      "entityId": "uuid",
      "action": "STATUS_CHANGE",
      "oldValue": { "status": "CONFIRMED" },
      "newValue": { "status": "IN_PROGRESS" },
      "metadata": { "ip": "192.168.1.10", "channel": "POS" },
      "createdAt": "2026-02-19T10:30:00Z"
    }
  ],
  "total": 248,
  "page": 1,
  "limit": 50
}
```

---

### 3.4 POS — Punto de Venta Físico

**Controller:** `PosController` · **Prefijo:** `/pos`

#### Sesiones de caja

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 16 | POST | `/pos/sessions/open` | 💼 CASHIER+ | Abrir sesión de caja |
| 17 | GET | `/pos/sessions/current` | 💼 CASHIER+ | Sesión activa del empleado actual |
| 18 | POST | `/pos/sessions/:id/close` | 💼 CASHIER+ | Cerrar sesión (requiere balance de cierre) |
| 19 | GET | `/pos/sessions` | 📊 MANAGER+ | Historial de sesiones (filtros por fecha/sucursal) |
| 20 | GET | `/pos/sessions/:id` | 📊 MANAGER+ | Detalle de una sesión con todas sus transacciones |

**POST `/pos/sessions/open` — Body:**
```json
{
  "branchId": "uuid",
  "openingBalanceEurCents": 20000
}
```

**POST `/pos/sessions/:id/close` — Body:**
```json
{
  "closingBalanceEurCents": 47500,
  "notes": "Todo correcto. 3 pagos en efectivo."
}
```

**GET `/pos/sessions/:id` — Response:**
```json
{
  "data": {
    "id": "uuid",
    "cashier": { "id": "uuid", "fullName": "Omar K." },
    "branch": { "id": "uuid", "name": "CMN Terminal 1" },
    "status": "CLOSED",
    "openingBalanceEurCents": 20000,
    "closingBalanceEurCents": 47500,
    "expectedBalanceEurCents": 46800,
    "discrepancyEurCents": 700,
    "openedAt": "2026-02-19T08:00:00Z",
    "closedAt": "2026-02-19T20:15:00Z",
    "transactions": [...],
    "transactionSummary": {
      "totalCredits": 58000,
      "totalDebits": 11200,
      "byMethod": {
        "CASH": 27500,
        "CARD_TERMINAL": 30500
      }
    }
  }
}
```

#### Reservas POS (mostrador)

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 21 | POST | `/pos/reservations` | 💼 CASHIER+ | Crear reserva desde mostrador (sin Stripe) |
| 22 | POST | `/pos/reservations/:id/charge` | 💼 CASHIER+ | Registrar cobro de una reserva en sesión activa |
| 23 | POST | `/pos/reservations/:id/checkout` | 👁 OPERATOR+ | Devolución del vehículo en mostrador |

**POST `/pos/reservations` — Body:**
```json
{
  "vehicleId": "uuid",
  "pickupDate": "2026-02-22T10:00:00Z",
  "returnDate": "2026-02-25T10:00:00Z",
  "pickupLocation": "CMN_T1",
  "customerName": "Julien Dupont",
  "customerPhone": "+33612345678",
  "customerEmail": "j.dupont@email.com",
  "paymentMethod": "CASH",
  "corporateClientId": null
}
```

> **Diferencias con reserva online:**
> - No crea Stripe Payment Intent
> - El estado inicial es directamente `CONFIRMED` (pago cobrado en mostrador)
> - Requiere sesión POS activa del cashier
> - Genera `pos_transaction` automáticamente
> - `channel` se establece automáticamente como `POS`

**POST `/pos/reservations/:id/charge` — Body:**
```json
{
  "sessionId": "uuid",
  "amountEurCents": 19500,
  "method": "CARD_TERMINAL",
  "reference": "TPV-20260219-001",
  "description": "Pago alquiler 3 días + depósito"
}
```

#### Transacciones de caja

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 24 | GET | `/pos/transactions` | 📊 MANAGER+ | Historial de transacciones con filtros |
| 25 | POST | `/pos/transactions/expense` | 💼 CASHIER+ | Registrar gasto pagado desde la caja |
| 26 | POST | `/pos/transactions/adjustment` | 📊 MANAGER+ | Ajuste contable manual con justificación |

**POST `/pos/transactions/expense` — Body:**
```json
{
  "sessionId": "uuid",
  "description": "Combustible furgoneta traslado",
  "amountEurCents": 4500,
  "method": "CASH"
}
```

---

### 3.5 Inspections — Check-in fotográfico

**Controller:** `InspectionsController` · **Prefijo:** `/inspections`

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 27 | POST | `/inspections` | 👁 OPERATOR+ | Crear inspección check-in o check-out |
| 28 | GET | `/inspections/:id` | 👁 OPERATOR+ | Detalle de inspección con fotos (URLs presigned) |
| 29 | GET | `/inspections/reservation/:reservationId` | 👁 OPERATOR+ | Inspecciones de una reserva (checkin + checkout) |
| 30 | POST | `/inspections/:id/photos/presign` | 👁 OPERATOR+ | Presigned S3 URL para subir foto de inspección |
| 31 | POST | `/inspections/:id/photos/confirm` | 👁 OPERATOR+ | Confirmar foto subida a S3 |
| 32 | DELETE | `/inspections/:id/photos/:photoId` | 👁 OPERATOR+ | Eliminar foto antes de finalizar inspección |
| 33 | POST | `/inspections/:id/complete` | 👁 OPERATOR+ | Finalizar inspección (firma digital del cliente) |

**POST `/inspections` — Body:**
```json
{
  "reservationId": "uuid",
  "type": "CHECKIN",
  "mileageKm": 45230,
  "fuelLevel": "FULL",
  "generalCondition": "GOOD",
  "damageNotes": "Pequeño arañazo en parachoques trasero derecho (pre-existente)"
}
```

**POST `/inspections/:id/complete` — Body:**
```json
{
  "customerSignatureData": "data:image/png;base64,iVBORw0KGgo..."
}
```
> La firma se convierte a PNG, se sube a S3 y se guarda el `customer_signature_key`.

**GET `/inspections/reservation/:reservationId` — Response:**
```json
{
  "data": {
    "checkin": {
      "id": "uuid", "type": "CHECKIN",
      "mileageKm": 45230, "fuelLevel": "FULL",
      "generalCondition": "GOOD",
      "photos": [
        { "id": "uuid", "position": "FRONT", "url": "https://s3.../presigned..." }
      ],
      "completedAt": "2026-02-19T10:45:00Z"
    },
    "checkout": null
  }
}
```

---

### 3.6 Damage Claims — Reclamaciones

**Controller:** `DamageClaimsController` · **Prefijo:** `/damage-claims`

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 34 | GET | `/damage-claims` | 👁 OPERATOR+ | Listar reclamaciones con filtros |
| 35 | GET | `/damage-claims/:id` | 👁 OPERATOR+ | Detalle de una reclamación |
| 36 | POST | `/damage-claims` | 👁 OPERATOR+ | Crear reclamación detectada en checkout |
| 37 | PATCH | `/damage-claims/:id` | 👁 OPERATOR+ | Actualizar estado, costes, notas |
| 38 | POST | `/damage-claims/:id/charge-customer` | 📊 MANAGER+ | Cobrar al cliente vía Stripe o registro manual |
| 39 | POST | `/damage-claims/:id/resolve` | 👁 OPERATOR+ | Marcar como RESOLVED |

**POST `/damage-claims` — Body:**
```json
{
  "reservationId": "uuid",
  "checkoutInspectionId": "uuid",
  "description": "Golpe nuevo en puerta trasera izquierda no presente en check-in",
  "estimatedCostEurCents": 35000
}
```

**POST `/damage-claims/:id/charge-customer` — Body:**
```json
{
  "method": "STRIPE_ONLINE",
  "amountEurCents": 32000,
  "description": "Reparación daño puerta trasera izquierda — reserva #R-2026-089"
}
```
> Si `method = STRIPE_ONLINE`, crea un PaymentIntent en Stripe contra el payment method guardado del cliente.  
> Si `method = CASH` o `CARD_TERMINAL`, registra `pos_transaction` y marca `chargedToCustomer = true`.

---

### 3.7 Fleet — Flota avanzada

**Controller:** `FleetController` · **Prefijo:** `/fleet`

#### Mantenimiento

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 40 | GET | `/fleet/vehicles/:id/maintenance` | 🔧 MECHANIC+ | Historial de mantenimiento del vehículo |
| 41 | POST | `/fleet/vehicles/:id/maintenance` | 🔧 MECHANIC+ | Crear orden de mantenimiento |
| 42 | PATCH | `/fleet/maintenance/:id` | 🔧 MECHANIC+ | Actualizar estado/coste/fechas |
| 43 | POST | `/fleet/maintenance/:id/complete` | 🔧 MECHANIC+ | Marcar como completado |
| 44 | POST | `/fleet/maintenance/:id/invoice/presign` | 🔧 MECHANIC+ | Presigned S3 URL para factura del taller |
| 45 | POST | `/fleet/maintenance/:id/invoice/confirm` | 🔧 MECHANIC+ | Confirmar factura subida |

**POST `/fleet/vehicles/:id/maintenance` — Body:**
```json
{
  "type": "OIL_CHANGE",
  "scheduledDate": "2026-03-01",
  "description": "Cambio de aceite 5W30 + filtro + inspección visual",
  "providerName": "Garage Maroc Auto",
  "nextServiceKm": 80000,
  "nextServiceDate": "2026-09-01"
}
```

#### Odómetro

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 46 | GET | `/fleet/vehicles/:id/odometer` | 👁 OPERATOR+ | Historial de lecturas km |
| 47 | POST | `/fleet/vehicles/:id/odometer` | 👁 OPERATOR+ | Registrar lectura manual de km |

**POST `/fleet/vehicles/:id/odometer` — Body:**
```json
{
  "readingKm": 47895,
  "readingType": "MANUAL",
  "notes": "Lectura de inicio de día"
}
```

#### Alertas

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 48 | GET | `/fleet/alerts` | 👁 OPERATOR+ | Todas las alertas activas (filtrable: severity, vehicleId) |
| 49 | GET | `/fleet/vehicles/:id/alerts` | 👁 OPERATOR+ | Alertas de un vehículo específico |
| 50 | POST | `/fleet/alerts/:id/resolve` | 🔧 MECHANIC+ | Marcar alerta como resuelta |

**GET `/fleet/alerts?severity=CRITICAL&isResolved=false` — Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "vehicle": { "id": "uuid", "brand": "Toyota", "model": "Camry", "licensePlate": "123-A-456" },
      "type": "ITV_DUE",
      "severity": "CRITICAL",
      "dueDate": "2026-02-28",
      "message": "ITV vence en 7 días — Toyota Camry 123-A-456",
      "isResolved": false,
      "createdAt": "2026-02-14T00:00:00Z"
    }
  ],
  "total": 3
}
```

#### Documentos del vehículo

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 51 | GET | `/fleet/vehicles/:id/documents` | 👁 OPERATOR+ | Documentos del vehículo con URLs presigned |
| 52 | POST | `/fleet/vehicles/:id/documents/presign` | 📊 MANAGER+ | Presigned URL para subir documento |
| 53 | POST | `/fleet/vehicles/:id/documents/confirm` | 📊 MANAGER+ | Confirmar documento subido |
| 54 | DELETE | `/fleet/vehicles/:id/documents/:docId` | 👑 ADMIN | Eliminar documento |

---

### 3.8 Finance — Finanzas

**Controller:** `FinanceController` · **Prefijo:** `/finance`

#### Categorías de gasto

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 55 | GET | `/finance/expense-categories` | 📊 MANAGER+ | Listar categorías activas |
| 56 | POST | `/finance/expense-categories` | 👑 ADMIN | Crear categoría |
| 57 | PATCH | `/finance/expense-categories/:id` | 👑 ADMIN | Actualizar categoría |

#### Gastos

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 58 | GET | `/finance/expenses` | 📊 MANAGER+ | Listar gastos con filtros y paginación |
| 59 | GET | `/finance/expenses/:id` | 📊 MANAGER+ | Detalle gasto con URL presigned del recibo |
| 60 | POST | `/finance/expenses` | 💼 CASHIER+ | Registrar gasto |
| 61 | PATCH | `/finance/expenses/:id` | 📊 MANAGER+ | Actualizar/aprobar gasto |
| 62 | POST | `/finance/expenses/:id/receipt/presign` | 💼 CASHIER+ | Presigned URL para subir ticket/factura |
| 63 | POST | `/finance/expenses/:id/receipt/confirm` | 💼 CASHIER+ | Confirmar recibo subido |

**GET `/finance/expenses?from=2026-02-01&to=2026-02-28&vehicleId=uuid&categoryId=uuid&page=1&limit=20`**

**POST `/finance/expenses` — Body:**
```json
{
  "categoryId": "uuid",
  "vehicleId": "uuid",
  "branchId": "uuid",
  "description": "Cambio de neumáticos delanteros — Toyota Camry 123-A-456",
  "amountEurCents": 28000,
  "expenseDate": "2026-02-19",
  "paymentMethod": "BANK_TRANSFER"
}
```

#### Ingresos extra

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 64 | GET | `/finance/income` | 📊 MANAGER+ | Listar ingresos no-alquiler |
| 65 | POST | `/finance/income` | 👑 ADMIN | Registrar ingreso extra |

#### P&L y resúmenes

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 66 | GET | `/finance/summary/daily` | 📊 MANAGER+ | P&L diario (usa vista materializada) |
| 67 | GET | `/finance/summary/monthly` | 📊 MANAGER+ | P&L mensual agregado |
| 68 | GET | `/finance/summary/vehicle/:id` | 📊 MANAGER+ | ROI de un vehículo específico |
| 69 | POST | `/finance/summary/refresh` | 👑 ADMIN | Forzar refresco de la vista materializada |

**GET `/finance/summary/daily?from=2026-02-01&to=2026-02-28&branchId=uuid` — Response:**
```json
{
  "data": [
    {
      "date": "2026-02-19",
      "totalIncomeEurCents": 285000,
      "totalExpensesEurCents": 45000,
      "grossProfitEurCents": 240000,
      "totalReservations": 7,
      "avgVehicleOccupationPct": 58.3,
      "byChannel": {
        "ONLINE": 195000,
        "POS": 90000
      }
    }
  ],
  "totals": {
    "income": 6840000,
    "expenses": 1080000,
    "profit": 5760000
  }
}
```

**GET `/finance/summary/vehicle/:id` — Response:**
```json
{
  "data": {
    "vehicle": { "id": "uuid", "brand": "Hyundai", "model": "Tucson", "licensePlate": "456-B-789" },
    "period": { "from": "2026-01-01", "to": "2026-02-21" },
    "totalReservations": 18,
    "totalRentalDays": 47,
    "totalIncomeEurCents": 399500,
    "totalMaintenanceCostEurCents": 28000,
    "totalExpensesRatioEurCents": 12000,
    "netProfitEurCents": 359500,
    "occupationRatePct": 91.7,
    "revPAC": 8500
  }
}
```
> **RevPAC** = Revenue Per Available Car (céntimos/día). Métrica estándar del sector.

---

### 3.9 HRM — RRHH

**Controller:** `HrmController` · **Prefijo:** `/hrm`

#### Turnos

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 70 | GET | `/hrm/shifts` | 📊 MANAGER+ | Turnos con filtros (empleado, fecha, sucursal) |
| 71 | POST | `/hrm/shifts` | 📊 MANAGER+ | Crear turno manualmente |
| 72 | PATCH | `/hrm/shifts/:id` | 📊 MANAGER+ | Actualizar turno (hora fin, descanso) |
| 73 | DELETE | `/hrm/shifts/:id` | 👑 ADMIN | Eliminar turno (solo si en el mismo día) |
| 74 | POST | `/hrm/shifts/clock-in` | 💼 CASHIER+ | Auto-registro de entrada de turno |
| 75 | POST | `/hrm/shifts/clock-out` | 💼 CASHIER+ | Auto-registro de salida de turno |

**POST `/hrm/shifts` — Body:**
```json
{
  "employeeId": "uuid",
  "branchId": "uuid",
  "shiftDate": "2026-02-19",
  "startTime": "08:00:00+01:00",
  "endTime": "20:00:00+01:00",
  "breakMinutes": 60,
  "type": "REGULAR"
}
```

**GET `/hrm/shifts?employeeId=uuid&month=2026-02&branchId=uuid` — Response:**
```json
{
  "data": [...],
  "summary": {
    "totalShifts": 18,
    "totalHours": 198.5,
    "overtimeHours": 12.5,
    "employeeId": "uuid"
  }
}
```

#### Nóminas

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 76 | GET | `/hrm/payroll` | 👑 ADMIN | Listar nóminas (filtros: mes, estado, empleado) |
| 77 | GET | `/hrm/payroll/:id` | 👑 ADMIN | Detalle de nómina |
| 78 | POST | `/hrm/payroll/generate` | 👑 ADMIN | Auto-generar nóminas del mes para todos los empleados activos |
| 79 | PATCH | `/hrm/payroll/:id` | 👑 ADMIN | Ajustar nómina generada (extras, deducciones) |
| 80 | POST | `/hrm/payroll/:id/approve` | 👑 ADMIN | Aprobar nómina (DRAFT → APPROVED) |
| 81 | POST | `/hrm/payroll/:id/mark-paid` | 👑 ADMIN | Marcar como pagada con referencia de transferencia |

**POST `/hrm/payroll/generate` — Body:**
```json
{
  "year": 2026,
  "month": 2
}
```
> Genera registros `DRAFT` para cada empleado activo en `employee_profiles`.  
> Calcula base desde `salary_eur_cents` + horas extra del mes desde `work_shifts`.

**POST `/hrm/payroll/:id/mark-paid` — Body:**
```json
{
  "paymentReference": "SEPA-2026-02-EMP0001",
  "paidAt": "2026-02-28T12:00:00Z"
}
```

---

### 3.10 CRM — Clientes Corporativos

**Controller:** `CrmController` · **Prefijo:** `/crm`

#### Clientes corporativos

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 82 | GET | `/crm/clients` | 📊 MANAGER+ | Listar clientes corporativos |
| 83 | GET | `/crm/clients/:id` | 📊 MANAGER+ | Perfil completo con contratos e historial |
| 84 | POST | `/crm/clients` | 📊 MANAGER+ | Crear cliente corporativo |
| 85 | PATCH | `/crm/clients/:id` | 📊 MANAGER+ | Actualizar cliente |
| 86 | DELETE | `/crm/clients/:id` | 👑 ADMIN | Soft-delete |
| 87 | GET | `/crm/clients/:id/reservations` | 📊 MANAGER+ | Historial de reservas del cliente |
| 88 | GET | `/crm/clients/:id/invoices` | 📊 MANAGER+ | Facturas del cliente |
| 89 | GET | `/crm/clients/:id/stats` | 📊 MANAGER+ | KPIs del cliente (gasto total, frecuencia, etc.) |

**POST `/crm/clients` — Body:**
```json
{
  "companyName": "Atlas Logistics SARL",
  "tradeName": "Atlas Log",
  "taxId": "ICE-123456789",
  "industry": "Transporte",
  "contactName": "Youssef Alaoui",
  "contactEmail": "y.alaoui@atlas-log.ma",
  "contactPhone": "+212661234567",
  "billingEmail": "factures@atlas-log.ma",
  "creditLimitEurCents": 500000,
  "paymentTerms": "NET_30",
  "defaultDiscountPct": 15,
  "assignedManagerId": "uuid"
}
```

#### Contratos

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 90 | GET | `/crm/contracts` | 📊 MANAGER+ | Listar contratos activos |
| 91 | GET | `/crm/contracts/:id` | 📊 MANAGER+ | Detalle del contrato |
| 92 | POST | `/crm/contracts` | 📊 MANAGER+ | Crear contrato para un cliente existente |
| 93 | PATCH | `/crm/contracts/:id` | 📊 MANAGER+ | Actualizar condiciones del contrato |
| 94 | POST | `/crm/contracts/:id/activate` | 👑 ADMIN | Activar contrato (DRAFT → ACTIVE) |
| 95 | POST | `/crm/contracts/:id/cancel` | 👑 ADMIN | Cancelar contrato activo |
| 96 | POST | `/crm/contracts/:id/document/presign` | 📊 MANAGER+ | Presigned URL para contrato firmado |
| 97 | POST | `/crm/contracts/:id/document/confirm` | 📊 MANAGER+ | Confirmar documento del contrato subido |

#### Facturación corporativa

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 98 | GET | `/crm/invoices` | 📊 MANAGER+ | Listar facturas con filtros |
| 99 | GET | `/crm/invoices/:id` | 📊 MANAGER+ | Detalle factura con URL PDF |
| 100 | POST | `/crm/invoices/generate` | 📊 MANAGER+ | Generar factura manualmente para un contrato y período |
| 101 | POST | `/crm/invoices/:id/send` | 📊 MANAGER+ | Enviar factura por email al cliente |
| 102 | POST | `/crm/invoices/:id/mark-paid` | 📊 MANAGER+ | Marcar como pagada |
| 103 | POST | `/crm/invoices/:id/cancel` | 👑 ADMIN | Anular factura (genera nota de crédito) |

**POST `/crm/invoices/generate` — Body:**
```json
{
  "contractId": "uuid",
  "periodStart": "2026-02-01",
  "periodEnd": "2026-02-28"
}
```
> El servicio calcula automáticamente todas las reservas `COMPLETED` del `corporate_client_id`  
> en ese período, aplica el `agreed_discount_pct` del contrato, y genera el PDF vía BullMQ (job async).

---

### 3.11 Analytics — Dashboard ejecutivo

**Controller:** `AnalyticsController` · **Prefijo:** `/analytics`

| # | Método | Ruta | Rol | Descripción |
|---|--------|------|-----|-------------|
| 104 | GET | `/analytics/overview` | 📊 MANAGER+ | KPIs del día actual en tiempo real |
| 105 | GET | `/analytics/fleet` | 👁 OPERATOR+ | Estado actual de flota (ocupación, disponibilidad) |
| 106 | GET | `/analytics/revenue` | 📊 MANAGER+ | Ingresos por canal/categoría/período |
| 107 | GET | `/analytics/top-vehicles` | 📊 MANAGER+ | Vehículos más rentables |
| 108 | GET | `/analytics/occupancy` | 📊 MANAGER+ | Ocupación de flota por día/semana/mes |
| 109 | GET | `/analytics/employees` | 📊 MANAGER+ | Operaciones por empleado en período |
| 110 | GET | `/analytics/forecast` | 👑 ADMIN | Proyección de ingresos próximos 30 días |

**GET `/analytics/overview` — Response:**
```json
{
  "data": {
    "asOf": "2026-02-21T14:30:00Z",
    "today": {
      "reservationsCreated": 5,
      "checkinsCompleted": 3,
      "checkoutsCompleted": 2,
      "incomeEurCents": 156000,
      "expensesEurCents": 12000
    },
    "fleet": {
      "total": 14,
      "available": 6,
      "rented": 7,
      "maintenance": 1,
      "occupationPct": 50.0
    },
    "alerts": {
      "critical": 1,
      "warning": 3,
      "info": 5
    },
    "pos": {
      "sessionsOpen": 1,
      "cashier": "Omar K."
    },
    "pendingActions": {
      "documentsToReview": 2,
      "damageClaimsOpen": 1,
      "payrollDraft": 0
    }
  }
}
```

**GET `/analytics/fleet?date=2026-02-21` — Response:**
```json
{
  "data": {
    "byStatus": {
      "AVAILABLE": 6,
      "RENTED": 7,
      "MAINTENANCE": 1,
      "INACTIVE": 0
    },
    "byCategory": {
      "COMPACT": { "total": 4, "available": 2 },
      "SUV": { "total": 5, "available": 2 },
      "LUXURY": { "total": 3, "available": 1 },
      "SEDAN": { "total": 2, "available": 1 }
    },
    "vehicles": [
      {
        "id": "uuid",
        "brand": "Toyota", "model": "Camry", "licensePlate": "123-A-456",
        "status": "RENTED",
        "currentReservation": {
          "id": "uuid",
          "customer": "Carlos M.",
          "returnDate": "2026-02-24T10:00:00Z",
          "daysRemaining": 3
        },
        "alerts": [{ "type": "OIL_DUE", "severity": "WARNING" }]
      }
    ]
  }
}
```

---

## 4. Extensiones de endpoints existentes

### 4.1 Extensión de `GET /reservations/my`
Añadir filtro de canal para que los operadores vean por `channel`:
```
GET /reservations/my?channel=POS&status=CONFIRMED
```

### 4.2 Extensión de `PATCH /admin/users/:id`
Permitir ahora asignar `branchId` además de rol y estado:
```json
{ "role": "CASHIER", "branchId": "uuid", "isActive": true }
```

### 4.3 Extensión de `GET /admin/vehicles`
Añadir parámetros de filtro:
```
GET /admin/vehicles?branchId=uuid&status=MAINTENANCE&category=SUV
```

### 4.4 Extensión de `POST /operator/delivery/:id/scan-qr`
Añadir cuerpo opcional para la inspección simultánea:
```json
{
  "qrCodeHash": "abc123...",
  "mileageKm": 45230,
  "fuelLevel": "FULL"
}
```
> Si `mileageKm` y `fuelLevel` están presentes, se crea automáticamente la `checkin_inspection`.

### 4.5 Nuevo endpoint en operator para checkout
```
POST /operator/delivery/:reservationId/checkout
```
Marca reserva como `COMPLETED` + crea `checkin_inspection` de tipo `CHECKOUT`.

---

## 5. Matriz de permisos por rol

| Módulo | USER | CASHIER | MECHANIC | OPERATOR | MANAGER | ADMIN |
|--------|------|---------|----------|----------|---------|-------|
| Auth / Perfil | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Catálogo vehículos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reservas (propias) | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| Reservas (todas) | — | 👁 | — | ✅ | ✅ | ✅ |
| POS Sesiones | — | ✅ | — | ✅ | ✅ | ✅ |
| POS Crear reserva | — | ✅ | — | ✅ | ✅ | ✅ |
| Inspecciones | — | — | — | ✅ | ✅ | ✅ |
| Damage Claims | — | — | — | ✅ | ✅ | ✅ |
| Mantenimiento | — | — | ✅ | ✅ | ✅ | ✅ |
| Alertas flota | — | — | ✅ | ✅ | ✅ | ✅ |
| Gastos | — | ✅ | — | ✅ | ✅ | ✅ |
| Nóminas | — | — | — | — | — | ✅ |
| P&L / Analytics | — | — | — | — | ✅ | ✅ |
| CRM Corporativo | — | — | — | — | ✅ | ✅ |
| Employees | — | — | — | — | ✅ | ✅ |
| Branches | — | — | — | — | ✅ | ✅ |
| Audit Log | — | — | — | — | 👁 | ✅ |
| Admin (users/roles) | — | — | — | — | — | ✅ |

> 👁 = solo lectura

---

## 6. Convenciones de respuesta

### Respuesta exitosa — colección
```json
{
  "data": [...],
  "total": 248,
  "page": 1,
  "limit": 20,
  "totalPages": 13
}
```

### Respuesta exitosa — recurso único
```json
{
  "data": { ... }
}
```

### Respuesta exitosa con mensaje
```json
{
  "data": { ... },
  "message": "Inspección completada correctamente."
}
```

### Sin contenido (DELETE, acciones de estado)
```
HTTP 204 No Content
(sin body)
```

### Precios — siempre céntimos en la API, euros en la UI
```json
// API:  "amountEurCents": 19500
// UI:   "195,00 €"
```

---

## 7. Convenciones de errores

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "El vehículo ya tiene una reserva activa en esas fechas.",
  "code": "VEHICLE_NOT_AVAILABLE"
}
```

### Códigos de error personalizados

| Código | HTTP | Descripción |
|--------|------|-------------|
| `VEHICLE_NOT_AVAILABLE` | 409 | Vehículo ya reservado en esas fechas |
| `POS_SESSION_NOT_OPEN` | 400 | No hay sesión de caja activa para el empleado |
| `POS_SESSION_ALREADY_OPEN` | 409 | El empleado ya tiene una sesión abierta |
| `INSPECTION_ALREADY_EXISTS` | 409 | Ya existe una inspección del mismo tipo para esa reserva |
| `DAMAGE_CLAIM_ALREADY_CHARGED` | 409 | El daño ya fue cobrado al cliente |
| `VEHICLE_IN_MAINTENANCE` | 400 | Vehículo no disponible por estar en taller |
| `CORPORATE_CREDIT_EXCEEDED` | 402 | Se supera el límite de crédito del cliente corporativo |
| `PAYROLL_ALREADY_EXISTS` | 409 | Ya existe nómina para ese empleado en ese mes |
| `INVOICE_NOT_DRAFT` | 400 | Solo se puede modificar una factura en estado DRAFT |
| `SHIFT_NOT_CLOSED` | 400 | El turno anterior no ha sido cerrado |
| `RESERVATION_WRONG_STATUS` | 400 | Acción no permitida en el estado actual de la reserva |
| `INSUFFICIENT_PERMISSIONS` | 403 | El rol no tiene permisos para esta acción |

---

## Resumen: total de endpoints

| Tipo | Cantidad |
|------|---------|
| Endpoints **existentes** (sin modificación) | 23 |
| Endpoints **existentes** con extensión | 5 |
| Endpoints **nuevos** | 110 |
| **TOTAL en el sistema** | **138** |

---

*Próximo documento: **DOC 3 — Mapa de Páginas Frontend** (todas las rutas Next.js nuevas, componentes, datos que consumen)*
