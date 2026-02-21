# Plan Maestro de Sprints — Backend NEXUS
## NestJS · TypeORM · PostgreSQL · Redis · BullMQ · Stripe · AWS S3 · SSE

**Versión:** 1.0.0 | **Fecha:** 19 Febrero 2026  
**Generado por:** Ingeniería Inversa del Frontend existente (Next.js 16, 38 páginas)  
**RFC de referencia:** `planificacion/documentacion/RFC.md` (RFC-002)

---

## Principios de este Plan

1. **Contrato antes que código** — Cada sprint entrega primero los tipos TypeScript/DTOs antes del servicio. El Frontend nunca espera.
2. **Tests obligatorios** — Ningún sprint se cierra sin cobertura mínima del 80 % en el módulo entregado.
3. **Zero-trust desde el día 1** — Ningún precio ni cálculo viene del cliente. Todo se valida server-side.
4. **Idempotencia** — Cada endpoint crítico es seguro frente a reintentos.
5. **Migraciones versionadas** — Cero `synchronize: true` en producción. Todas las migraciones tienen `up()` y `down()`.

---

## Inventario de Contratos Frontend → Backend

> Extraído mediante ingeniería inversa de los ficheros del frontend.

### Tipos que el Frontend espera (de `src/types/index.ts`)

```typescript
// Enums que el backend debe respetar exactamente
ReservationStatus: "PENDING_DEPOSIT" | "AWAITING_CAPTURE" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
//                   ↑ Estado intermedio — documentos aprobados, captura Stripe en cola (Saga)
DocumentStatus:    "PENDING_REVIEW" | "APPROVED" | "REJECTED"
VehicleCategory:   "SEDAN" | "SUV" | "LUXURY" | "COMPACT"
UserRole:          "USER" | "OPERATOR" | "ADMIN"
PickupLocation:    "CMN_T1" | "CMN_T2"

// Constantes de negocio duras (de src/lib/constants.ts)
DEPOSIT_AMOUNT_EUR          = 10         // Stripe capture_method: 'manual'
EUR_TO_MAD_RATE             = 10.8       // Sólo en capa display
DOCUMENT_POLLING_INTERVAL   = 30_000 ms  // → reemplazar con SSE
```

### Endpoints requeridos por el Frontend

| Módulo | Método | Ruta | Consumidor |
|--------|--------|------|------------|
| Auth | POST | `/auth/register` | Register page |
| Auth | POST | `/auth/login` | Login page |
| Auth | GET | `/auth/me` | proxy.ts middleware, dashboards |
| Vehicles | GET | `/vehicles` | Catalog, BookingPanel |
| Vehicles | GET | `/vehicles/:id` | BookFlowClient, catalog/[vehicleId] |
| Reservations | POST | `/reservations` | BookFlowClient step 3 (payment) |
| Reservations | GET | `/reservations/my` | Customer dashboard |
| Reservations | GET | `/reservations/:id` | SmartTicketClient, confirmed page |
| Documents | POST | `/documents/presign` | DocumentUploadStep (replace mock) |
| Documents | POST | `/documents/confirm` | DocumentUploadStep post-upload |
| Documents | GET | `/documents/:reservationId` | WaitingRoomClient, CheckInFlow |
| SSE | GET | `/sse/reservation/:id` | WaitingRoomClient (replace setTimeout) |
| Operator | GET | `/operator/deliveries` | operator/delivery page |
| Operator | GET | `/operator/documents/pending` | operator/documents page |
| Operator | PATCH | `/operator/documents/:id/approve` | swipe right |
| Operator | PATCH | `/operator/documents/:id/reject` | swipe left + RejectModal |
| Operator | POST | `/operator/delivery/:id/scan-qr` | QRScannerFAB |
| Operator | GET | `/operator/search` | operator/search page |
| Chat | POST | `/chat` | ContactHub, soporte/chat (replace `/api/chat`) |
| Chat | GET | `/chat/:reservationId` | soporte/chat history |
| Stripe | POST | `/webhooks/stripe` | Stripe Dashboard webhook |

---

## Visión General de Sprints

| Sprint | Nombre | Semana | Entregable Clave |
|--------|--------|--------|-----------------|
| **S-01** | Foundation & Infraestructura | 1 | Proyecto NestJS dockerizado, BD conectada, migrations |
| **S-02** | Auth & RBAC | 2 | JWT, guards, Register/Login/Me |
| **S-03** | Módulo Vehicles (Lectura) | 3 | GET /vehicles, GET /vehicles/:id, seed data |
| **S-04** | Módulo Reservations — Creación | 4 | POST /reservations con pessimistic lock + Stripe PaymentIntent |
| **S-05** | Módulo Reservations — Consulta | 5 | GET /reservations/my, GET /reservations/:id, Smart Ticket data |
| **S-06** | Módulo Documents — S3 Upload | 6 | presign/confirm flow, S3 integration |
| **S-07** | SSE & Waiting Room Real | 7 | GET /sse/reservation/:id, operator doc-review push |
| **S-08** | Panel Operador — Entregas | 8 | delivery list, QR scan endpoint |
| **S-09** | Panel Operador — Documentos | 9 | pending list, approve/reject, SSE trigger |
| **S-10** | Chat Persistido | 10 | POST /chat, GET /chat/:id, push operator |
| **S-11** | Stripe Webhooks | 11 | Idempotent handler, capture/refund |
| **S-12** | BullMQ — Colas de Fondo | 12 | Expiración 15 min, video upload, notificaciones |
| **S-13** | Operator Search & Misc | 13 | GET /operator/search, rate-limit, health-check |
| **S-14** | Testing & QA Integral | 14 | 80 % cobertura, e2e con Supertest |
| **S-15** | Hardening, CI/CD & Producción | 15 | Docker multi-stage, GitHub Actions, ENV vault |

---

---

# SPRINT 01 — Foundation & Infraestructura
**Duración:** Semana 1 | **Objetivo:** El backend responde, la BD existe, las migraciones corren.

## 01.1 Setup del Proyecto NestJS

```bash
# Estructura target del monorepo del backend
backend/
  src/
    app.module.ts
    main.ts
    config/
      database.config.ts
      redis.config.ts
      env.validation.ts
    common/
      decorators/
      filters/
        all-exceptions.filter.ts
      interceptors/
        logging.interceptor.ts
      pipes/
        zod-validation.pipe.ts
  migrations/
  test/
  docker/
    Dockerfile
    docker-compose.yml
  .env.example
  nest-cli.json
  package.json
  tsconfig.json
```

### Tareas

- [ ] `nest new nexus-backend --strict` — TypeScript strict mode, sin Prettier por defecto (usamos eslint)
- [ ] Instalar dependencias base:
  ```
  @nestjs/typeorm typeorm pg               # PostgreSQL
  @nestjs/config class-validator class-transformer
  @nestjs/throttler                        # Rate limiting
  helmet                                   # HTTP security headers
  zod                                      # Request validation (más seguro que class-validator solo)
  uuid                                     # UUID v4 generation
  ```
- [ ] Crear `docker-compose.yml` con servicios: `postgres`, `redis`, `backend`
- [ ] Configurar `ConfigModule.forRoot({ validate })` con `env.validation.ts` usando Zod

### 01.2 Variables de Entorno (`.env.example`)

```env
# App
NODE_ENV=development
PORT=3001
API_PREFIX=api/v1

# PostgreSQL
DATABASE_URL=postgresql://nexus:nexus_secret@localhost:5432/nexus_db
DATABASE_SSL=false

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=changeme_at_least_64_chars_random_string
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_DEPOSIT_EUR=10

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-west-3
AWS_S3_BUCKET=nexus-documents
AWS_S3_PRESIGN_EXPIRES_SECONDS=900

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000

# Operator
OPERATOR_WHATSAPP=212600000000
```

**Validación en `env.validation.ts`** — Zod schema que hace `process.exit(1)` si falta cualquier variable crítica. No puede arrancar el backend con ENV incompleto.

### 01.3 Base de Datos — Migrations Strategy

```typescript
// database.config.ts
TypeOrmModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    url: config.get('DATABASE_URL'),
    ssl: config.get('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsRun: false,        // NUNCA automático en producción
    synchronize: false,          // PROHIBIDO en todos los entornos
    logging: config.get('NODE_ENV') === 'development',
  }),
})
```

**Comandos de migración:**
```bash
npm run migration:generate -- --name InitialSchema
npm run migration:run
npm run migration:revert
```

### 01.4 Filtro Global de Excepciones

```typescript
// all-exceptions.filter.ts
// Convierte TODOS los errores al formato:
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [...],   // detalle de campos
  "timestamp": "2026-02-19T12:00:00.000Z",
  "path": "/api/v1/reservations"
}
```
**El Frontend nunca debe recibir un stack trace.**

### 01.5 Health Check

```
GET /api/v1/health
→ { status: "ok", db: "ok", redis: "ok", version: "1.0.0" }
```

### Criterios de Aceptación S-01

- [ ] `docker compose up` arranca los 3 servicios sin errores
- [ ] `GET /api/v1/health` responde 200 con estado de BD y Redis
- [ ] `npm run migration:run` crea las tablas (aunque estén vacías)
- [ ] Si falta `JWT_SECRET` en ENV, el proceso no arranca
- [ ] `npm run test` pasa (aunque solo hay tests de configuración)

---

---

# SPRINT 02 — Módulo Auth & RBAC
**Duración:** Semana 2 | **Objetivo:** Registro, login, JWT, guards de roles.

## 02.1 Entidades

```typescript
// users.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')      id: string;
  @Column({ unique: true })            email: string;
  @Column({ select: false })           passwordHash: string;  // nunca serializado
  @Column()                            fullName: string;
  @Column({ nullable: true })          phoneNumber: string;
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
                                       role: UserRole;
  @CreateDateColumn()                  createdAt: Date;
  @UpdateDateColumn()                  updatedAt: Date;
}
```

