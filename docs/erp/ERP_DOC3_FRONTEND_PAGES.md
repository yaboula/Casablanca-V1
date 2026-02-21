# NEXUS ERP — DOC 3: Mapa Completo de Páginas Frontend

> **Versión:** 1.0 · **Fecha:** 21 febrero 2026  
> **Basado en:** DOC 1 (modelo de datos) + DOC 2 (endpoints) + análisis del frontend existente  
> **Framework:** Next.js 15 · App Router · TypeScript · Tailwind CSS

---

## Índice

1. [Estructura de rutas — visión global](#1-estructura-de-rutas--visión-global)
2. [Páginas existentes — referencia rápida](#2-páginas-existentes--referencia-rápida)
3. [Nuevas páginas por módulo](#3-nuevas-páginas-por-módulo)
   - 3.1 [Layout y navegación del ERP](#31-layout-y-navegación-del-erp)
   - 3.2 [POS — Punto de Venta Físico](#32-pos--punto-de-venta-físico)
   - 3.3 [Inspecciones fotográficas](#33-inspecciones-fotográficas)
   - 3.4 [Damage Claims](#34-damage-claims)
   - 3.5 [Fleet — Flota avanzada](#35-fleet--flota-avanzada)
   - 3.6 [Finance — Finanzas](#36-finance--finanzas)
   - 3.7 [HRM — Personal](#37-hrm--personal)
   - 3.8 [CRM — Clientes corporativos](#38-crm--clientes-corporativos)
   - 3.9 [Analytics — Dashboard ejecutivo](#39-analytics--dashboard-ejecutivo)
   - 3.10 [Audit Log](#310-audit-log)
4. [Nuevos componentes por categoría](#4-nuevos-componentes-por-categoría)
5. [Nuevos stores Zustand](#5-nuevos-stores-zustand)
6. [Nuevas rutas API proxy (Next.js)](#6-nuevas-rutas-api-proxy-nextjs)
7. [Extensiones de páginas existentes](#7-extensiones-de-páginas-existentes)
8. [Guía de permisos en frontend](#8-guía-de-permisos-en-frontend)
9. [Árbol de archivos completo a crear](#9-árbol-de-archivos-completo-a-crear)

---

## 1. Estructura de rutas — visión global

```
src/app/
│
├── (auth)/                         ← Rutas públicas de autenticación
├── (customer)/                     ← Área del cliente final
├── catalog/, book/, booking/       ← Flujo de reserva
├── smart-ticket/, waiting-room/    ← Post-booking
│
└── operator/                       ← ★ ZONA ERP — protegida por rol
    ├── dashboard/                  ← Existente: entregas del día
    ├── admin/                      ← Existente: admin básico
    │
    ├── erp/                        ★ NUEVA rama ERP
    │   ├── layout.tsx              ← Sidebar + header ERP
    │   ├── page.tsx                ← Redirect → /erp/analytics
    │   │
    │   ├── analytics/              ← Dashboard ejecutivo
    │   ├── pos/                    ← Punto de venta físico
    │   ├── fleet/                  ← Flota avanzada
    │   ├── finance/                ← Finanzas y P&L
    │   ├── hrm/                    ← Personal y nóminas
    │   ├── crm/                    ← Clientes corporativos
    │   └── audit/                  ← Registro de auditoría
```

> **Convención de nomenclatura:**  
> - `page.tsx` → Server Component (SSR/SSG, carga inicial de datos)  
> - `[Nombre]Client.tsx` → Client Component (`"use client"`, interactividad)  
> - `[Nombre]Table.tsx` → Tabla de datos reutilizable  
> - `[Nombre]Form.tsx` → Formulario con validación  
> - `[Nombre]Modal.tsx` → Modal/Dialog  
> - `actions.ts` → Server Actions (mutaciones desde Server Components)

---

## 2. Páginas existentes — referencia rápida

> No se modifican excepto las extensiones indicadas en §7.

| Ruta | Componente principal | Rol | Descripción |
|------|---------------------|-----|-------------|
| `/` | `HomeClient.tsx` | 🔓 | Landing page |
| `/catalog` | `CatalogGrid.tsx` | 🔓 | Catálogo de vehículos |
| `/catalog/[vehicleId]` | `VehicleDetailClient.tsx` | 🔓 | Detalle vehículo |
| `/book/[vehicleId]` | `BookFlowClient.tsx` | 🔑 | Flujo de booking + Stripe |
| `/booking/confirmed` | — | 🔑 | Confirmación de reserva |
| `/(auth)/login` | — | 🔓 | Login |
| `/(auth)/register` | — | 🔓 | Registro |
| `/(auth)/forgot-password` | — | 🔓 | Recuperar contraseña |
| `/(customer)/dashboard` | `DashboardClient.tsx` | 👤 | Mis reservas |
| `/(customer)/profile` | — | 👤 | Mi perfil |
| `/waiting-room` | `WaitingRoomClient.tsx` | 👤 | Sala de espera SSE |
| `/smart-ticket` | `SmartTicketClient.tsx` | 👤 | QR ticket |
| `/check-in` | `CheckInFlow.tsx` | 👤 | Subida de documentos |
| `/operator/dashboard` | `DeliveryListClient.tsx` | OPERATOR+ | Entregas del día |
| `/operator/documents` | `DocumentReviewList.tsx` | OPERATOR+ | Revisión documentos |
| `/operator/delivery/[id]` | `DeliveryCheckClient.tsx` | OPERATOR+ | Detalle entrega / QR scan |
| `/operator/search` | — | OPERATOR+ | Búsqueda reservas |
| `/operator/admin` | — | ADMIN | Panel admin (redirect) |
| `/operator/admin/vehicles` | `VehiclesAdminClient.tsx` | ADMIN | Gestión vehículos |
| `/operator/admin/users` | `UsersAdminClient.tsx` | ADMIN | Gestión usuarios |
| `/operator/admin/stats` | `StatsClient.tsx` | ADMIN | Stats básicas |
| `/faq`, `/terms`, `/privacy`, `/soporte` | — | 🔓 | Páginas estáticas |

---

## 3. Nuevas páginas por módulo

---

### 3.1 Layout y navegación del ERP

#### `src/app/operator/erp/layout.tsx` ← NUEVO
**Tipo:** Server Component + Client shell  
**Propósito:** Layout principal de toda la zona ERP. Sidebar fijo con navegación, header con breadcrumbs y notificaciones, área de contenido.

```
┌─────────────────────────────────────────────────────────┐
│  NEXUS ERP                    🔔 3    [Avatar] Admin     │ ← Header
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  📊 Analytics│        CONTENIDO DE LA PÁGINA           │
│  🏪 POS      │                                          │
│  🚗 Flota    │                                          │
│  💰 Finanzas │                                          │
│  👥 Personal │                                          │
│  🤝 CRM      │                                          │
│  🔍 Auditoría│                                          │
│              │                                          │
│  ─────────── │                                          │
│  ⚙ Admin     │                                          │
│  ← Salir ERP │                                          │
└──────────────┴──────────────────────────────────────────┘
```

**Componentes necesarios:**
- `ERPSidebar.tsx` — Nav lateral con iconos, labels, badges de alertas activas
- `ERPHeader.tsx` — Breadcrumb + NotificationBell + UserMenu
- `ERPBreadcrumb.tsx` — Generado automáticamente desde la ruta activa
- `NotificationBell.tsx` — Badge con alertas críticas de flota + documentos pendientes
- `ERPShell.tsx` — Layout wrapper `"use client"`

**Roles que acceden:** CASHIER, MECHANIC, OPERATOR, MANAGER, ADMIN  
**Items del sidebar por rol:**

| Item | Icono | CASHIER | MECHANIC | OPERATOR | MANAGER | ADMIN |
|------|-------|---------|----------|----------|---------|-------|
| Analytics | BarChart | — | — | — | ✅ | ✅ |
| POS | ShoppingBag | ✅ | — | ✅ | ✅ | ✅ |
| Flota | Car | — | ✅ | ✅ | ✅ | ✅ |
| Finanzas | Euro | — | — | — | ✅ | ✅ |
| Personal | Users | — | — | — | ✅ | ✅ |
| CRM | Handshake | — | — | — | ✅ | ✅ |
| Auditoría | Shield | — | — | — | — | ✅ |

---

#### `src/app/operator/erp/page.tsx`
Redirect automático al módulo principal según rol del usuario:
- ADMIN / MANAGER → `/operator/erp/analytics`
- CASHIER / OPERATOR → `/operator/erp/pos`
- MECHANIC → `/operator/erp/fleet`

---

### 3.2 POS — Punto de Venta Físico

#### `src/app/operator/erp/pos/page.tsx`
**Tipo:** Server Component  
**Datos iniciales:** sesión activa del cashier, stats del día  
**Redirect si no hay sesión activa:** muestra pantalla de apertura de caja

```
┌─────────────────────────────────────────────────────────┐
│  POS — Punto de Venta              Sesión: Omar K.  🟢  │
├────────────────────────┬────────────────────────────────┤
│  ACCIONES RÁPIDAS      │  RESUMEN DE SESIÓN             │
│                        │  Apertura: 08:00 (20.000€)     │
│  [+ Nueva Reserva]     │  Cobros: 4 · 580,00€           │
│  [🔍 Buscar Reserva]   │  Efectivo: 175,00€             │
│  [💳 Cobrar Reserva]   │  Datáfono: 405,00€             │
│  [📤 Checkout]         │                                │
│                        │  [Cerrar Caja]                 │
├────────────────────────┴────────────────────────────────┤
│  RESERVAS ACTIVAS HOY                                   │
│  [Tabla: cliente, vehículo, fechas, estado, acciones]   │
└─────────────────────────────────────────────────────────┘
```

**Client Component:** `PosHomeClient.tsx`  
**Endpoints:** `GET /pos/sessions/current`, `GET /operator/deliveries`

---

#### `src/app/operator/erp/pos/sessions/page.tsx`
**Descripción:** Historial de sesiones de caja con filtros por fecha y sucursal  
**Client Component:** `PosSessionsClient.tsx`  
**Endpoints:** `GET /pos/sessions?page&from&to&branchId`

---

#### `src/app/operator/erp/pos/sessions/[id]/page.tsx`
**Descripción:** Detalle de una sesión — todas las transacciones, resumen por método de pago, discrepancia  
**Client Component:** `PosSessionDetailClient.tsx`  
**Endpoints:** `GET /pos/sessions/:id`

---

#### `src/app/operator/erp/pos/new/page.tsx`
**Descripción:** Formulario de nueva reserva desde mostrador (flujo simplificado sin Stripe)  
**Client Component:** `PosNewReservationClient.tsx`  

```
Paso 1: Seleccionar vehículo  →  Paso 2: Datos cliente  →  Paso 3: Pago  →  Confirmación
```

**Componentes:**
- `PosVehicleSelector.tsx` — Grid de vehículos disponibles en fecha seleccionada (más compacto que el catálogo público)
- `PosCustomerForm.tsx` — Datos del cliente con autocompletado si ya está en el sistema
- `PosPaymentForm.tsx` — Método de pago (efectivo/datáfono/transferencia), importe, referencia TPV
- `PosReceiptPreview.tsx` — Vista previa del recibo antes de confirmar

**Endpoints:** `GET /vehicles`, `POST /pos/reservations`, `POST /pos/reservations/:id/charge`

---

#### `src/app/operator/erp/pos/transactions/page.tsx`
**Descripción:** Historial completo de transacciones con filtros avanzados y exportación  
**Client Component:** `PosTransactionsClient.tsx`  
**Endpoints:** `GET /pos/transactions?from&to&type&method&sessionId`

---

### 3.3 Inspecciones fotográficas

#### `src/app/operator/erp/pos/inspections/[reservationId]/page.tsx`
**Descripción:** Flujo completo de check-in o check-out fotográfico para una reserva  
**Client Component:** `InspectionFlowClient.tsx`  

```
Paso 1: Datos básicos      Paso 2: Fotos del vehículo     Paso 3: Firma cliente
  ├── Tipo (CI/CO)           ├── Foto frontal                ├── Canvas firma
  ├── Km actuales            ├── Foto trasera                ├── Nombre del cliente
  ├── Nivel combustible      ├── Foto lateral izq            └── Confirmar
  └── Estado general         ├── Foto lateral der
                             ├── Interior
                             └── Daños (opcional)
```

**Componentes:**
- `InspectionBasicForm.tsx` — Paso 1: km, combustible, condición
- `VehiclePhotoUploader.tsx` — Subida de fotos con previsualización por posición (usa cámara en móvil o upload desde desktop)
- `CustomerSignatureCanvas.tsx` — Canvas para firma digital con botones "Limpiar" y "Confirmar"
- `InspectionSummary.tsx` — Vista final antes de enviar

**Endpoints:** `POST /inspections`, `POST /inspections/:id/photos/presign`, `POST /inspections/:id/photos/confirm`, `POST /inspections/:id/complete`

---

#### `src/app/operator/erp/pos/inspections/[reservationId]/view/page.tsx`
**Descripción:** Vista de sólo lectura de una inspección existente con fotos y firma  
**Client Component:** `InspectionViewClient.tsx`  
**Endpoints:** `GET /inspections/reservation/:reservationId`

---

### 3.4 Damage Claims

#### `src/app/operator/erp/pos/damage-claims/page.tsx`
**Descripción:** Lista de todas las reclamaciones con filtros de estado y asignación  
**Client Component:** `DamageClaimsClient.tsx`

```
Filtros: [Estado ▼] [Vehículo ▼] [Periodo ▼]    [+ Nueva reclamación]

┌─ Reserva ──┬─ Vehículo ──┬─ Descripción ──┬─ Coste est. ─┬─ Estado ──┬─ Acciones ─┐
│ R-2026-089 │ Camry 123-A │ Golpe puerta...│ 320,00€      │ 🟡 OPEN   │ [Ver] [↓]  │
└────────────┴─────────────┴────────────────┴──────────────┴───────────┴────────────┘
```

**Endpoints:** `GET /damage-claims?status&page`

---

#### `src/app/operator/erp/pos/damage-claims/[id]/page.tsx`
**Descripción:** Detalle de una reclamación con historial, fotos del daño, y acciones  
**Client Component:** `DamageClaimDetailClient.tsx`  
**Componentes:**
- `DamageClaimTimeline.tsx` — Historial de cambios de estado
- `DamageChargeModal.tsx` — Modal para cobrar al cliente (Stripe o efectivo)

**Endpoints:** `GET /damage-claims/:id`, `POST /damage-claims/:id/charge-customer`, `POST /damage-claims/:id/resolve`

---

### 3.5 Fleet — Flota avanzada

#### `src/app/operator/erp/fleet/page.tsx`
**Descripción:** Vista general de toda la flota con estado en tiempo real  
**Client Component:** `FleetOverviewClient.tsx`

```
┌── ESTADO FLOTA ────────────────────────────────────────────┐
│  ✅ 6 Disponibles  🔵 7 Alquilados  🔧 1 Taller  ⚫ 0 Inactivos │
└────────────────────────────────────────────────────────────┘

[Filtros: Estado | Categoría | Sucursal | Alertas]   [Vista: Tarjetas | Tabla]

┌── Toyota Camry · 123-A-456 ──────────── 🔵 ALQUILADO ──┐
│  📅 Devuelve: 24 Feb  · 👤 Carlos M.                   │
│  🔧 Próximo servicio: 80.000 km (actual: 47.895)       │
│  ⚠️  ITV: vence 28 Feb                                 │
│  [Ver detalles] [Mantenimiento] [Historial]            │
└─────────────────────────────────────────────────────────┘
```

**Endpoints:** `GET /analytics/fleet`, `GET /fleet/alerts?isResolved=false`

---

#### `src/app/operator/erp/fleet/[vehicleId]/page.tsx`
**Descripción:** Ficha completa de un vehículo (hub central de toda su información)  
**Client Component:** `VehicleHubClient.tsx`

```
Tabs: [General] [Mantenimiento] [Odómetro] [Alertas] [Documentos] [Historial Reservas]
```

**Componentes por tab:**
- `VehicleGeneralTab.tsx` — Datos básicos + estado + fotos
- `MaintenanceHistoryTab.tsx` — Lista de intervenciones + botón nueva
- `OdometerLogTab.tsx` — Tabla de lecturas km en el tiempo
- `VehicleAlertsTab.tsx` — Alertas activas y resueltas
- `VehicleDocumentsTab.tsx` — Seguro, ITV, ficha técnica con fechas de vencimiento
- `ReservationHistoryTab.tsx` — Todas las reservas de ese vehículo

**Endpoints:** múltiples `GET /fleet/vehicles/:id/*`

---

#### `src/app/operator/erp/fleet/maintenance/page.tsx`
**Descripción:** Panel central de mantenimiento — todas las órdenes de trabajo  
**Client Component:** `MaintenanceBoardClient.tsx`

```
Vista Kanban:
┌── PROGRAMADO ──┬── EN PROCESO ──┬── COMPLETADO ──┐
│  Toyota Camry  │  Hyundai Tucson│  Audi A4       │
│  Cambio aceite │  Neumáticos    │  Frenos        │
│  01 Mar 2026   │  Garage Maroc  │  Completado hoy│
└────────────────┴────────────────┴────────────────┘
```

**Endpoints:** `GET /fleet/vehicles/:id/maintenance?status`

---

#### `src/app/operator/erp/fleet/alerts/page.tsx`
**Descripción:** Todas las alertas activas, agrupadas por severidad  
**Client Component:** `FleetAlertsClient.tsx`

```
🔴 CRÍTICAS (1)     🟡 ADVERTENCIAS (3)     🔵 INFORMATIVAS (5)

┌─ Vehículo ──┬─ Alerta ──────┬─ Vence ──┬─ Acciones ──────────────┐
│ Camry 123-A │ ITV vence pronto│ 28 Feb  │ [Programar] [Resolver] │
└─────────────┴────────────────┴──────────┴─────────────────────────┘
```

**Endpoints:** `GET /fleet/alerts?severity=CRITICAL`, `POST /fleet/alerts/:id/resolve`

---

### 3.6 Finance — Finanzas

#### `src/app/operator/erp/finance/page.tsx`
**Descripción:** Dashboard financiero principal — P&L en tiempo real  
**Client Component:** `FinanceDashboardClient.tsx`

```
┌── HOY ──────────────────┬── MES ACTUAL ───────────────────────────┐
│  Ingresos: 1.560,00€   │  Ingresos:  28.450,00€                  │
│  Gastos:     280,00€   │  Gastos:     5.120,00€                  │
│  Beneficio: 1.280,00€  │  Beneficio: 23.330,00€                  │
│  Margen: 82,1%         │  Margen: 82,0%                          │
└─────────────────────────┴──────────────────────────────────────────┘

[Gráfico de ingresos por día / semana / mes]   [Desglose por canal]

[Tabla: últimos gastos]                        [Tabla: últimas transacciones POS]
```

**Componentes:**
- `FinanceSummaryCards.tsx` — 4 KPI cards (ingresos, gastos, beneficio, margen)
- `RevenueChart.tsx` — Gráfico de líneas con Recharts/Chart.js
- `ChannelBreakdownChart.tsx` — Pie chart: Online vs POS vs Corporativo
- `RecentExpensesTable.tsx`
- `RecentTransactionsTable.tsx`

**Endpoints:** `GET /finance/summary/daily`, `GET /finance/summary/monthly`, `GET /analytics/overview`

---

#### `src/app/operator/erp/finance/expenses/page.tsx`
**Descripción:** Gestión completa de gastos con filtros y registro de nuevos  
**Client Component:** `ExpensesClient.tsx`

**Componentes:**
- `ExpenseFilters.tsx` — Filtros por categoría, vehículo, fecha, método de pago
- `ExpensesTable.tsx` — Tabla paginada con exportación CSV
- `NewExpenseModal.tsx` — Modal con formulario + subida de recibo/factura

**Endpoints:** `GET /finance/expenses`, `POST /finance/expenses`, `POST /finance/expenses/:id/receipt/presign`

---

#### `src/app/operator/erp/finance/pl/page.tsx`
**Descripción:** P&L detallado por período con tabla y gráficos  
**Client Component:** `PLReportClient.tsx`

```
Selector: [Mes ▼] [2026 ▼] [Sucursal ▼]   [Exportar PDF] [Exportar Excel]

┌── Ingresos ─────────────────────────────────────────────────────┐
│  Alquiler online:     18.450,00€  (64,8%)                       │
│  Alquiler mostrador:   9.000,00€  (31,6%)                       │
│  Corporativo:          1.000,00€   (3,5%)                       │
│  TOTAL INGRESOS:      28.450,00€                                │
├── Gastos ───────────────────────────────────────────────────────┤
│  Mantenimiento:        2.800,00€  (54,7%)                       │
│  Combustible:            750,00€  (14,6%)                       │
│  Limpieza:               420,00€   (8,2%)                       │
│  Seguros:              1.150,00€  (22,5%)                       │
│  TOTAL GASTOS:         5.120,00€                                │
├── RESULTADO ────────────────────────────────────────────────────┤
│  BENEFICIO BRUTO:     23.330,00€  (82,0%)                       │
└─────────────────────────────────────────────────────────────────┘
```

**Endpoints:** `GET /finance/summary/monthly?year&month&branchId`

---

#### `src/app/operator/erp/finance/vehicle-roi/page.tsx`
**Descripción:** ROI por vehículo — cuánto genera y cuánto cuesta cada unidad  
**Client Component:** `VehicleROIClient.tsx`

```
Ordenar por: [RevPAC ▼]

┌─ Vehículo ───┬─ Días alquilado ─┬─ Ingresos ─┬─ Gastos ─┬─ Beneficio ─┬─ Ocupación ─┐
│ Tucson 456-B │  47 / 51 (91,7%) │ 3.995,00€  │ 280,00€  │ 3.715,00€   │  🟢 91,7%  │
│ Camry 123-A  │  38 / 51 (74,5%) │ 3.230,00€  │ 350,00€  │ 2.880,00€   │  🟡 74,5%  │
└──────────────┴──────────────────┴────────────┴──────────┴─────────────┴─────────────┘
```

**Endpoints:** `GET /finance/summary/vehicle/:id` (llamada paralela para todos los vehículos)

---

### 3.7 HRM — Personal

#### `src/app/operator/erp/hrm/page.tsx`
**Descripción:** Vista general del equipo con estado actual  
**Client Component:** `HrmOverviewClient.tsx`

```
┌── HOY ──────────────────────────────────────────────────────────┐
│  Turnos activos: 3   │  Turnos cerrados: 2   │  Ausencias: 0   │
└─────────────────────────────────────────────────────────────────┘

[Tabla de empleados con estado del turno actual]
[+ Nuevo empleado]   [Gestionar turnos]   [Nóminas]
```

**Endpoints:** `GET /employees?isActive=true`, `GET /hrm/shifts?date=today`

---

#### `src/app/operator/erp/hrm/employees/page.tsx`
**Descripción:** Lista de empleados con filtros y acciones  
**Client Component:** `EmployeesClient.tsx`

**Componentes:**
- `EmployeeCard.tsx` — Tarjeta con foto, nombre, rol, estado del turno
- `NewEmployeeModal.tsx` — Formulario de creación (busca un User existente y le añade perfil de empleado)
- `EmployeeFilters.tsx` — Por posición, sucursal, estado

**Endpoints:** `GET /employees`, `POST /employees`

---

#### `src/app/operator/erp/hrm/employees/[id]/page.tsx`
**Descripción:** Ficha completa del empleado  
**Client Component:** `EmployeeProfileClient.tsx`

```
Tabs: [Perfil] [Turnos] [Nóminas] [Actividad]
```

**Componentes:**
- `EmployeeProfileTab.tsx` — Datos personales, contrato, contacto emergencia
- `EmployeeShiftsTab.tsx` — Calendario de turnos del mes + resumen de horas
- `EmployeePayrollTab.tsx` — Historial de nóminas pagadas
- `EmployeeActivityTab.tsx` — Log de operaciones (feed del audit_log para ese user)

**Endpoints:** `GET /employees/:id`, `GET /employees/:id/shifts`, `GET /employees/:id/activity`, `GET /hrm/payroll?employeeId=id`

---

#### `src/app/operator/erp/hrm/shifts/page.tsx`
**Descripción:** Gestión de turnos — calendario mensual del equipo  
**Client Component:** `ShiftsManagementClient.tsx`

```
                    Febrero 2026
      Lun  Mar  Mié  Jue  Vie  Sáb  Dom
  3    Omar  Omar  Omar  ···  ···  ···  ···
  4    ···   Sara  Sara  Sara ···  ···  ···
  5    ···   ···   ···   ···  ···  ···  ···

[Añadir turno]  [Registro clock-in/out]
```

**Componentes:**
- `ShiftsCalendar.tsx` — Calendario con turnos por empleado
- `ShiftFormModal.tsx` — Añadir/editar turno
- `MonthlyHoursSummary.tsx` — Total horas por empleado en el mes

**Endpoints:** `GET /hrm/shifts?month&branchId`, `POST /hrm/shifts`, `PATCH /hrm/shifts/:id`

---

#### `src/app/operator/erp/hrm/payroll/page.tsx`
**Descripción:** Gestión de nóminas mensuales  
**Client Component:** `PayrollClient.tsx`

```
[Periodo: Febrero 2026 ▼]   [Generar nóminas del mes]

Estado: 4 DRAFT · 0 APROBADAS · 0 PAGADAS

┌─ Empleado ──┬─ Base ─────┬─ Extras ──┬─ Deducciones ─┬─ Neto ─────┬─ Estado ──┬─ Acciones ──┐
│ Omar K.     │ 1.800,00€  │  125,00€  │    234,00€    │ 1.691,00€  │ 🟡 DRAFT  │ [Aprobar]   │
│ Sara M.     │ 1.600,00€  │    0,00€  │    208,00€    │ 1.392,00€  │ 🟡 DRAFT  │ [Aprobar]   │
└─────────────┴────────────┴───────────┴───────────────┴────────────┴───────────┴─────────────┘

[Aprobar todas]   [Marcar como pagadas]
```

**Endpoints:** `GET /hrm/payroll`, `POST /hrm/payroll/generate`, `POST /hrm/payroll/:id/approve`, `POST /hrm/payroll/:id/mark-paid`

---

### 3.8 CRM — Clientes Corporativos

#### `src/app/operator/erp/crm/page.tsx`
**Descripción:** Dashboard CRM con resumen de cartera corporativa  
**Client Component:** `CrmDashboardClient.tsx`

```
┌── CARTERA ─────────────────────────────────────────────────────┐
│  Clientes activos: 8  │  Contratos vigentes: 6  │  Facturas vencidas: 1 │
└────────────────────────────────────────────────────────────────┘

[Tabla de clientes con último pedido, gasto total, estado contrato]
[+ Nuevo cliente]
```

**Endpoints:** `GET /crm/clients`, `GET /crm/invoices?status=OVERDUE`

---

#### `src/app/operator/erp/crm/clients/page.tsx`
**Descripción:** Lista completa de clientes corporativos  
**Client Component:** `CorporateClientsClient.tsx`

**Componentes:**
- `ClientCard.tsx` — Tarjeta con logo empresa, contacto, estado contrato, KPI clave
- `NewClientModal.tsx` — Formulario de alta de nuevo cliente corporativo

**Endpoints:** `GET /crm/clients`

---

#### `src/app/operator/erp/crm/clients/[id]/page.tsx`
**Descripción:** Ficha completa del cliente corporativo  
**Client Component:** `CorporateClientDetailClient.tsx`

```
Tabs: [Perfil] [Contratos] [Reservas] [Facturas] [Estadísticas]
```

**Componentes:**
- `ClientProfileTab.tsx` — Datos empresa, condiciones de pago, manager asignado
- `ClientContractsTab.tsx` — Contratos vigentes y expirados con botón "Nuevo contrato"
- `ClientReservationsTab.tsx` — Historial de reservas corporativas
- `ClientInvoicesTab.tsx` — Facturas emitidas con estado
- `ClientStatsTab.tsx` — LTV, reservas/mes, vehículos más solicitados, gasto total

**Endpoints:** `GET /crm/clients/:id`, `GET /crm/clients/:id/reservations`, `GET /crm/clients/:id/invoices`, `GET /crm/clients/:id/stats`

---

#### `src/app/operator/erp/crm/contracts/page.tsx`
**Descripción:** Todos los contratos corporativos con estado  
**Client Component:** `ContractsClient.tsx`  
**Endpoints:** `GET /crm/contracts`

---

#### `src/app/operator/erp/crm/contracts/[id]/page.tsx`
**Descripción:** Detalle del contrato con términos y documento firmado  
**Client Component:** `ContractDetailClient.tsx`  
**Componentes:** `ContractTermsCard.tsx`, `ContractDocumentViewer.tsx`, `ContractStatusBadge.tsx`  
**Endpoints:** `GET /crm/contracts/:id`, `POST /crm/contracts/:id/activate`, `POST /crm/contracts/:id/cancel`

---

#### `src/app/operator/erp/crm/invoices/page.tsx`
**Descripción:** Todas las facturas corporativas con filtros por estado y cliente  
**Client Component:** `CorporateInvoicesClient.tsx`

```
Filtros: [Estado ▼] [Cliente ▼] [Periodo ▼]

┌─ Factura ────┬─ Cliente ──────┬─ Periodo ───┬─ Total ────┬─ Vence ──┬─ Estado ────┬─ Acciones ─┐
│ INV-2026-002 │ Atlas Logistics│ Feb 2026    │ 2.340,00€  │ 28 Feb   │ 🟡 Enviada  │ [PDF] [✓]  │
│ INV-2026-001 │ Royal Air      │ Ene 2026    │ 1.890,00€  │ 31 Ene   │ 🟢 Pagada   │ [PDF]      │
└──────────────┴────────────────┴─────────────┴────────────┴──────────┴─────────────┴────────────┘
```

**Endpoints:** `GET /crm/invoices`, `POST /crm/invoices/generate`, `POST /crm/invoices/:id/send`, `POST /crm/invoices/:id/mark-paid`

---

#### `src/app/operator/erp/crm/invoices/[id]/page.tsx`
**Descripción:** Detalle de factura con preview PDF inline y acciones  
**Client Component:** `InvoiceDetailClient.tsx`  
**Componentes:** `InvoicePDFViewer.tsx` (iframe con el S3 presigned URL del PDF), `InvoiceActionButtons.tsx`

---

### 3.9 Analytics — Dashboard ejecutivo

#### `src/app/operator/erp/analytics/page.tsx`
**Descripción:** Dashboard ejecutivo principal — vista de 30.000 pies  
**Client Component:** `AnalyticsDashboardClient.tsx`

```
┌── PANEL EJECUTIVO ─────────────────────────────────────────────────────────────────┐
│                                                    📅 Hoy: 21 Feb 2026  [Exportar] │
├──────────────┬──────────────┬──────────────┬────────────────────────────────────── │
│  💰 Ingresos │  📦 Reservas │  🚗 Ocupación│  🚨 Alertas                           │
│  1.560 €     │     7 hoy    │   50,0%      │  1 crítica                            │
│  ▲ +12% vs   │  ▲ +2 vs ayer│  ▼ -5% vs    │   3 avisos                           │
│    ayer      │              │    sem. ant  │                                       │
├──────────────┴──────────────┴──────────────┴────────────────────────────────────── │
│                                                                                    │
│  [Gráfico ingresos 30 días]          [Ocupación por categoría]                    │
│                                                                                    │
│  [Top 5 vehículos más rentables]     [Actividad pendiente]                        │
│                                      · 2 docs por revisar                         │
│                                      · 1 damage claim abierto                     │
│                                      · 1 ITV vence en 7 días                     │
└────────────────────────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `OverviewKPICards.tsx` — 4 KPI cards con tendencia (vs ayer, vs semana, vs mes)
- `RevenueTrendChart.tsx` — Gráfico de ingresos en los últimos 30 días (línea)
- `OccupancyByCategory.tsx` — Barras de ocupación por categoría de vehículo
- `TopVehiclesTable.tsx` — Top 5 vehículos por RevPAC
- `PendingActionsWidget.tsx` — Lista de acciones pendientes con links directos
- `ChannelMixChart.tsx` — Donut: Online vs POS vs Corporativo
- `FleetStatusWidget.tsx` — Mini mapa de estado de flota

**Endpoints:** `GET /analytics/overview`, `GET /analytics/fleet`, `GET /analytics/revenue`, `GET /analytics/top-vehicles`

---

#### `src/app/operator/erp/analytics/revenue/page.tsx`
**Descripción:** Análisis de ingresos detallado por período, canal y categoría  
**Client Component:** `RevenueAnalyticsClient.tsx`  
**Componentes:** `DateRangePicker.tsx`, `RevenueBreakdownTable.tsx`, `RevenueByChannelChart.tsx`, `RevenueByCategoryChart.tsx`

---

#### `src/app/operator/erp/analytics/occupancy/page.tsx`
**Descripción:** Análisis de ocupación de flota — % por día, semana, mes  
**Client Component:** `OccupancyAnalyticsClient.tsx`  
**Componentes:** `OccupancyHeatmap.tsx` (cada día del mes coloreado por % ocupación), `OccupancyByVehicleTable.tsx`

---

#### `src/app/operator/erp/analytics/forecast/page.tsx`
**Descripción:** Proyección de ingresos próximos 30 días (solo ADMIN)  
**Client Component:** `ForecastClient.tsx`  
**Endpoints:** `GET /analytics/forecast`

---

### 3.10 Audit Log

#### `src/app/operator/erp/audit/page.tsx`
**Descripción:** Registro completo de auditoría con filtros avanzados  
**Client Component:** `AuditLogClient.tsx`

```
Filtros: [Acción ▼] [Entidad ▼] [Actor ▼] [Desde] [Hasta]

┌─ Cuándo ──────────┬─ Quién ────┬─ Qué ──────────────┬─ Entidad ──────┬─ Detalle ──┐
│ 21 Feb 10:30:22   │ Carmen L.  │ STATUS_CHANGE       │ reservation    │ [Ver diff] │
│ 21 Feb 10:28:05   │ Omar K.    │ CHECKIN             │ reservation    │ [Ver diff] │
│ 21 Feb 09:15:43   │ Sistema    │ ALERT_GENERATED     │ vehicle        │ [Ver diff] │
└───────────────────┴────────────┴─────────────────────┴────────────────┴────────────┘
```

**Componentes:**
- `AuditFilters.tsx`
- `AuditTable.tsx` — Tabla paginada con colores por tipo de acción
- `AuditDiffModal.tsx` — Modal que muestra `old_value` vs `new_value` en formato diff visual

**Endpoints:** `GET /audit?page&action&entityType&actorId&from&to`

---

## 4. Nuevos componentes por categoría

### Componentes ERP de layout
```
src/components/erp/
  ├── ERPSidebar.tsx          ← Nav lateral responsive
  ├── ERPHeader.tsx           ← Breadcrumb + notificaciones
  ├── ERPBreadcrumb.tsx       ← Auto-generado desde ruta
  └── NotificationBell.tsx    ← Badge con alertas críticas + docs pendientes
```

### Componentes de tablas y datos
```
src/components/erp/
  ├── DataTable.tsx           ← Tabla genérica con sort, filtros, paginación, exportación
  ├── StatCard.tsx            ← KPI card con tendencia (▲7% vs ayer)
  ├── StatusBadge.tsx         ← Badge unificado para cualquier enum de estado
  ├── MoneyDisplay.tsx        ← Formatea céntimos → "1.560,00 €" o "15.600 DH"
  ├── DateRangePicker.tsx     ← Selector de rango de fechas
  └── EmptyState.tsx          ← Estado vacío consistente con icono + CTA
```

### Componentes de Charts (Recharts)
```
src/components/erp/charts/
  ├── LineChart.tsx           ← Wrapper de Recharts LineChart
  ├── BarChart.tsx            ← Wrapper de Recharts BarChart
  ├── DonutChart.tsx          ← Para distribuciones (canales, categorías)
  └── OccupancyHeatmap.tsx   ← Mapa de calor calendárico
```

### Componentes de formularios
```
src/components/erp/forms/
  ├── ERPFormField.tsx        ← Input + label + error + hint (extiende el actual)
  ├── ERPSelect.tsx           ← Select con búsqueda para listas largas
  ├── FileUploadField.tsx     ← Upload con presign + progress bar + preview
  ├── SignatureCanvas.tsx     ← Canvas para firma digital
  └── ConfirmDialog.tsx       ← Dialog de confirmación reutilizable
```

### Componentes de POS
```
src/components/pos/
  ├── VehicleSelector.tsx     ← Grid compacto de selección de vehículo
  ├── ReceiptPreview.tsx      ← Vista previa del recibo antes de confirmar
  ├── CashRegisterSummary.tsx ← Resumen gráfico de la caja actual
  └── PaymentMethodSelector.tsx
```

### Componentes de inspección
```
src/components/inspections/
  ├── VehiclePhotoUploader.tsx ← Subida por posición con cámara/file
  ├── InspectionSummaryCard.tsx
  └── DamageMarker.tsx        ← Marcador visual de daños sobre silueta del coche
```

---

## 5. Nuevos stores Zustand

```
src/stores/
  ├── useBookingStore.ts      ← Existente
  ├── useChatStore.ts         ← Existente
  │
  ├── usePosStore.ts          ★ NUEVO
  │   state:
  │     currentSession: PosSession | null
  │     isLoadingSession: boolean
  │   actions:
  │     fetchCurrentSession()
  │     openSession(openingBalance, branchId)
  │     closeSession(closingBalance, notes)
  │     clearSession()
  │
  ├── useFleetStore.ts        ★ NUEVO
  │   state:
  │     vehicles: VehicleWithStatus[]
  │     alerts: VehicleAlert[]
  │     isLoading: boolean
  │   actions:
  │     fetchFleetStatus()
  │     fetchAlerts()
  │     resolveAlert(id)
  │
  ├── useERPNotificationsStore.ts  ★ NUEVO
  │   state:
  │     criticalAlerts: number
  │     pendingDocuments: number
  │     openDamageClaims: number
  │     overdueInvoices: number
  │   actions:
  │     fetchCounts()   ← llamado cada 5 min en background
  │
  └── useAnalyticsStore.ts    ★ NUEVO
      state:
        overview: AnalyticsOverview | null
        selectedPeriod: { from: Date; to: Date }
      actions:
        fetchOverview()
        setPeriod(from, to)
```

---

## 6. Nuevas rutas API proxy (Next.js)

Las rutas proxy de Next.js reenvían al backend con el JWT de la cookie HttpOnly.  
El catch-all existente `/api/admin/[...path]` ya cubre las rutas admin.  
Se necesitan los siguientes nuevos proxy routes:

```
src/app/api/
  ├── admin/[...path]/route.ts    ← Existente — cubre /admin/*
  │
  ├── erp/[...path]/route.ts     ★ NUEVO — cubre TODOS los módulos ERP
  │   Rutas cubiertas:
  │     /branches/*
  │     /employees/*
  │     /audit/*
  │     /pos/*
  │     /inspections/*
  │     /damage-claims/*
  │     /fleet/*
  │     /finance/*
  │     /hrm/*
  │     /crm/*
  │     /analytics/*
  │
  └── (rutas existentes sin cambio)
      ├── auth/session/route.ts
      ├── auth/refresh/route.ts
      ├── chat/route.ts
      ├── exchange-rate/route.ts
      └── sse/proxy/route.ts
```

> **Implementación:** Un único catch-all genérico que reenvía el método HTTP, headers y body al backend. Ya tienes el patrón en `/api/admin/[...path]/route.ts` — es exactamente el mismo, con el prefijo `/api/v1/` correcto. Reutilizar el mismo código, solo cambiar el path base.

---

## 7. Extensiones de páginas existentes

### 7.1 `/operator/admin/vehicles` — VehiclesAdminClient.tsx
Añadir campo `licensePlate` y `branchId` en el formulario de creación/edición de vehículo.

### 7.2 `/operator/admin/users` — UsersAdminClient.tsx
Añadir:
- Filtro por nuevo rol (`CASHIER`, `MECHANIC`, `MANAGER`)
- Campo `branchId` en el modal de edición
- Botón "Ver perfil de empleado" que lleva a `/operator/erp/hrm/employees/:id` si tiene `employee_profile`

### 7.3 `/operator/delivery/[reservationId]` — DeliveryCheckClient.tsx
Añadir botón "Iniciar inspección" después del QR scan que navega a `/operator/erp/pos/inspections/:reservationId`.

### 7.4 `/(customer)/dashboard` — DashboardClient.tsx
Añadir enlace a inspección de check-out cuando la reserva está en `IN_PROGRESS` y la fecha de devolución es hoy o pasada.

---

## 8. Guía de permisos en frontend

### HOC de protección de ruta
```typescript
// src/components/erp/ERPRouteGuard.tsx
// Uso:
<ERPRouteGuard allowedRoles={["MANAGER", "ADMIN"]}>
  <FinanceDashboardClient />
</ERPRouteGuard>
```

### Redirecciones automáticas
```typescript
// Rol no autorizado → /operator/dashboard (su zona habitual)
// No autenticado   → /login?redirect=/operator/erp/analytics
```

### Ocultación de UI por rol
```typescript
// src/hooks/useERPPermissions.ts
const { can } = useERPPermissions();
// can('view:finance')   → MANAGER, ADMIN
// can('create:payroll') → ADMIN
// can('manage:pos')     → CASHIER, OPERATOR, MANAGER, ADMIN
```

---

## 9. Árbol de archivos completo a crear

```
src/
├── app/
│   ├── api/
│   │   └── erp/
│   │       └── [...path]/
│   │           └── route.ts                   ← 1 archivo
│   └── operator/
│       └── erp/
│           ├── layout.tsx                     ← 1 archivo
│           ├── page.tsx                       ← 1 archivo (redirect)
│           ├── analytics/
│           │   ├── page.tsx
│           │   ├── revenue/page.tsx
│           │   ├── occupancy/page.tsx
│           │   └── forecast/page.tsx          ← 4 archivos
│           ├── pos/
│           │   ├── page.tsx
│           │   ├── sessions/
│           │   │   ├── page.tsx
│           │   │   └── [id]/page.tsx
│           │   ├── new/page.tsx
│           │   ├── transactions/page.tsx
│           │   ├── inspections/
│           │   │   └── [reservationId]/
│           │   │       ├── page.tsx
│           │   │       └── view/page.tsx
│           │   └── damage-claims/
│           │       ├── page.tsx
│           │       └── [id]/page.tsx          ← 10 archivos
│           ├── fleet/
│           │   ├── page.tsx
│           │   ├── [vehicleId]/page.tsx
│           │   ├── maintenance/page.tsx
│           │   └── alerts/page.tsx            ← 4 archivos
│           ├── finance/
│           │   ├── page.tsx
│           │   ├── expenses/page.tsx
│           │   ├── pl/page.tsx
│           │   └── vehicle-roi/page.tsx       ← 4 archivos
│           ├── hrm/
│           │   ├── page.tsx
│           │   ├── employees/
│           │   │   ├── page.tsx
│           │   │   └── [id]/page.tsx
│           │   ├── shifts/page.tsx
│           │   └── payroll/page.tsx           ← 5 archivos
│           ├── crm/
│           │   ├── page.tsx
│           │   ├── clients/
│           │   │   ├── page.tsx
│           │   │   └── [id]/page.tsx
│           │   ├── contracts/
│           │   │   ├── page.tsx
│           │   │   └── [id]/page.tsx
│           │   └── invoices/
│           │       ├── page.tsx
│           │       └── [id]/page.tsx          ← 8 archivos
│           └── audit/
│               └── page.tsx                   ← 1 archivo
│
└── components/
    ├── erp/
    │   ├── ERPSidebar.tsx
    │   ├── ERPHeader.tsx
    │   ├── ERPBreadcrumb.tsx
    │   ├── NotificationBell.tsx
    │   ├── DataTable.tsx
    │   ├── StatCard.tsx
    │   ├── StatusBadge.tsx
    │   ├── MoneyDisplay.tsx
    │   ├── DateRangePicker.tsx
    │   ├── EmptyState.tsx
    │   ├── ERPRouteGuard.tsx
    │   └── charts/
    │       ├── LineChart.tsx
    │       ├── BarChart.tsx
    │       ├── DonutChart.tsx
    │       └── OccupancyHeatmap.tsx           ← 14 archivos
    ├── pos/
    │   ├── VehicleSelector.tsx
    │   ├── ReceiptPreview.tsx
    │   ├── CashRegisterSummary.tsx
    │   └── PaymentMethodSelector.tsx          ← 4 archivos
    └── inspections/
        ├── VehiclePhotoUploader.tsx
        ├── InspectionSummaryCard.tsx
        └── DamageMarker.tsx                   ← 3 archivos

src/stores/
    ├── usePosStore.ts
    ├── useFleetStore.ts
    ├── useERPNotificationsStore.ts
    └── useAnalyticsStore.ts                   ← 4 archivos

src/hooks/
    └── useERPPermissions.ts                   ← 1 archivo

──────────────────────────────────────────────
TOTAL ARCHIVOS NUEVOS A CREAR: ~64 archivos
(sin contar Client Components dentro de cada page/)
```

---

## Resumen estadístico

| Dimensión | Cantidad |
|-----------|---------|
| Páginas nuevas (`page.tsx`) | 38 |
| Client Components principales | ~30 |
| Componentes reutilizables nuevos | 21 |
| Stores Zustand nuevos | 4 |
| Proxy API routes nuevas | 1 (catch-all) |
| Hooks nuevos | 1 |
| Páginas existentes con extensión | 4 |
| **Archivos totales a crear** | **~64** |

---

*Documentación de arquitectura completada:*  
*✅ DOC 1 — Modelo de datos (27 tablas, 31 enums, 25 migraciones)*  
*✅ DOC 2 — Mapa de endpoints (138 endpoints, 11 controllers, matriz de permisos)*  
*✅ DOC 3 — Mapa de páginas frontend (38 páginas, 64 archivos, 7 módulos)*

*Siguiente paso: comenzar implementación empezando por **FASE 1 — Fundamentos** (branches + roles extendidos + audit_log + proxy ERP route)*