> `passwordHash` tiene `select: false` → nunca aparece en queries salvo cuando se pide explícitamente con `addSelect`.

## 02.2 DTOs (Zod Schemas)

```typescript
// register.dto.ts
export const RegisterSchema = z.object({
  email:       z.string().email(),
  password:    z.string().min(8).max(128),
  fullName:    z.string().min(2).max(100),
  phoneNumber: z.string().regex(/^\+?[0-9\s\-]{7,20}$/).optional(),
});

// login.dto.ts
export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});
```

## 02.3 Endpoints

### `POST /auth/register`

```
Request:  { email, password, fullName, phoneNumber? }
Response: { user: UserPublic, accessToken: string }
Errors:
  409 Conflict → "Email already registered"
  400 BadRequest → Zod validation errors
```

- Hash de contraseña con `bcrypt` (rounds: 12)
- No retornar `passwordHash` jamás

### `POST /auth/login`

```
Request:  { email, password }
Response: { user: UserPublic, accessToken: string }
Errors:
  401 Unauthorized → "Invalid credentials" (mismo mensaje para email y password — no enumerar)
```

- Timing-safe comparison con `bcrypt.compare`
- JWT payload: `{ sub: userId, email, role, iat, exp }`

### `GET /auth/me`

```
Headers:  Authorization: Bearer <token>
Response: UserPublic
Errors:
  401 → Token inválido, expirado o ausente
```

```typescript
// UserPublic — lo que el frontend recibe (src/types/index.ts User)
interface UserPublic {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: "USER" | "OPERATOR" | "ADMIN";
}
```

## 02.4 Guards & Decoradores

```typescript
// @Roles('OPERATOR', 'ADMIN') — decorator
// JwtAuthGuard              — valida Bearer token
// RolesGuard                — verifica role

// Uso en controladores:
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OPERATOR', 'ADMIN')
@Get('operator/deliveries')
```

## 02.5 Migración

```sql
-- Migration: CreateUsersTable
CREATE TYPE user_role AS ENUM ('USER', 'OPERATOR', 'ADMIN');
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  phone_number  VARCHAR(25),
  role          user_role NOT NULL DEFAULT 'USER',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
```

## 02.6 Tests Obligatorios

```
auth.service.spec.ts:
  ✓ register() — crea usuario correctamente
  ✓ register() — lanza 409 si email duplicado
  ✓ login() — retorna JWT válido con credenciales correctas
  ✓ login() — lanza 401 con contraseña incorrecta
  ✓ login() — lanza 401 con email inexistente
  ✓ validateToken() — retorna User para token válido
  ✓ validateToken() — lanza 401 para token expirado

auth.e2e.spec.ts:
  ✓ POST /auth/register — 201 con token
  ✓ POST /auth/register — 409 duplicado
  ✓ POST /auth/login    — 200 con token
  ✓ POST /auth/login    — 401 credenciales inválidas
  ✓ GET  /auth/me       — 200 con token válido
  ✓ GET  /auth/me       — 401 sin token
```

### Criterios de Aceptación S-02

- [ ] El análisis estático (eslint + tsc) pasa sin warnings
- [ ] `POST /auth/register` nunca expone `passwordHash` en ninguna respuesta
- [ ] El JWT lleva `role` en el payload y los guards lo validan
- [ ] Un usuario con `role: USER` recibe 403 en endpoints de `OPERATOR`
- [ ] La cobertura del módulo auth es ≥ 80 %

---

---

# SPRINT 03 — Módulo Vehicles (Catálogo)
**Duración:** Semana 3 | **Objetivo:** Catálogo de vehículos con disponibilidad real.

## 03.1 Entidad

```typescript
@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')   id: string;
  @Column({ unique: true })         licensePlate: string;
  @Column()                         brand: string;
  @Column()                         model: string;
  @Column({ type: 'enum', enum: VehicleCategory })
                                    category: VehicleCategory;
  @Column({ type: 'decimal', precision: 10, scale: 2 })
                                    pricePerDay: number;
  @Column({ type: 'enum', enum: ['AUTOMATIC','MANUAL'] })
                                    transmission: string;
  @Column({ type: 'smallint' })     seats: number;
  @Column({ type: 'smallint' })     luggageCount: number;
  @Column({ type: 'text', array: true, default: '{}' })
                                    features: string[];
  @Column()                         imageUrl: string;
  @Column({ type: 'text', array: true, default: '{}' })
                                    imageUrls: string[];
  @Column({ nullable: true })       jawazTagId: string;
  @Column({ nullable: true })       simCardNumber: string;
  @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.AVAILABLE })
                                    status: VehicleStatus;
  @CreateDateColumn()               createdAt: Date;
  @UpdateDateColumn()               updatedAt: Date;
}
```

## 03.2 Disponibilidad Real

Un vehículo está **no disponible** si tiene alguna reserva con `status IN ('CONFIRMED', 'IN_PROGRESS')` que solape con el rango solicitado.

```typescript
// vehicles.service.ts
async findAvailable(query: VehicleQueryDto): Promise<Vehicle[]> {
  const { pickupDate, returnDate, category } = query;

  const qb = this.vehicleRepo.createQueryBuilder('v')
    .where('v.status = :status', { status: VehicleStatus.AVAILABLE });

  if (category && category !== 'ALL') {
    qb.andWhere('v.category = :category', { category });
  }

  if (pickupDate && returnDate) {
    // Excluir vehículos con reservas solapadas
    qb.andWhere(`v.id NOT IN (
      SELECT r.vehicle_id FROM reservations r
      WHERE r.status IN ('CONFIRMED', 'IN_PROGRESS')
        AND r.start_time < :returnDate
        AND r.end_time   > :pickupDate
    )`, { pickupDate, returnDate });
  }

  return qb.orderBy('v.price_per_day', 'ASC').getMany();
}
```

## 03.3 Endpoints

### `GET /vehicles`

```
Query: ?category=SUV&pickupDate=2026-03-01T10:00:00Z&returnDate=2026-03-05T10:00:00Z

Response: Vehicle[]
// Vehicle shape EXACTO según src/types/index.ts:
{
  "id": "uuid",
  "model": "A4",
  "brand": "Audi",
  "category": "SEDAN",
  "pricePerDay": 160,
  "currency": "EUR",           // siempre "EUR"
  "imageUrl": "https://...",
  "imageUrls": ["..."],
  "transmission": "AUTOMATIC",
  "seats": 5,
  "luggageCount": 2,
  "features": ["SIM 5GB", "Tag Jawaz", "Seguro Todo Riesgo"],
  "isAvailable": true
}
```

### `GET /vehicles/:id`

```
Response: Vehicle (mismo shape)
Errors:
  404 → "Vehicle not found"
```

## 03.4 Migración + Seed

```sql
-- Migration: CreateVehiclesTable
CREATE TYPE vehicle_category AS ENUM ('SEDAN','SUV','LUXURY','COMPACT');
CREATE TYPE vehicle_status AS ENUM ('AVAILABLE','MAINTENANCE','RENTED');

CREATE TABLE vehicles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate  VARCHAR(20) NOT NULL UNIQUE,
  brand          VARCHAR(50) NOT NULL,
  model          VARCHAR(50) NOT NULL,
  category       vehicle_category NOT NULL,
  price_per_day  DECIMAL(10,2) NOT NULL,
  transmission   VARCHAR(10) NOT NULL,
  seats          SMALLINT NOT NULL,
  luggage_count  SMALLINT NOT NULL,
  features       TEXT[] NOT NULL DEFAULT '{}',
  image_url      VARCHAR(500) NOT NULL,
  image_urls     TEXT[] NOT NULL DEFAULT '{}',
  jawaz_tag_id   VARCHAR(50),
  sim_card_number VARCHAR(50),
  status         vehicle_status NOT NULL DEFAULT 'AVAILABLE',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_vehicles_category ON vehicles(category);
CREATE INDEX idx_vehicles_status   ON vehicles(status);
```

**Seed** — Los 6 vehículos exactos de `src/lib/mock-data.ts`:
- Audi A4 SEDAN 160€/día
- Mercedes Clase C SEDAN 190€/día
- Hyundai Tucson SUV 120€/día
- BMW Serie 3 LUXURY 220€/día
- Renault Clio COMPACT 65€/día
- Range Rover Evoque SUV 280€/día

## 03.5 Tests

```
vehicles.service.spec.ts:
  ✓ findAvailable() — retorna todos si no hay reservas
  ✓ findAvailable() — excluye vehículo con reserva solapada
  ✓ findAvailable() — incluye vehículo cuya reserva no solapa
  ✓ findAvailable() — filtra por category
  ✓ findOne()       — retorna vehículo correcto por ID
  ✓ findOne()       — lanza 404 para ID inexistente

vehicles.e2e.spec.ts:
  ✓ GET /vehicles            — 200 array
  ✓ GET /vehicles?category=SUV — filtra correctamente
  ✓ GET /vehicles/:id        — 200 shape correcto
  ✓ GET /vehicles/invalid-id — 404
```

### Criterios de Aceptación S-03

- [ ] El campo `isAvailable` se calcula server-side, no se almacena en BD
- [ ] Un vehículo en `MAINTENANCE` nunca aparece en `GET /vehicles`
- [ ] Disponibilidad respeta solapamiento de fechas correctamente
- [ ] El seed funciona: `npm run seed:vehicles`

---

---

# SPRINT 04 — Módulo Reservations: Creación con Stripe
**Duración:** Semana 4 | **Objetivo:** `POST /reservations` seguro, atómico e idempotente.

## 04.1 Entidad

```typescript
@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')   id: string;
  @ManyToOne(() => User)            @JoinColumn({ name: 'user_id' })
                                    user: User;
  @Column()                         userId: string;
  @ManyToOne(() => Vehicle)         @JoinColumn({ name: 'vehicle_id' })
                                    vehicle: Vehicle;
  @Column()                         vehicleId: string;
  @Column({ type: 'enum', enum: PickupLocation })
                                    pickupLocation: PickupLocation;
  @Column({ type: 'timestamptz' })  startTime: Date;
  @Column({ type: 'timestamptz' })  endTime: Date;
  @Column({ type: 'smallint' })     totalDays: number;        // server-side
  @Column({ type: 'decimal', precision: 10, scale: 2 })
                                    totalPriceEur: number;    // server-side
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 10 })
                                    depositPaidEur: number;
  @Column({ type: 'decimal', precision: 10, scale: 2 })
                                    balanceDueEur: number;    // server-side
  @Column({ type: 'enum', enum: ReservationStatus, default: 'PENDING_DEPOSIT' })
                                    status: ReservationStatus;
  @Column({ nullable: true, unique: true })
                                    stripePaymentIntentId: string;
  @Column({ nullable: true, unique: true })
                                    qrCodeHash: string;
  @Column({ nullable: true })       customerName: string;    // desnorm.
  @Column({ nullable: true })       customerPhone: string;   // desnorm.
  @Column({ nullable: true, type: 'timestamptz' })
                                    arrivalTime: Date;
  @Column({ nullable: true })       deliveredBy: string;
  @Column({ nullable: true, type: 'timestamptz' })
                                    deliveredAt: Date;
  @CreateDateColumn()               createdAt: Date;
  @UpdateDateColumn()               updatedAt: Date;
}
```

## 04.2 DTO de Creación

```typescript
export const CreateReservationSchema = z.object({
  vehicleId:      z.string().uuid(),
  pickupLocation: z.enum(['CMN_T1', 'CMN_T2']),
  startTime:      z.string().datetime({ offset: true }),  // ISO 8601 con offset
  endTime:        z.string().datetime({ offset: true }),
  customerName:   z.string().min(2).max(100),
  customerPhone:  z.string().regex(/^\+?[0-9\s\-]{7,20}$/),
  // ⚠️ NUNCA aceptar totalPriceEUR del cliente — Alert RFC §3.1
});
```

## 04.3 Lógica de Creación (Transacción ACID)

```typescript
// reservations.service.ts
async create(dto: CreateReservationDto, user: User): Promise<CreateReservationResponse> {
  return this.dataSource.transaction(async (manager) => {

    // 1. BLOQUEO PESIMISTA — evita overbooking bajo concurrencia
    const vehicle = await manager.findOne(Vehicle, {
      where: { id: dto.vehicleId, status: VehicleStatus.AVAILABLE },
      lock: { mode: 'pessimistic_write' },   // SELECT ... FOR UPDATE
    });
    if (!vehicle) throw new ConflictException('Vehicle not available');

    // 2. VALIDAR FECHAS server-side
    const start = new Date(dto.startTime);
    const end   = new Date(dto.endTime);
    if (end <= start) throw new BadRequestException('endTime must be after startTime');
    if (start < new Date()) throw new BadRequestException('startTime must be in the future');

    // 3. VERIFICAR SOLAPAMIENTO dentro de la transacción
    const conflict = await manager.findOne(Reservation, {
      where: {
        vehicleId: dto.vehicleId,
        status: In(['CONFIRMED', 'IN_PROGRESS']),
        startTime: LessThan(end),
        endTime:   MoreThan(start),
      },
    });
    if (conflict) throw new ConflictException('Vehicle already reserved for these dates');

    // 4. CALCULAR PRECIO server-side (NUNCA del cliente)
    const totalDays     = differenceInCalendarDays(end, start);
    const totalPriceEur = totalDays * Number(vehicle.pricePerDay);
    const depositEur    = Number(process.env.STRIPE_DEPOSIT_EUR) || 10;
    const balanceDueEur = totalPriceEur - depositEur;

    // 5. CREAR STRIPE PAYMENT INTENT
    const intent = await this.stripe.paymentIntents.create({
      amount:         depositEur * 100,        // en céntimos
      currency:       'eur',
      capture_method: 'manual',               // se captura tras check-in
      metadata: {
        vehicleId:  dto.vehicleId,
        userId:     user.id,
        totalDays:  String(totalDays),
      },
      idempotency_key: `res-${user.id}-${dto.vehicleId}-${dto.startTime}`,
    });

    // 6. PERSISTIR RESERVA
    const reservation = manager.create(Reservation, {
      userId:               user.id,
      vehicleId:            dto.vehicleId,
      pickupLocation:       dto.pickupLocation,
      startTime:            start,
      endTime:              end,
      totalDays,
      totalPriceEur,
      depositPaidEur:       depositEur,
      balanceDueEur,
      status:               'PENDING_DEPOSIT',
      stripePaymentIntentId: intent.id,
      customerName:         dto.customerName,
      customerPhone:        dto.customerPhone,
    });
    await manager.save(reservation);

    // 7. RETORNAR client_secret para que el Frontend complete el pago
    return {
      reservation: this.toPublicDto(reservation),
      stripeClientSecret: intent.client_secret,
    };
  });
}
```

## 04.4 Response Shape

```typescript
// POST /reservations → 201
{
  "reservation": {
    "id": "uuid",
    "vehicleId": "uuid",
    "pickupDate": "2026-03-01T10:00:00Z",    // startTime
    "returnDate": "2026-03-05T10:00:00Z",    // endTime
    "pickupLocation": "CMN_T2",
    "totalDays": 4,
    "totalPriceEUR": 640,
    "depositPaidEUR": 10,
    "balanceDueEUR": 630,
    "status": "PENDING_DEPOSIT",
    "qrCodeHash": null
  },
  "stripeClientSecret": "pi_xxx_secret_yyy"
}
```

## 04.5 Migración Reservations

```sql
CREATE TYPE reservation_status AS ENUM (
  'PENDING_DEPOSIT',  -- Creada, Stripe no confirmado
  'AWAITING_CAPTURE', -- Documentos aprobados, captura Stripe en cola BullMQ
  'CONFIRMED',        -- Stripe capturado, QR generado
  'IN_PROGRESS',      -- QR escaneado por operador, coche entregado
  'COMPLETED',        -- Reserva finalizada
  'CANCELLED'         -- Cancelada (timeout, pago fallido o manual)
);
CREATE TYPE pickup_location AS ENUM ('CMN_T1','CMN_T2');

CREATE TABLE reservations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES users(id),
  vehicle_id             UUID NOT NULL REFERENCES vehicles(id),
  pickup_location        pickup_location NOT NULL,
  start_time             TIMESTAMPTZ NOT NULL,
  end_time               TIMESTAMPTZ NOT NULL,
  total_days             SMALLINT NOT NULL,
  total_price_eur        DECIMAL(10,2) NOT NULL,
  deposit_paid_eur       DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  balance_due_eur        DECIMAL(10,2) NOT NULL,
  status                 reservation_status NOT NULL DEFAULT 'PENDING_DEPOSIT',
  stripe_payment_intent_id VARCHAR(100) UNIQUE,
  qr_code_hash           VARCHAR(200) UNIQUE,
  customer_name          VARCHAR(100),
  customer_phone         VARCHAR(25),
  arrival_time           TIMESTAMPTZ,
  delivered_by           UUID REFERENCES users(id),
  delivered_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Índice para evitar overbooking (búsquedas de solapamiento)
CREATE INDEX idx_reservations_vehicle_dates
  ON reservations(vehicle_id, start_time, end_time)
  WHERE status IN ('CONFIRMED','IN_PROGRESS');

CREATE INDEX idx_reservations_user   ON reservations(user_id);
CREATE INDEX idx_reservations_status ON reservations(status);
```

## 04.6 Tests

```
reservations.service.spec.ts:
  ✓ create() — calcula totalDays y totalPriceEur correctamente (no del cliente)
  ✓ create() — lanza 409 si el vehículo no existe o no está disponible
  ✓ create() — lanza 409 si hay solapamiento de fechas
  ✓ create() — lanza 400 si endTime <= startTime
  ✓ create() — lanza 400 si startTime en el pasado
  ✓ create() — el pago de Stripe se crea con capture_method:'manual'
  ✓ create() — idempotency key previene duplicados en Stripe

reservations.e2e.spec.ts:
  ✓ POST /reservations — 201 con stripeClientSecret
  ✓ POST /reservations — 401 sin autenticación
  ✓ POST /reservations — 409 con fechas solapadas (segunda llamada)
  ✓ POST /reservations — rechaza totalPriceEUR del cliente (campo ignorado)
```

### Criterios de Aceptación S-04

- [ ] El precio NUNCA viene del body del cliente — si alguien lo envía, se ignora y se recalcula
- [ ] Dos requests concurrentes para el mismo vehículo y mismo rango → solo una triunfa
- [ ] `stripe_payment_intent_id` es único en BD
- [ ] La transacción hace rollback si Stripe falla (no quedan reservas huérfanas)
- [ ] No existen reservas en `PENDING_DEPOSIT` de más de 15 minutos (manejado en S-12)

---

---

# SPRINT 05 — Módulo Reservations: Consulta & Smart Ticket
**Duración:** Semana 5 | **Objetivo:** El cliente puede ver sus reservas y el Smart Ticket tiene datos reales.

## 05.1 Endpoints

### `GET /reservations/my`

```
Auth: Bearer [USER token]
Response: Reservation[]  // las reservas del usuario autenticado
// Include: vehicle relation (para mostrar brand, model, imageUrl)
```

### `GET /reservations/:id`

```
Auth: Bearer [USER o OPERATOR token]
// USER solo puede ver sus propias reservas
// OPERATOR puede ver cualquier reserva
Response: Reservation & { vehicle: Vehicle }
Errors:
  404 → "Reservation not found"
  403 → "You don't own this reservation" (si USER intenta ver otra)
```

## 05.2 Smart Ticket Shape

El `SmartTicketClient.tsx` necesita exactamente:

```typescript
// Lo que el Smart Ticket lee del store Zustand (actualmente) → necesita venir del backend:
{
  id: string,                    // reservationId
  vehicleId: string,
  vehicle: {
    brand: string,
    model: string,
    imageUrl: string,
  },
  pickupDate: number,            // epoch ms  (startTime.getTime())
  returnDate: number,            // epoch ms  (endTime.getTime())
  pickupLocation: PickupLocation,
  totalDays: number,
  totalPriceEUR: number,
  depositPaidEUR: number,        // siempre 10
  balanceDueEUR: number,
  status: ReservationStatus,
  qrCodeHash: string | null,     // generado por el backend, NO por el frontend
}
```

**ALERTA CRÍTICA (RFC §7, Security Alert 2):**  
El `SmartTicketClient.tsx` actualmente genera el QR hash client-side:
```typescript
// ❌ ACTUAL (inseguro)
const hash = `NEXUS-${reservationId}-${selectedVehicleId}-${Date.now()}`;
```
Cuando el backend esté listo, `qrCodeHash` vendrá de `GET /reservations/:id`. El frontend debe eliminar esa línea.

## 05.3 Generación del QR Hash

El `qrCodeHash` se genera server-side cuando la reserva pasa a `CONFIRMED`:

```typescript
// qr.service.ts
generateHash(reservationId: string, vehicleId: string): string {
  const timestamp = Date.now();
  const raw = `NEXUS-${reservationId}-${vehicleId}-${timestamp}`;
  return createHmac('sha256', process.env.QR_SIGNING_SECRET)
    .update(raw)
    .digest('hex')
    .substring(0, 32)
    .toUpperCase();
}

verifyHash(hash: string, reservationId: string): boolean {
  const reservation = await this.reservationRepo.findOne({ where: { qrCodeHash: hash } });
  return reservation?.id === reservationId;
}
```

## 05.4 Tests

```
reservations.service.spec.ts:
  ✓ findMyReservations() — solo retorna reservas del usuario autenticado
  ✓ findById() — 404 si no existe
  ✓ findById() — 403 si USER intenta ver reserva ajena
  ✓ findById() — OPERATOR puede ver cualquier reserva
  ✓ findById() — incluye relación con Vehicle

qr.service.spec.ts:
  ✓ generateHash() — produce strings distintos para mismas entradas en distintos momentos
  ✓ verifyHash()   — retorna true para hash válido
  ✓ verifyHash()   — retorna false para hash alterado
```

### Criterios de Aceptación S-05

- [ ] `GET /reservations/:id` retorna `vehicle` embebido (JOIN correcto)
- [ ] `qrCodeHash` nunca es generado por el cliente
- [ ] El campo `pickupDate` en la respuesta es epoch ms (para compatibilidad con el store Zustand)
- [ ] Un USER no puede ver las reservas de otro USER

---

---

# SPRINT 06 — Módulo Documents: Upload con S3
**Duración:** Semana 6 | **Objetivo:** Subida real de documentos usando Presigned URLs de S3.

## 06.1 Entidad

```typescript
@Entity('reservation_documents')
export class ReservationDocument {
  @PrimaryGeneratedColumn('uuid')   id: string;
  @Column()                         userId: string;
  @Column()                         reservationId: string;
  @Column({ type: 'enum', enum: ['PASSPORT', 'DRIVING_LICENSE'] })
                                    type: 'PASSPORT' | 'DRIVING_LICENSE';
  @Column()                         fileKey: string;      // S3 object key (nunca URL)
  @Column({ type: 'enum', enum: DocumentStatus, default: 'PENDING_REVIEW' })
                                    status: DocumentStatus;
  @Column({ nullable: true })       rejectionReason: string;
  @Column({ nullable: true })       reviewedBy: string;
  @Column({ nullable: true, type: 'timestamptz' })
                                    reviewedAt: Date;
  @CreateDateColumn()               createdAt: Date;
}
```

> Se guarda `fileKey` (ej: `docs/userId/reservationId/PASSPORT.jpg`) no la URL. Las URLs se generan como presigned al leer.

## 06.2 Flujo de Upload (2 pasos)

```
1. Frontend → POST /documents/presign
   Body: { reservationId, type: "PASSPORT" | "DRIVING_LICENSE" }
   Response: { uploadUrl, fileKey, expiresIn: 900 }

2. Frontend → PUT {uploadUrl} (directo a S3, sin pasar por el backend)
   Body: [binary file]

3. Frontend → POST /documents/confirm
   Body: { fileKey, reservationId, type }
   Response: ReservationDocument (con status: "PENDING_REVIEW")
```

## 06.3 Servicio S3

```typescript
// s3.service.ts
async generatePresignedUpload(userId: string, reservationId: string, type: DocumentType) {
  const fileKey = `docs/${userId}/${reservationId}/${type}-${Date.now()}.jpg`;
  const command = new PutObjectCommand({
    Bucket:      this.bucket,
    Key:         fileKey,
    ContentType: 'image/jpeg',
    Metadata:    { userId, reservationId, type },
  });
  const uploadUrl = await getSignedUrl(this.s3Client, command, {
    expiresIn: Number(process.env.AWS_S3_PRESIGN_EXPIRES_SECONDS) || 900,
  });
  return { uploadUrl, fileKey, expiresIn: 900 };
}

async generatePresignedRead(fileKey: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: this.bucket, Key: fileKey });
  return getSignedUrl(this.s3Client, command, { expiresIn: 300 });
}
```

## 06.4 Validaciones en `POST /documents/presign`

- La reserva existe y pertenece al usuario autenticado
- La reserva está en estado `CONFIRMED` o `PENDING_DEPOSIT` (no se puede subir a reserva cancelada)
- No existe ya un documento `APPROVED` del mismo tipo para esa reserva

## 06.5 Respuesta de `GET /documents/:reservationId`

```typescript
// ReservationDocument shape (src/types/index.ts)
{
  "id": "uuid",
  "userId": "uuid",
  "reservationId": "uuid",
  "type": "PASSPORT",
  "fileUrl": "https://s3.../docs/...?X-Amz-...signature",  // presigned URL fresca
  "status": "PENDING_REVIEW",
  "rejectionReason": null,
  "reviewedAt": null
}
```

**ALERTA CRÍTICA (RFC §7, Security Alert 3):**  
El `DocumentUploadStep.tsx` actual guarda la imagen en base64 en `localStorage`:
```typescript
// ❌ ACTUAL (inseguro)
localStorage.setItem(`nexus-pending-${type}`, preview);
```
Con el backend listo, esto se elimina. El flujo es: captura → presign → PUT S3 → confirm.

## 06.6 Migración

```sql
CREATE TYPE document_type AS ENUM ('PASSPORT','DRIVING_LICENSE');
CREATE TYPE document_status AS ENUM ('PENDING_REVIEW','APPROVED','REJECTED');

CREATE TABLE reservation_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id),
  reservation_id   UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  type             document_type NOT NULL,
  file_key         VARCHAR(500) NOT NULL,
  status           document_status NOT NULL DEFAULT 'PENDING_REVIEW',
  rejection_reason VARCHAR(200),
  reviewed_by      UUID REFERENCES users(id),
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_docs_reservation ON reservation_documents(reservation_id);
CREATE INDEX idx_docs_status      ON reservation_documents(status);
-- Evitar duplicados de mismo tipo para misma reserva cuando está aprobado
CREATE UNIQUE INDEX idx_docs_reservation_type_approved
  ON reservation_documents(reservation_id, type)
  WHERE status = 'APPROVED';
```

## 06.7 Tests

```
documents.service.spec.ts:
  ✓ presign() — genera URL válida con fileKey correcto
  ✓ presign() — lanza 403 si la reserva no pertenece al usuario
  ✓ presign() — lanza 409 si ya existe documento APPROVED del mismo tipo
  ✓ confirm() — persiste documento con status PENDING_REVIEW
  ✓ findByReservation() — retorna presigned read URLs (no file keys)

s3.service.spec.ts:
  ✓ generatePresignedUpload() — retorna URL que empieza por https://
  ✓ generatePresignedRead()   — retorna URL con expiración correcta
```

### Criterios de Aceptación S-06

- [ ] El `fileKey` nunca se expone al frontend (solo URLs presigned temporales)
- [ ] Los documentos en localStorage del frontend deben eliminarse — punto de coordinación UI
- [ ] La presigned URL expira en ≤ 15 minutos
- [ ] El tamaño máximo de upload se configura en S3 (no se valida en backend: S3 lo rechaza)

---

---

# SPRINT 07 — SSE: Waiting Room en Tiempo Real
**Duración:** Semana 7 | **Objetivo:** Reemplazar el `setTimeout` mock de `WaitingRoomClient.tsx` con SSE real.

## 07.1 Análisis del Mock Actual

```typescript
// WaitingRoomClient.tsx (actual — mock)
const MOCK_APPROVAL_SECONDS = 25;
// Simula aprobación con setTimeout de 25 segundos
// → REEMPLAZAR con SSE
```

El frontend necesita conectarse a un stream y recibir eventos cuando el operador aprueba/rechaza.

## 07.2 Endpoint SSE

```
GET /sse/reservation/:reservationId
Auth: Bearer [USER token]
Headers de respuesta:
  Content-Type: text/event-stream
  Cache-Control: no-cache
  Connection: keep-alive
  X-Accel-Buffering: no          # desactivar buffering en Nginx
```

## 07.3 Implementación en NestJS

```typescript
// sse.controller.ts
@Get('reservation/:id')
@UseGuards(JwtAuthGuard)
@Sse()
reservationStatus(
  @Param('id') reservationId: string,
  @CurrentUser() user: User,
): Observable<MessageEvent> {

  // Verificar que la reserva pertenece al usuario
  return this.sseService.subscribeToReservation(reservationId, user.id);
}

// sse.service.ts
// Cada reserva tiene un Subject en memoria
private subjects = new Map<string, Subject<MessageEvent>>();

subscribeToReservation(reservationId: string, userId: string): Observable<MessageEvent> {
  if (!this.subjects.has(reservationId)) {
    this.subjects.set(reservationId, new Subject());
  }
  return this.subjects.get(reservationId).asObservable().pipe(
    // Keepalive cada 15s para que los proxies no cierren la conexión
    mergeWith(interval(15_000).pipe(
      map(() => ({ data: { type: 'ping' } }))
    ))
  );
}

// Llamado por DocumentsService cuando el operador aprueba/rechaza
emitDocumentStatus(reservationId: string, documentStatus: DocumentStatus, reason?: string) {
  const subject = this.subjects.get(reservationId);
  if (subject) {
    subject.next({
      data: {
        type: 'DOCUMENT_STATUS_UPDATE',
        documentStatus,
        rejectionReason: reason ?? null,
        timestamp: Date.now(),
      }
    });
    if (documentStatus === 'APPROVED' || documentStatus === 'REJECTED') {
      // Cerrar el stream tras la decisión final
      setTimeout(() => {
        subject.complete();
        this.subjects.delete(reservationId);
      }, 1000);
    }
  }
}
```

## 07.4 Formato de Eventos SSE

```
// Evento 1: conexión establecida
data: {"type":"CONNECTED","reservationId":"uuid","timestamp":1708300000000}

// Evento 2: keepalive (cada 15s)
data: {"type":"ping"}

// Evento 3: operador aprueba
data: {"type":"DOCUMENT_STATUS_UPDATE","documentStatus":"APPROVED","rejectionReason":null,"timestamp":1708300025000}

// Evento 4: operador rechaza
data: {"type":"DOCUMENT_STATUS_UPDATE","documentStatus":"REJECTED","rejectionReason":"Imagen borrosa","timestamp":1708300025000}
```

## 07.5 Cambios en el Frontend (Coordinación NEXUS UI)

```typescript
// WaitingRoomClient.tsx — CAMBIO REQUERIDO
// Reemplazar:
useEffect(() => { /* mock timeouts */ }, []);

// Por:
useEffect(() => {
  const es = new EventSource(
    `/api/sse/reservation/${reservationId}`,  // proxy por Next.js
    { withCredentials: true }
  );
  es.onmessage = (e) => {
    const event = JSON.parse(e.data);
    if (event.type === 'DOCUMENT_STATUS_UPDATE') {
      setDocStatus(event.documentStatus);
      if (event.documentStatus === 'REJECTED') {
        setRejectionReason(event.rejectionReason);
      }
    }
  };
  return () => es.close();
}, [reservationId]);
```

## 07.6 Redis para Multi-instancia

En staging/producción hay múltiples instancias del backend. Los subjects en memoria no funcionan. Se usa Redis Pub/Sub:

```typescript
// Si hay más de 1 instancia:
// - El operador hace PATCH /operator/documents/:id/approve en la instancia A
// - La instancia B tiene el SSE connection del cliente
// →  Redis PUB/SUB: instancia A publica, instancia B recibe y emite al SSE
```

## 07.7 Tests

```
sse.service.spec.ts:
  ✓ subscribeToReservation() — retorna Observable
  ✓ emitDocumentStatus()     — el Observable emite el evento
  ✓ emitDocumentStatus() APPROVED — completa el Observable tras 1s
  ✓ keepalive — emite ping cada 15 segundos
```

### Criterios de Aceptación S-07

- [ ] `WaitingRoomClient.tsx` funciona sin un solo `setTimeout` mock
- [ ] El stream se cierra limpiamente en el servidor cuando el cliente desconecta
- [ ] En desarrollo (1 instancia) funciona con Map en memoria
- [ ] En staging (N instancias) funciona con Redis Pub/Sub

---

---

# SPRINT 08 — Panel Operador: Entregas & QR Scan
**Duración:** Semana 8 | **Objetivo:** El operador ve la lista de entregas del día y puede escanear QRs.

## 08.1 Endpoints

### `GET /operator/deliveries`

```
Auth: Bearer [OPERATOR o ADMIN token]
Query: ?date=2026-02-19  (opcional, default: today)

Response: (Reservation & { vehicle: Vehicle; arrivalTime: string })[]

// Ordenado por arrivalTime ASC (más urgente primero)
// Solo reservas con status CONFIRMED
// Incluye vehicle embebido
```

**Shape exacto** (extraído de `mock-operator-data.ts`):

```typescript
{
  id: "CMN-2026-001",           // el ID real de BD (formato UUID, no el mock CMN-xxx)
  vehicleId: "uuid",
  vehicle: { brand, model, imageUrl, ... },
  pickupDate: "2026-02-19T10:00:00Z",  // ISO string (startTime)
  returnDate:  "2026-02-24T10:00:00Z",
  pickupLocation: "CMN_T2",
  totalDays: 5,
  totalPriceEUR: 800,
  depositPaidEUR: 10,
  balanceDueEUR: 790,
  status: "CONFIRMED",
  qrCodeHash: "NEXUS-xxx",
  customerName: "Ahmed Benjelloun",
  customerPhone: "+212 6 12 34 56 78",
  arrivalTime: "2026-02-19T09:25:00Z"
}
```

### `POST /operator/delivery/:reservationId/scan-qr`

```
Auth: Bearer [OPERATOR o ADMIN]
Body: { qrCodeHash: string }

Lógica:
1. Verificar que qrCodeHash pertenece a la reserva
2. Buscar Reservation con ese hash
3. Si status !== 'CONFIRMED' → 409 "Already processed"
4. Marcar la reserva como 'IN_PROGRESS'
5. Registrar deliveredBy, deliveredAt

Response:
{
  reservation: Reservation,
  message: "Delivery confirmed"
}
```

### `GET /operator/search`

```
Auth: Bearer [OPERATOR o ADMIN]
Query: ?q=Ahmed (busca en customerName, customerPhone, id)

Response: Reservation[]

// Implementar ILIKE en PostgreSQL (case-insensitive)
// Limitar a 50 resultados
// Ordenar por createdAt DESC
```

## 08.2 Servicio de Búsqueda

```typescript
async search(query: string): Promise<Reservation[]> {
  const q = `%${query.trim()}%`;
  return this.reservationRepo.createQueryBuilder('r')
    .leftJoinAndSelect('r.vehicle', 'v')
    .where('r.customer_name ILIKE :q', { q })
    .orWhere('r.customer_phone ILIKE :q', { q })
    .orWhere('CAST(r.id AS TEXT) ILIKE :q', { q })
    .orderBy('r.created_at', 'DESC')
    .take(50)
    .getMany();
}
```

## 08.3 Tests

```
operator.service.spec.ts:
  ✓ getDeliveries() — filtra solo status CONFIRMED
  ✓ getDeliveries() — ordena por arrivalTime ASC
  ✓ scanQr()        — cambia status a IN_PROGRESS
  ✓ scanQr()        — lanza 404 si hash no válido
  ✓ scanQr()        — lanza 409 si ya está IN_PROGRESS
  ✓ search()        — busca por nombre (ILIKE)
  ✓ search()        — busca por teléfono (stripps spaces)
  ✓ search()        — retorna máximo 50 resultados
```

### Criterios de Aceptación S-08

- [ ] Solo `OPERATOR` y `ADMIN` pueden acceder a `/operator/*`
- [ ] `scan-qr` registra `deliveredBy` con el ID del operador autenticado
- [ ] `scan-qr` es idempotente: si se escanea dos veces el mismo QR, responde 409 (no 500)
- [ ] La búsqueda no distingue mayúsculas/minúsculas

---

---

# SPRINT 09 — Panel Operador: Revisión de Documentos
**Duración:** Semana 9 | **Objetivo:** El operador aprueba o rechaza documentos con SSE push al cliente.

## 09.1 Endpoints

### `GET /operator/documents/pending`

```
Auth: Bearer [OPERATOR o ADMIN]
Response: (ReservationDocument & { customerName, uploadedAgo })[]

// Solo documentos con status PENDING_REVIEW
// Ordenar por createdAt ASC (más antiguo primero — justicia de cola)
// Incluir customerName (JOIN con reservations)
// uploadedAgo: "hace 5 minutos" — calculado server-side en UTC
```

### `PATCH /operator/documents/:id/approve`

```
Auth: Bearer [OPERATOR o ADMIN]
Body: {} (vacío)

Lógica (Patrón Saga — Stripe NUNCA dentro de una transacción de BD):
1. Cambiar status del documento → APPROVED
2. Registrar reviewedBy (operador), reviewedAt
3. Si AMBOS documentos de la reserva están APPROVED:
   a. Cambiar reserva.status → AWAITING_CAPTURE  ← estado intermedio, NO CONFIRMED todavía
   b. Generar qrCodeHash (QrService.generateHash) y persistirlo
   c. COMMIT la transacción (liberar bloqueos de BD)
   d. FUERA de la transacción: encolar job BullMQ 'capture-stripe'
   e. SSE al cliente: { type: 'AWAITING_CAPTURE' } — UI muestra "Procesando pago..."
4. Si solo uno está aprobado → SSE: { type: 'DOCUMENT_PARTIAL', approved: 1 }

Response: { document: ReservationDocument, reservationStatus: ReservationStatus }
```

> **⚠️ Regla de oro:** Ninguna llamada HTTP a Stripe puede ocurrir mientras haya un
> bloqueo pesimista activo en PostgreSQL. El BullMQ job se encarga de la captura
> con reintentos automáticos (backoff exponencial, máx 5 intentos).

### `PATCH /operator/documents/:id/reject`

```
Auth: Bearer [OPERATOR o ADMIN]
Body: { reason: string }

Lógica:
1. Cambiar status → REJECTED
2. Registrar rejectionReason, reviewedBy, reviewedAt
3. Disparar SSE: sseService.emitDocumentStatus(reservationId, 'REJECTED', reason)

Response: { document: ReservationDocument }
```

## 09.2 Lógica de Aprobación (Patrón Saga)

> **Principio:** La transacción de BD solo gestiona estado de BD. Stripe es una llamada
> HTTP externa y jamás puede bloquear un `SELECT FOR UPDATE` de PostgreSQL.

```typescript
async approveDocument(documentId: string, operatorId: string) {

  // ── FASE 1: Transacción de BD (rápida, atómica, sin llamadas externas) ──────
  const { reservationId, bothApproved, qrCodeHash } =
    await this.dataSource.transaction(async (manager) => {

      const doc = await manager.findOne(ReservationDocument, {
        where: { id: documentId, status: 'PENDING_REVIEW' },
        lock: { mode: 'pessimistic_write' },
      });
      if (!doc) throw new NotFoundException('Document not found or already reviewed');

      doc.status     = 'APPROVED';
      doc.reviewedBy = operatorId;
      doc.reviewedAt = new Date();
      await manager.save(doc);

      // Verificar si ambos documentos están aprobados
      const allDocs = await manager.find(ReservationDocument, {
        where: { reservationId: doc.reservationId },
      });
      const bothApproved = allDocs.length === 2
        && allDocs.every(d => d.status === 'APPROVED');

      let qrCodeHash: string | null = null;

      if (bothApproved) {
        const reservation = await manager.findOne(Reservation, {
          where: { id: doc.reservationId, status: 'PENDING_DEPOSIT' },
          lock: { mode: 'pessimistic_write' },
        });
        if (reservation) {
          // ✅ Estado intermedio: documentos OK, captura Stripe pendiente
          // ❌ NUNCA: reservation.status = 'CONFIRMED' aquí todavía
          reservation.status     = 'AWAITING_CAPTURE';
          qrCodeHash             = this.qrService.generateHash(
            reservation.id, reservation.vehicleId
          );
          reservation.qrCodeHash = qrCodeHash;
          await manager.save(reservation);
        }
      }

      return { reservationId: doc.reservationId, bothApproved, qrCodeHash };
      // ← COMMIT aquí. Bloqueos liberados. La transacción ha terminado.
  });

  // ── FASE 2: Fuera de la transacción — acciones con efectos externos ─────────
  if (bothApproved) {
    // Encolar la captura de Stripe en BullMQ (retriable, no bloquea BD)
    await this.captureStripeQueue.add(
      'capture',
      { reservationId },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true,
        removeOnFail: false,          // mantener en cola para inspección manual
      }
    );

    // SSE: informar al cliente que la verificación pasó, capturando pago
    this.sseService.emitDocumentStatus(reservationId, 'AWAITING_CAPTURE');
  }

  return { bothApproved, reservationStatus: bothApproved ? 'AWAITING_CAPTURE' : 'PENDING_DEPOSIT' };
}
```

### BullMQ Processor: `capture-stripe`

```typescript
// capture-stripe.processor.ts
@Processor('capture-stripe')
export class CaptureStripeProcessor {
  @Process('capture')
  async handle(job: Job<{ reservationId: string }>) {
    const reservation = await this.reservationRepo.findOne({
      where: { id: job.data.reservationId, status: 'AWAITING_CAPTURE' },
    });
    // Si no está en AWAITING_CAPTURE, alguien ya lo procesó — salir limpiamente
    if (!reservation) return;

    // Llamar a Stripe FUERA de cualquier transacción de BD
    await this.stripe.paymentIntents.capture(reservation.stripePaymentIntentId);

    // Actualizar estado final
    await this.reservationRepo.update(
      { id: reservation.id },
      { status: 'CONFIRMED' },
    );

    // SSE final: reserva confirmada y QR disponible
    this.sseService.emitDocumentStatus(reservation.id, 'APPROVED');
  }
}
```

> **Flujo de fallos:** Si Stripe falla, el job re-intenta con backoff exponencial
> (3s, 6s, 12s, 24s, 48s). Si los 5 intentos fallan, el job queda en `failed`
> y Bull Board alerta al equipo. La reserva queda en `AWAITING_CAPTURE`
> para resolución manual — el cliente ya tiene el QR y puede recoger el coche,
> el equipo ingresa manualmente la captura desde Stripe Dashboard.

## 09.3 Tests

```
documents-operator.service.spec.ts:
  ✓ approveDocument() — cambia status del documento a APPROVED
  ✓ approveDocument() — si ambos aprobados → reserva pasa a AWAITING_CAPTURE (no CONFIRMED)
  ✓ approveDocument() — si ambos aprobados → genera y persiste qrCodeHash
  ✓ approveDocument() — si ambos aprobados → encola job 'capture-stripe' en BullMQ
  ✓ approveDocument() — si ambos aprobados → NO llama a stripe.capture() directamente
  ✓ approveDocument() — si ambos aprobados → emite SSE AWAITING_CAPTURE
  ✓ approveDocument() — si solo uno aprobado → reserva sigue PENDING_DEPOSIT
  ✓ approveDocument() — lanza 404 si documento no existe o ya revisado
  ✓ rejectDocument()  — cambia status a REJECTED
  ✓ rejectDocument()  — emite SSE REJECTED con razón

capture-stripe.processor.spec.ts:
  ✓ handle() — captura el PaymentIntent de Stripe
  ✓ handle() — pasa la reserva de AWAITING_CAPTURE a CONFIRMED
  ✓ handle() — emite SSE APPROVED tras captura exitosa
  ✓ handle() — no hace nada si la reserva no está en AWAITING_CAPTURE (idempotente)
  ✓ handle() — si Stripe falla, BullMQ reintenta (el job no se marca complete)
```

### Criterios de Aceptación S-09

- [ ] `stripe.paymentIntents.capture()` **NUNCA** se llama dentro de una transacción de BD
- [ ] Tras la aprobación del segundo documento, la reserva pasa a `AWAITING_CAPTURE`, no a `CONFIRMED`
- [ ] El job BullMQ `capture-stripe` aparece en Bull Board con estado `waiting` tras la aprobación
- [ ] Si el job falla 5 veces, queda en `failed` (visible en Bull Board) y la reserva permanece en `AWAITING_CAPTURE`
- [ ] El cliente recibe SSE `AWAITING_CAPTURE` en < 500 ms (no SSE `APPROVED` — ese llega tras la captura)
- [ ] Un documento no puede aprobarse dos veces (pessimistic_write garantiza idempotencia)

---

---

# SPRINT 10 — Módulo Chat Persistido
**Duración:** Semana 10 | **Objetivo:** Chat almacenado en BD, notificación push al operador.

## 10.1 Entidad

```typescript
@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')   id: string;
  @Column()                         userId: string;
  @Column({ nullable: true })       reservationId: string;
  @Column()                         text: string;
  @Column({ type: 'enum', enum: ['user','operator','system'] })
                                    sender: 'user' | 'operator' | 'system';
  @Column({ type: 'enum',
    enum: ['sending','sent','delivered','read','error'],
    default: 'sent' })              status: string;
  @CreateDateColumn()               timestamp: Date;
}
```

## 10.2 Endpoints

### `POST /chat`

```
// Reemplaza el Next.js API route /api/chat
Auth: Bearer [USER token]
Body: { messageId, text, reservationId? }

Lógica:
1. Persistir el mensaje en BD
2. Emitir SSE al panel del operador (nuevo mensaje)
3. (Futuro) WhatsApp Business API

Response: { success: true, messageId, receivedAt }
```

### `GET /chat/:reservationId`

```
Auth: Bearer [USER o OPERATOR]
Response: ChatMessage[]  (ordenado por timestamp ASC)
```

### `GET /sse/operator/chat`

```
Auth: Bearer [OPERATOR o ADMIN]
// Stream de nuevos mensajes de chat para el panel del operador
// Formato: { type: 'NEW_MESSAGE', message: ChatMessage }
```

## 10.3 Migración

```sql
CREATE TABLE chat_messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id),
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  text           TEXT NOT NULL,
  sender         VARCHAR(10) NOT NULL,
  status         VARCHAR(10) NOT NULL DEFAULT 'sent',
  timestamp      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_chat_reservation ON chat_messages(reservation_id);
CREATE INDEX idx_chat_user        ON chat_messages(user_id);
```

## 10.4 Tests

```
chat.service.spec.ts:
  ✓ create() — persiste mensaje en BD
  ✓ create() — emite SSE al operador
  ✓ findByReservation() — retorna mensajes ordenados
  ✓ findByReservation() — 403 si USER intenta ver mensajes de otra reserva
```

### Criterios de Aceptación S-10

- [ ] `POST /api/chat` del frontend puede redirigirse a `POST /api/v1/chat`
- [ ] Los mensajes sobreviven a reinicios del servidor (persistencia en BD)
- [ ] El operador ve el mensaje en tiempo real (SSE)

---

---

# SPRINT 11 — Stripe Webhooks (Idempotente)
**Duración:** Semana 11 | **Objetivo:** Manejar eventos Stripe de forma segura e idempotente.

## 11.1 Endpoint

```
POST /webhooks/stripe
Headers: stripe-signature (verificado con STRIPE_WEBHOOK_SECRET)
```

## 11.2 Eventos Manejados

| Evento Stripe | Acción |
|---------------|--------|
| `payment_intent.amount_capturable_updated` | Reserva tiene depósito autorizado → cambia a CONFIRMED si documentos aprobados |
| `payment_intent.payment_failed` | Cancelar reserva → liberar vehículo → notificar cliente |
| `payment_intent.captured` | Confirmar captura exitosa (log) |
| `charge.refunded` | Marcar reserva CANCELLED con refund registrado |

## 11.3 Implementación Idempotente

```typescript
// webhooks.controller.ts
@Post('stripe')
@HttpCode(200)
async handleStripe(
  @RawBody() rawBody: Buffer,
  @Headers('stripe-signature') sig: string,
): Promise<{ received: boolean }> {

  let event: Stripe.Event;
  try {
    event = this.stripe.webhooks.constructEvent(rawBody, sig, this.webhookSecret);
  } catch {
    throw new BadRequestException('Invalid Stripe signature');
  }

  // IDEMPOTENCIA: verificar si ya procesamos este evento
  const alreadyProcessed = await this.webhookLogRepo.findOne({
    where: { stripeEventId: event.id }
  });
  if (alreadyProcessed) {
    return { received: true };  // 200 OK — ya procesado
  }

  // Procesar según tipo
  switch (event.type) {
    case 'payment_intent.payment_failed':
      await this.reservationsService.cancelByPaymentIntent(
        (event.data.object as Stripe.PaymentIntent).id
      );
      break;
    // ...
  }

  // Registrar evento procesado
  await this.webhookLogRepo.save({ stripeEventId: event.id, processedAt: new Date() });
  return { received: true };
}
```

## 11.4 Tabla de Log de Webhooks

```sql
CREATE TABLE stripe_webhook_logs (
  stripe_event_id VARCHAR(100) PRIMARY KEY,
  event_type      VARCHAR(100) NOT NULL,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 11.5 Tests

```
webhooks.service.spec.ts:
  ✓ handlePaymentFailed() — cancela reserva
  ✓ handlePaymentFailed() — idempotente (segunda llamada no duplica acción)
  ✓ signature inválida → 400
  ✓ evento desconocido → 200 y log sin acción
```

### Criterios de Aceptación S-11

- [ ] `constructEvent` con firma inválida siempre retorna 400 (jamás 500)
- [ ] El mismo `event.id` de Stripe procesado dos veces → misma respuesta 200, sin efecto duplicado
- [ ] Raw body middleware preserva el payload sin modificar (necesario para firma)

---

---

# SPRINT 12 — BullMQ: Colas de Fondo
**Duración:** Semana 12 | **Objetivo:** Automatizar expiración de reservas, limpieza y notificaciones.

## 12.1 Colas Definidas

| Cola | Trigger | Acción | Delay |
|------|---------|--------|-------|
| `reservation-expiry` | POST /reservations | Cancelar si sigue PENDING_DEPOSIT | 15 min |
| `capture-stripe` | PATCH /documents/:id/approve (ambos) | Capturar PaymentIntent + pasar a CONFIRMED | inmediato |
| `document-cleanup` | Document reject | Borrar S3 objects de documentos rechazados | 5 min |
| `notification-push` | Varios eventos | WhatsApp/Email al cliente | inmediato |

> **Nota sobre `capture-stripe`:** Esta cola es el corazón del patrón Saga de S-09.
> Es la única forma segura de llamar a Stripe sin mantener un lock de BD abierto.

## 12.2 Cola: `reservation-expiry`

```typescript
// Al crear reserva, encolar con 15 min de delay:
await this.reservationExpiryQueue.add(
  'expire',
  { reservationId: reservation.id },
  {
    delay:    15 * 60 * 1000,
    attempts: 3,
    backoff:  { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail:     false,
  }
);

// El processor — con bloqueo pesimista para evitar race condition con webhook Stripe:
@Processor('reservation-expiry')
export class ReservationExpiryProcessor {
  @Process('expire')
  async handle(job: Job<{ reservationId: string }>) {
    await this.dataSource.transaction(async (manager) => {

      // ✅ CORRECTO: status en el WHERE + pessimistic_write
      // Si el webhook de Stripe ya confirmó la reserva en los últimos milisegundos,
      // esta query devuelve null y el worker sale limpiamente sin cancelar nada.
      // ❌ INCORRECTO (patrón anterior): findOne sin WHERE de status → fetch-then-check
      const reservation = await manager.findOne(Reservation, {
        where: {
          id:     job.data.reservationId,
          status: 'PENDING_DEPOSIT',          // ← condición atómica con el lock
        },
        lock: { mode: 'pessimistic_write' },  // ← SELECT FOR UPDATE
      });

      // Si no está en PENDING_DEPOSIT, el webhook ya la procesó — no hacer nada
      if (!reservation) return;

      // Marcar como cancelada (dentro de la transacción)
      await manager.update(Reservation,
        { id: reservation.id },
        { status: 'CANCELLED' }
      );

      // Cancelar PaymentIntent en Stripe FUERA de la transacción
      // (guardamos el intentId antes del commit)
      const intentId = reservation.stripePaymentIntentId;

      // ← COMMIT aquí, bloqueo liberado
      return intentId;
    }).then(async (intentId) => {
      // FASE 2: Stripe fuera de la transacción de BD
      if (intentId) {
        await this.stripe.paymentIntents.cancel(intentId).catch((err) => {
          // Si ya fue cancelado o capturado, Stripe retorna error — lo ignoramos
          this.logger.warn(`Stripe cancel skipped for ${intentId}: ${err.message}`);
        });
      }
    });
  }
}
```

> **Por qué el status en el WHERE es crítico:**  
> El webhook `payment_intent.amount_capturable_updated` puede llegar en el segundo 14:59.
> Si BullMQ hace `findOne` sin filtrar por status, obtiene la reserva (en cualquier estado)
> y luego chequea — hay una ventana de tiempo entre el `findOne` y el `if` donde el webhook
> puede confirmarla. Con `status: 'PENDING_DEPOSIT'` en el `WHERE` + `FOR UPDATE`, ambas
> operaciones son atómicas: quien llega primero gana el lock y el otro ve `null`.

## 12.3 Bull Board (Monitor de Colas)

```typescript
// BullBoard para ver el estado de las colas:
// GET /admin/queues → UI de Bull Board
// Solo accesible para ADMIN
```

## 12.4 Tests

```
reservation-expiry.processor.spec.ts:
  ✓ cancela reserva PENDING_DEPOSIT tras 15 min
  ✓ no cancela reserva CONFIRMED (SELECT FOR UPDATE devuelve null — idempotente)
  ✓ no cancela reserva AWAITING_CAPTURE (documentos aprobados, Stripe en proceso)
  ✓ cancela el PaymentIntent en Stripe FUERA de la transacción de BD
  ✓ si Stripe.cancel() falla, el job NO falla (error swallowed con warning log)
  ✓ retry en caso de error de BD (máx 3 intentos)
  ✓ race condition simulada: webhook confirma en T+14:59 → worker no cancela
```

### Criterios de Aceptación S-12

- [ ] Ninguna reserva en `PENDING_DEPOSIT` dura más de 16 minutos (15 + 1 margen)
- [ ] La condición `status: 'PENDING_DEPOSIT'` está en el `WHERE` del `SELECT FOR UPDATE`, no en un `if` post-fetch
- [ ] Stripe `paymentIntents.cancel()` nunca se llama dentro de una transacción de BD
- [ ] Los jobs fallidos se retienen en la cola para inspección
- [ ] Bull Board accesible solo para `ADMIN`
- [ ] Una reserva en `AWAITING_CAPTURE` nunca es cancelada por este processor

---

---

# SPRINT 13 — Rate Limiting, Logs & Miscelánea
**Duración:** Semana 13 | **Objetivo:** Seguridad de superficie, observabilidad y endpoints restantes.

## 13.1 Rate Limiting

```typescript
// main.ts
app.use(
  ThrottlerModule.forRoot({
    ttl:   60,   // ventana de 60 segundos
    limit: 30,   // máx 30 requests por IP
  })
);

// Excepciones por ruta:
// POST /auth/login     → 5 intentos / minuto / IP
// POST /auth/register  → 3 intentos / minuto / IP
// POST /chat           → 20 mensajes / minuto / usuario
// GET  /sse/*          → excluido del throttler
```

## 13.2 Headers de Seguridad (Helmet)

```typescript
app.use(helmet({
  contentSecurityPolicy: false,  // Next.js maneja CSP
  crossOriginEmbedderPolicy: false,
}));
```

## 13.3 Logging Estructurado

```typescript
// logging.interceptor.ts — cada request loguea:
{
  "level": "info",
  "method": "POST",
  "path": "/api/v1/reservations",
  "statusCode": 201,
  "duration": 342,
  "userId": "uuid",
  "ip": "1.2.3.4",
  "timestamp": "2026-02-19T12:00:00.000Z"
}
```

## 13.4 CORS

```typescript
app.enableCors({
  origin:      [process.env.FRONTEND_URL, 'http://localhost:3000'],
  credentials: true,
  methods:     ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
});
```

## 13.5 Paginación

Todos los endpoints de listado admiten `?page=1&limit=20`:

```typescript
// pagination.dto.ts
export class PaginationDto {
  @IsOptional() @IsInt() @Min(1)    page:  number = 1;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit: number = 20;
}
// Response wrapper:
{ data: T[], total, page, limit, totalPages }
```

### Criterios de Aceptación S-13

- [ ] `POST /auth/login` responde 429 tras 5 intentos en 1 minuto
- [ ] Los logs van a stdout en formato JSON (compatible con CloudWatch/Datadog)
- [ ] No existen endpoints sin rate limiting (excepto `/health` y SSE)

---

---

# SPRINT 14 — Testing & QA Integral
**Duración:** Semana 14 | **Objetivo:** 80 % de cobertura en todos los módulos. E2E flow completo.

## 14.1 Suite de Tests

### Unit Tests (Jest)

```
- auth.service.spec.ts         ✓ 7/7
- vehicles.service.spec.ts     ✓ 6/6
- reservations.service.spec.ts ✓ 10/10
- documents.service.spec.ts    ✓ 8/8
- sse.service.spec.ts          ✓ 4/4
- operator.service.spec.ts     ✓ 8/8
- chat.service.spec.ts         ✓ 4/4
- webhooks.service.spec.ts     ✓ 4/4
- qr.service.spec.ts           ✓ 3/3
- reservation-expiry.spec.ts   ✓ 4/4
```

### Integration Tests (Supertest + TestContainers)

```typescript
// Usar TestContainers para levantar PostgreSQL y Redis reales en CI:
beforeAll(async () => {
  pgContainer    = await new PostgreSqlContainer().start();
  redisContainer = await new GenericContainer('redis:7').start();
  // Configurar módulo de test con estas conexiones
});
```

### E2E Flow Completo

```
1. POST /auth/register         → token USER
2. GET  /vehicles              → lista (6 vehículos)
3. POST /reservations          → { reservation, stripeClientSecret }
4. (Simular Stripe confirm_payment)
5. POST /documents/presign     → { uploadUrl, fileKey }
6. POST /documents/confirm     → { document PENDING_REVIEW }
7. GET  /sse/reservation/:id   → stream abierto
8. [OPERATOR] POST /auth/login → token OPERATOR
9. [OPERATOR] GET  /operator/documents/pending → [doc]
10. [OPERATOR] PATCH /operator/documents/:id/approve
11. [SSE] Recibir DOCUMENT_PARTIAL (1/2 aprobado)
12. POST /documents/presign    (segundo doc)
13. POST /documents/confirm
14. [OPERATOR] PATCH /operator/documents/:id/approve
15. [SSE] Recibir DOCUMENT_STATUS_UPDATE APPROVED
16. GET  /reservations/:id     → status: CONFIRMED, qrCodeHash: "NEXUS-xxx"
17. [OPERATOR] POST /operator/delivery/:id/scan-qr → { status: IN_PROGRESS }
```

## 14.2 Cobertura Mínima

```
Módulo               Statements  Branches
auth                     85%       80%
vehicles                 85%       80%
reservations             85%       82%
documents                80%       80%
sse                      80%       75%
operator                 80%       80%
chat                     80%       75%
webhooks                 80%       80%
qr                       90%       85%
TOTAL                    83%       80%
```

### Criterios de Aceptación S-14

- [ ] `npm run test:cov` pasa con ≥ 80 % en todos los módulos
- [ ] El E2E flow completo pasa sin errores
- [ ] Los tests no dependen de datos hardcoded en prod (usan factories)
- [ ] CI: los tests se ejecutan en cada PR (GitHub Actions)

---

---

# SPRINT 15 — Hardening, CI/CD & Producción
**Duración:** Semana 15 | **Objetivo:** El backend está listo para producción real.

## 15.1 Dockerfile Multi-stage

```dockerfile
# Etapa 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production=false
COPY . .
RUN npm run build

# Etapa 2: Producción
FROM node:20-alpine AS production
RUN addgroup -S nexus && adduser -S nexus -G nexus
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
USER nexus
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

## 15.2 GitHub Actions CI

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: nexus_test
          POSTGRES_USER: nexus
          POSTGRES_PASSWORD: nexus_secret
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run test:cov
      - run: npm run build

  docker:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: nexus-backend:${{ github.sha }}
```

## 15.3 Checklist de Producción

```
Seguridad:
  ☐ JWT_SECRET de al menos 64 chars aleatorios
  ☐ STRIPE_WEBHOOK_SECRET rotado (no el de desarrollo)
  ☐ Credenciales AWS con permisos mínimos (solo S3 PutObject/GetObject en el bucket nexus-documents)
  ☐ PostgreSQL con SSL habilitado
  ☐ Redis con requirepass y TLS
  ☐ Helmet y rate-limit activos en producción

Base de Datos:
  ☐ Migraciones ejecutadas ANTES de desplegar la nueva imagen
  ☐ Backup automático diario de PostgreSQL
  ☐ Connection pool configurado (max: 20 conexiones)

Observabilidad:
  ☐ Logs en JSON a stdout (CloudWatch/Datadog)
  ☐ APM (Datadog / New Relic) configurado
  ☐ /health check en el load balancer
  ☐ Alertas en Stripe Dashboard para webhooks fallidos
  ☐ Bull Board detrás de autenticación ADMIN

Escalabilidad:
  ☐ Redis como session store compartido (para JWT blacklist futura)
  ☐ Redis Pub/Sub para SSE entre múltiples instancias
  ☐ S3 para archivos (no almacenamiento local)
  ☐ Horizontal scaling probado con 2 instancias y concurrencia
```

## 15.4 Variables de Entorno en Producción

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...@rds-endpoint:5432/nexus_db?sslmode=require
REDIS_URL=rediss://...:6380    # rediss:// = TLS
JWT_SECRET=[64 chars mínimo — usar: openssl rand -hex 32]
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... [de Stripe Dashboard → Webhooks]
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-3
AWS_S3_BUCKET=nexus-documents-prod
FRONTEND_URL=https://nexus.ma
```

### Criterios de Aceptación S-15

- [ ] `docker build` sin warnings
- [ ] La imagen no corre como root (`USER nexus`)
- [ ] Las migraciones se ejecutan sin `synchronize: true`
- [ ] `npm audit` sin vulnerabilidades críticas o altas
- [ ] CI pasa en GitHub Actions en < 3 minutos
- [ ] El flujo E2E completo funciona contra el entorno staging

---

---

## Resumen de Todos los Sprints

| Sprint | Semana | Módulo | Tests | Estado |
|--------|--------|--------|-------|--------|
| S-01 | 1 | Foundation, Docker, Migrations | Config tests | ⬜ Pendiente |
| S-02 | 2 | Auth, JWT, RBAC, Guards | Unit + E2E | ⬜ Pendiente |
| S-03 | 3 | Vehicles (catálogo + disponibilidad) | Unit + E2E | ⬜ Pendiente |
| S-04 | 4 | Reservations (creación, Stripe, locking) | Unit + E2E | ⬜ Pendiente |
| S-05 | 5 | Reservations (consultas, Smart Ticket, QR) | Unit + E2E | ⬜ Pendiente |
| S-06 | 6 | Documents (S3 presign/confirm) | Unit + E2E | ⬜ Pendiente |
| S-07 | 7 | SSE (Waiting Room en tiempo real) | Unit | ⬜ Pendiente |
| S-08 | 8 | Operator: Deliveries, QR Scan, Search | Unit + E2E | ⬜ Pendiente |
| S-09 | 9 | Operator: Document review + SSE push | Unit + E2E | ⬜ Pendiente |
| S-10 | 10 | Chat persistido + SSE operador | Unit + E2E | ⬜ Pendiente |
| S-11 | 11 | Stripe Webhooks (idempotente) | Unit + E2E | ⬜ Pendiente |
| S-12 | 12 | BullMQ (expiración, limpieza) | Unit | ⬜ Pendiente |
| S-13 | 13 | Rate Limiting, Logs, CORS, Paginación | E2E | ⬜ Pendiente |
| S-14 | 14 | Testing & QA Integral (80 % cobertura) | All | ⬜ Pendiente |
| S-15 | 15 | Hardening, Docker prod, CI/CD | All | ⬜ Pendiente |

---

## Alertas de Coordinación UI → Backend

> Estos cambios en el **Frontend** son obligatorios cuando el backend de cada sprint esté listo.

| # | Fichero Frontend | Código Actual (Incorrecto) | Cambio Requerido | Sprint |
|---|-----------------|---------------------------|-----------------|--------|
| 1 | `BookFlowClient.tsx` | `const id = "CMN-" + Date.now()...` | `POST /reservations` → usar `reservation.id` de la respuesta | S-04 |
| 2 | `BookFlowClient.tsx` | Campos de tarjeta mock (`cardNumber`, `expiry`, `cvc`) | Reemplazar con Stripe Elements / `stripe.confirmCardPayment(clientSecret)` | S-04 |
| 3 | `SmartTicketClient.tsx` | `const hash = \`NEXUS-${reservationId}-...\`` | Usar `reservation.qrCodeHash` de `GET /reservations/:id` | S-05 |
| 4 | `SmartTicketClient.tsx` | `const vehicle = MOCK_VEHICLES.find(...)` | Usar `vehicle` de `GET /reservations/:id` | S-05 |
| 5 | `DocumentUploadStep.tsx` | `localStorage.setItem(\`nexus-pending-${type}\`, preview)` | Flujo presign → PUT S3 → confirm | S-06 |
| 6 | `WaitingRoomClient.tsx` | `setTimeout` mock de 25 segundos | `new EventSource('/api/v1/sse/reservation/:id')` | S-07 |
| 7 | `src/app/api/chat/route.ts` | consola.log mock | Redirigir a `POST /api/v1/chat` | S-10 |
| 8 | `src/lib/mock-data.ts` | importado en muchos componentes | Reemplazar todos los imports por `fetch('/api/v1/vehicles')` | S-03 |
| 9 | `src/lib/mock-operator-data.ts` | importado en operator pages | Reemplazar por `fetch('/api/v1/operator/...')` | S-08/S-09 |
| 10 | `src/proxy.ts` | Cookie `nexus_session` JSON mock | Validar JWT con `GET /auth/me` | S-02 |

---

## Dependencias Entre Sprints

```
S-01 (Foundation)
  └── S-02 (Auth)
        ├── S-03 (Vehicles)
        │     └── S-04 (Reservations-Create)
        │           └── S-05 (Reservations-Query)
        │                 └── S-06 (Documents)
        │                       └── S-07 (SSE)
        │                             └── S-09 (Operator Docs)
        └── S-08 (Operator Deliveries)
              └── S-09 (Operator Docs)
                    └── S-10 (Chat)
                          └── S-11 (Webhooks)
                                └── S-12 (BullMQ)
                                      └── S-13 (Hardening)
                                            └── S-14 (Testing)
                                                  └── S-15 (CI/CD)
```

---

*Documento generado mediante ingeniería inversa completa del frontend NEXUS (Next.js 16, 38 páginas, 15 componentes analizados). Cada sprint es ejecutable de forma independiente y produce valor verificable.*
