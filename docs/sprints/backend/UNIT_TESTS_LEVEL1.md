# Unit Tests — Nivel 1: Servicios y Guards

> **Stack:** Jest · NestJS Testing Module · `jest.fn()` mocks (sin BD real)  
> **Principio:** Cada test es aislado, determinista y rápido (< 5 ms por test)  
> **Fecha:** 21 febrero 2026

---

## Índice

1. [Estado actual](#1-estado-actual)
2. [Qué es un Unit Test en este contexto](#2-qué-es-un-unit-test-en-este-contexto)
3. [Arquitectura de mocks](#3-arquitectura-de-mocks)
4. [Suite 1 — ReservationsService ✅ YA EXISTE](#4-suite-1--reservationsservice--ya-existe)
5. [Suite 2 — AuthService 🔴 Por crear](#5-suite-2--authservice--por-crear)
6. [Suite 3 — UsersService 🔴 Por crear](#6-suite-3--usersservice--por-crear)
7. [Suite 4 — QrService 🔴 Por crear](#7-suite-4--qrservice--por-crear)
8. [Suite 5 — VehiclesService 🔴 Por crear](#8-suite-5--vehiclesservice--por-crear)
9. [Suite 6 — RolesGuard 🔴 Por crear](#9-suite-6--rolesguard--por-crear)
10. [Resumen de cobertura objetivo](#10-resumen-de-cobertura-objetivo)
11. [Cómo ejecutar los tests](#11-cómo-ejecutar-los-tests)

---

## 1. Estado actual

| Archivo spec | Servicio | Estado | Tests escritos |
|---|---|---|---|
| `reservations/reservations.service.spec.ts` | `ReservationsService` | ✅ Completo | 13 tests |
| `auth/auth.service.spec.ts` | `AuthService` | 🔴 No existe | 0 tests |
| `users/users.service.spec.ts` | `UsersService` | 🔴 No existe | 0 tests |
| `qr/qr.service.spec.ts` | `QrService` | 🔴 No existe | 0 tests |
| `vehicles/vehicles.service.spec.ts` | `VehiclesService` | 🔴 No existe | 0 tests |
| `common/guards/roles.guard.spec.ts` | `RolesGuard` | 🔴 No existe | 0 tests |

**Objetivo:** pasar de 13 a ~52 unit tests con cobertura de toda la lógica crítica.

---

## 2. Qué es un Unit Test en este contexto

Un Unit Test **NO**:
- Conecta a PostgreSQL real
- Conecta a Redis real
- Llama a Stripe real
- Arranca el servidor HTTP

Un Unit Test **SÍ**:
- Instancia el servicio con el `NestJS Testing Module`
- Reemplaza todas las dependencias (repos, servicios externos) con `jest.fn()`
- Prueba **una función** con entradas controladas
- Verifica que la salida o los efectos son los esperados

```typescript
// Patrón básico de todos los tests
it('debería hacer X cuando Y', async () => {
  // ARRANGE — preparar los datos y mocks
  mockRepo.findOne.mockResolvedValue(someData);

  // ACT — ejecutar la función a testear
  const result = await service.someMethod(input);

  // ASSERT — verificar el resultado
  expect(result).toEqual(expectedOutput);
  expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ ... }));
});
```

---

## 3. Arquitectura de mocks

Todos los archivos spec siguen la misma estructura:

```typescript
// 1. Factory helpers — crean datos de prueba con valores por defecto
function makeUser(overrides = {}): User { ... }
function makeVehicle(overrides = {}): Vehicle { ... }
function makeReservation(overrides = {}): Reservation { ... }

// 2. Mock objects — simulan los repositorios y servicios externos
const mockRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
};

// 3. beforeEach — resetea todos los mocks entre tests
beforeEach(() => {
  jest.clearAllMocks();
  // ...bootstrap del módulo
});

// 4. Tests agrupados por método
describe('methodName()', () => {
  it('happy path', ...);
  it('error case 1', ...);
  it('edge case', ...);
});
```

---

## 4. Suite 1 — ReservationsService ✅ YA EXISTE

**Archivo:** `backend/src/reservations/reservations.service.spec.ts`  
**Tests:** 13 tests completamente implementados

### Tests existentes

#### `create()` — 5 tests
| # | Descripción | Qué valida |
|---|---|---|
| 1 | Happy path — reserva OK | `commitTransaction` llamado, `expiryQueue.add` con delay=15min, `stripeService.createPaymentIntent` con `DEPOSIT_EUR_CENTS=1000` |
| 2 | `pickupDate` en el pasado | Lanza `BadRequestException` **antes** de abrir transaction (sin DB call) |
| 3 | `returnDate <= pickupDate` | Lanza `BadRequestException` |
| 4 | Vehículo no existe | Lanza `NotFoundException`, `rollbackTransaction` llamado |
| 5 | Vehículo con reserva solapada | Lanza `ConflictException`, `rollbackTransaction` llamado |
| 6 | Precio calculado server-side | `totalPriceEurCents = pricePerDay × days` (Zero Trust: nunca del cliente), `depositEurCents` siempre = 1000 |

#### `cancel()` — 4 tests
| # | Descripción | Qué valida |
|---|---|---|
| 1 | Owner cancela su propia reserva `PENDING_DEPOSIT` | `status = CANCELLED`, `cancelPaymentIntent` llamado |
| 2 | USER intenta cancelar reserva de otro user | Lanza `ForbiddenException` |
| 3 | Estado no cancelable (`IN_PROGRESS`) | Lanza `BadRequestException` |
| 4 | Reserva no existe | Lanza `NotFoundException` |

#### `complete()` — 3 tests
| # | Descripción | Qué valida |
|---|---|---|
| 1 | Reserva `IN_PROGRESS` → `COMPLETED` | `status = COMPLETED` |
| 2 | Estado no completable (ej. `CONFIRMED`) | Lanza `BadRequestException` |
| 3 | Reserva no existe | Lanza `NotFoundException` |

#### `findMy()` — 2 tests
| # | Descripción | Qué valida |
|---|---|---|
| 1 | USER role → solo sus reservas | `findAndCount` llamado con `where: { userId: user.id }` |
| 2 | OPERATOR role → todas las reservas | `findAndCount` llamado **sin** filtro de `userId` |

> ✅ Esta suite no requiere ningún trabajo adicional.

---

## 5. Suite 2 — AuthService 🔴 Por crear

**Archivo a crear:** `backend/src/auth/auth.service.spec.ts`  
**Tests a escribir:** 12 tests

### Mocks necesarios

```typescript
const mockUsersService = {
  findByEmailWithPassword: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockImplementation((key: string) => {
    const map: Record<string, string> = {
      JWT_EXPIRES_IN: '7d',
      JWT_REFRESH_EXPIRES_IN: '30d',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
    };
    return map[key] ?? null;
  }),
};
```

### Tests a implementar

#### `register()` — 3 tests

```
CASO 1 — Happy path
  DADO:  usersService.create resuelve con un User válido
  CUANDO: register({ email, password, fullName })
  ENTONCES:
    - bcrypt.hash fue llamado con BCRYPT_ROUNDS=12
    - usersService.create fue llamado con passwordHash (no el password en claro)
    - jwtService.sign fue llamado 2 veces (accessToken + refreshToken)
    - Response contiene { accessToken, refreshToken, expiresIn, user }
    - Response.user NO contiene el campo passwordHash

CASO 2 — Email duplicado
  DADO:  usersService.create lanza ConflictException('Ya existe una cuenta...')
  CUANDO: register({ email: 'existente@test.com', ... })
  ENTONCES: relanza ConflictException (no la envuelve en otra)

CASO 3 — Contraseña hasheada nunca es la original
  DADO:  usersService.create resuelve OK
  CUANDO: register({ password: '123456', ... })
  ENTONCES:
    - El argumento pasado a usersService.create.passwordHash !== '123456'
    - El argumento empieza con '$2b$' (prefijo bcrypt)
```

#### `login()` — 4 tests

```
CASO 1 — Happy path
  DADO:  findByEmailWithPassword resuelve con User { isActive: true, passwordHash: hash_real }
         bcrypt.compare retorna true (password correcto)
  CUANDO: login({ email, password })
  ENTONCES:
    - jwtService.sign llamado con payload { sub: user.id, email, role }
    - Response contiene { accessToken, refreshToken }
    - Response.user.passwordHash es undefined (campo eliminado)

CASO 2 — Usuario no encontrado
  DADO:  findByEmailWithPassword retorna null
  CUANDO: login({ email: 'noexiste@test.com', password })
  ENTONCES: lanza UnauthorizedException('Credenciales incorrectas.')

CASO 3 — Contraseña incorrecta
  DADO:  findByEmailWithPassword retorna User válido
         bcrypt.compare retorna false
  CUANDO: login({ email, password: 'wrong-pass' })
  ENTONCES: lanza UnauthorizedException('Credenciales incorrectas.')
  CRÍTICO: El mensaje de error es IGUAL para email no existente y password incorrecta
           (No filtrar cuál de los dos falló — previene user enumeration)

CASO 4 — Cuenta desactivada
  DADO:  findByEmailWithPassword retorna User { isActive: false }
  CUANDO: login({ email, password })
  ENTONCES: lanza UnauthorizedException('Cuenta desactivada.')
```

#### `refresh()` — 3 tests

```
CASO 1 — Happy path
  DADO:  jwtService.verify retorna payload { sub: userId, email, role }
         usersService.findById retorna User activo
  CUANDO: refresh('valid-refresh-token')
  ENTONCES:
    - jwtService.verify llamado con el refreshSecret correcto
    - jwtService.sign llamado 2 veces (nuevo par de tokens)
    - Response contiene nuevos accessToken y refreshToken

CASO 2 — Refresh token expirado o inválido
  DADO:  jwtService.verify lanza JsonWebTokenError
  CUANDO: refresh('expired-or-forged-token')
  ENTONCES: lanza UnauthorizedException('Refresh token inválido o expirado.')

CASO 3 — Usuario del token ya no existe o está inactivo
  DADO:  jwtService.verify OK
         usersService.findById retorna null (o user.isActive = false)
  CUANDO: refresh('token-de-usuario-eliminado')
  ENTONCES: lanza UnauthorizedException('Usuario no válido.')
```

#### `buildTokenResponse()` — 2 tests (privado, testeable a través de login)

```
CASO 1 — passwordHash nunca en la respuesta
  Verificado implícitamente en login() CASO 1
  Confirmar que { ...user } sin passwordHash no tiene la propiedad

CASO 2 — Refresh token firmado con secret correcto
  jwtService.sign segunda llamada tiene { secret: 'test-refresh-secret' }
  jwtService.sign primera llamada NO tiene `secret` explícito (usa el default)
```

---

## 6. Suite 3 — UsersService 🔴 Por crear

**Archivo a crear:** `backend/src/users/users.service.spec.ts`  
**Tests a escribir:** 10 tests

### Mocks necesarios

```typescript
const mockUsersRepo = {
  createQueryBuilder: jest.fn(),
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};
```

### Tests a implementar

#### `create()` — 4 tests

```
CASO 1 — Happy path
  DADO:  findOne (email existente) retorna null
         create + save retornan nuevo User
  CUANDO: create({ email: 'nuevo@test.com', passwordHash, fullName, phone })
  ENTONCES:
    - Email guardado en lowercase y trimmed ('NUEVO@TEST.COM' → 'nuevo@test.com')
    - fullName guardado con .trim()
    - role por defecto es UserRole.USER (no se puede inyectar otro rol en registro normal)
    - usersRepo.save fue llamado

CASO 2 — Email ya existe
  DADO:  findOne retorna un User existente
  CUANDO: create({ email: 'existente@test.com', ... })
  ENTONCES: lanza ConflictException('Ya existe una cuenta con este email.')

CASO 3 — Email normalizado antes de buscar duplicado
  DADO:  findOne retorna null (email nuevo)
  CUANDO: create({ email: '  TEST@EXAMPLE.COM  ', ... })
  ENTONCES:
    - usersRepo.findOne llamado con email 'test@example.com' (no el original)

CASO 4 — Creación con rol personalizado (seed)
  DADO:  findOne retorna null
  CUANDO: create({ ..., role: UserRole.ADMIN })
  ENTONCES: user creado con role ADMIN (para seeds de base de datos)
```

#### `findByEmailWithPassword()` — 2 tests

```
CASO 1 — Usuario encontrado
  DADO:  createQueryBuilder().getOne() retorna User con passwordHash
  CUANDO: findByEmailWithPassword('user@test.com')
  ENTONCES:
    - addSelect('user.passwordHash') fue llamado
      (columna marcada select:false en la entidad — debe añadirse explícitamente)
    - where llamado con email normalizado (lowercase)
    - Retorna el User completo con passwordHash

CASO 2 — Usuario no encontrado
  DADO:  createQueryBuilder().getOne() retorna null
  CUANDO: findByEmailWithPassword('noexiste@test.com')
  ENTONCES: retorna null (no lanza excepción)
```

#### `findById()` — 2 tests

```
CASO 1 — Usuario activo encontrado
  DADO:  usersRepo.findOne retorna User { isActive: true }
  CUANDO: findById('user-123')
  ENTONCES: retorna el User

CASO 2 — Usuario inactivo o no existe
  DADO:  usersRepo.findOne retorna null
         (TypeORM filtra por isActive: true en la query)
  CUANDO: findById('user-desactivado')
  ENTONCES: retorna null
```

#### `updateMe()` — 2 tests

```
CASO 1 — Actualizar phone
  DADO:  usersRepo.update OK, findOneOrFail retorna User actualizado
  CUANDO: updateMe('user-123', { phone: '+34600000000' })
  ENTONCES:
    - usersRepo.update llamado con { phone: '+34600000000' }
    - Retorna el User actualizado

CASO 2 — Phone = null (borrar teléfono)
  DADO:  usersRepo.update OK
  CUANDO: updateMe('user-123', { phone: null })
  ENTONCES:
    - usersRepo.update llamado con { phone: null }
    - phone no undefined en la llamada (se distingue null de undefined)
```

---

## 7. Suite 4 — QrService 🔴 Por crear

**Archivo a crear:** `backend/src/qr/qr.service.spec.ts`  
**Tests a escribir:** 6 tests

> Esta es la suite **más simple** — no hay repos, no hay DB, pura lógica de crypto.

### Setup del módulo

```typescript
// QrService depende solo de ConfigService
const mockConfigService = {
  get: jest.fn().mockReturnValue('test-signing-secret-32-chars-long!!'),
};

// bootstrap
const module = await Test.createTestingModule({
  providers: [
    QrService,
    { provide: ConfigService, useValue: mockConfigService },
  ],
}).compile();

service = module.get<QrService>(QrService);
```

### Tests a implementar

#### `generateHash()` — 3 tests

```
CASO 1 — Determinismo (mismo input → mismo output)
  DADO:  reservationId='res-123', userId='user-456', pickupDate=new Date('2026-03-01')
  CUANDO: generateHash llamado dos veces con los mismos argumentos
  ENTONCES: ambos resultados son idénticos (HMAC es determinista)

CASO 2 — Formato de salida
  DADO:  cualquier input válido
  CUANDO: generateHash(...)
  ENTONCES:
    - Resultado es un string hexadecimal de 64 caracteres
    - Solo contiene caracteres [0-9a-f]
    - NO contiene el reservationId, userId ni fecha en texto claro (no es base64 trivial)

CASO 3 — Inputs distintos → hashes distintos
  DADO:  dos reservas con distintos IDs
  CUANDO: generateHash con reservationId='res-001' vs generateHash con reservationId='res-002'
  ENTONCES: los hashes son distintos
```

#### `verifyHash()` — 3 tests

```
CASO 1 — Hash válido verifica correctamente
  DADO:  Se genera hash con generateHash(id, userId, date)
  CUANDO: verifyHash(ese_hash, id, userId, date)
  ENTONCES: retorna true

CASO 2 — Hash corrompido falla la verificación
  DADO:  Se genera hash válido
  CUANDO: verifyHash(hash_modificado, id, userId, date)
          (cambiar un carácter del hash)
  ENTONCES: retorna false

CASO 3 — Hash de otro usuario rechazado
  DADO:  Hash generado para userId='user-A'
  CUANDO: verifyHash(hash_de_A, id, 'user-B', date)
          (mismo reservationId, distinto usuario)
  ENTONCES: retorna false
  CRÍTICO: Este test previene que un usuario comparta su QR con otro
```

---

## 8. Suite 5 — VehiclesService 🔴 Por crear

**Archivo a crear:** `backend/src/vehicles/vehicles.service.spec.ts`  
**Tests a escribir:** 5 tests

> `findAvailable` usa una subquery SQL compleja — solo se testea que construye la query  
> y llama a los métodos correctos; el resultado real se testea en Integration Tests.

### Mocks necesarios

```typescript
const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
};

const mockVehiclesRepo = {
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  findOne: jest.fn(),
  find: jest.fn(),
};
```

### Tests a implementar

#### `findOne()` — 2 tests

```
CASO 1 — Vehículo existe
  DADO:  mockVehiclesRepo.findOne retorna un Vehicle
  CUANDO: findOne('vehicle-abc')
  ENTONCES: retorna el Vehicle

CASO 2 — Vehículo no existe
  DADO:  mockVehiclesRepo.findOne retorna null
  CUANDO: findOne('no-existe')
  ENTONCES: lanza NotFoundException('Vehículo no-existe no encontrado.')
```

#### `findAll()` — 1 test

```
CASO 1 — Solo vehículos disponibles
  DADO:  mockVehiclesRepo.find retorna lista de vehicles
  CUANDO: findAll()
  ENTONCES:
    - find llamado con where: { status: VehicleStatus.AVAILABLE }
    - order: { pricePerDayEurCents: 'ASC' }
```

#### `findAvailable()` — 2 tests

```
CASO 1 — Sin filtro de categoría
  DADO:  mockQueryBuilder.getMany retorna vehicles
  CUANDO: findAvailable({ pickupDate, returnDate })
  ENTONCES:
    - where llamado con status AVAILABLE
    - andWhere llamado con el subquery de reservas solapadas
    - andWhere con category NO llamado (sin filtro)
    - orderBy llamado con price_per_day_eur_cents ASC

CASO 2 — Con filtro de categoría
  DADO:  mockQueryBuilder.getMany retorna vehicles filtrados
  CUANDO: findAvailable({ pickupDate, returnDate, category: VehicleCategory.SUV })
  ENTONCES:
    - andWhere con 'vehicle.category = :category' llamado
```

---

## 9. Suite 6 — RolesGuard 🔴 Por crear

**Archivo a crear:** `backend/src/common/guards/roles.guard.spec.ts`  
**Tests a escribir:** 6 tests

> El `RolesGuard` es lógica pura de autorización — uno de los componentes más críticos  
> del sistema. **Ningún bug aquí puede tolerarse.**

### Setup del mock de ExecutionContext

```typescript
function makeContext(user: any, handlerRoles?: UserRole[], classRoles?: UserRole[]) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;
}

// El reflector mock controla qué roles devuelve
const mockReflector = {
  getAllAndOverride: jest.fn(),
};
```

### Tests a implementar

```
CASO 1 — Sin @Roles() en el handler (ruta protegida solo por JWT)
  DADO:  reflector.getAllAndOverride retorna undefined (sin decorador)
  CUANDO: canActivate(context)
  ENTONCES: retorna true (acceso permitido, el JWT guard ya autenticó)

CASO 2 — Usuario con rol correcto
  DADO:  @Roles(UserRole.ADMIN) en el handler
         request.user = { role: UserRole.ADMIN }
  CUANDO: canActivate(context)
  ENTONCES: retorna true

CASO 3 — Usuario con rol insuficiente
  DADO:  @Roles(UserRole.ADMIN) en el handler
         request.user = { role: UserRole.USER }
  CUANDO: canActivate(context)
  ENTONCES: lanza ForbiddenException('No tienes permiso...')

CASO 4 — Múltiples roles permitidos
  DADO:  @Roles(UserRole.OPERATOR, UserRole.ADMIN) en el handler
         request.user = { role: UserRole.OPERATOR }
  CUANDO: canActivate(context)
  ENTONCES: retorna true (OPERATOR está en la lista)

CASO 5 — request.user es null (JWT guard no ejecutado — mala configuración)
  DADO:  @Roles(UserRole.ADMIN) en el handler
         request.user = null (o undefined)
  CUANDO: canActivate(context)
  ENTONCES: lanza ForbiddenException (no crashea con TypeError)

CASO 6 — Roles definidos en la clase, no en el handler
  DADO:  handlerRoles = undefined, classRoles = [UserRole.OPERATOR]
         request.user = { role: UserRole.OPERATOR }
  CUANDO: canActivate(context)
  ENTONCES: retorna true (getAllAndOverride busca en handler Y en clase)
```

---

## 10. Resumen de cobertura objetivo

| Suite | Archivo | Tests | Funciones críticas cubiertas |
|---|---|---|---|
| ReservationsService | `reservations.service.spec.ts` | 13 ✅ | create, cancel, complete, findMy |
| AuthService | `auth.service.spec.ts` | 12 🔴 | register, login, refresh, buildTokenResponse |
| UsersService | `users.service.spec.ts` | 10 🔴 | create, findByEmailWithPassword, findById, updateMe |
| QrService | `qr.service.spec.ts` | 6 🔴 | generateHash, verifyHash |
| VehiclesService | `vehicles.service.spec.ts` | 5 🔴 | findOne, findAll, findAvailable |
| RolesGuard | `roles.guard.spec.ts` | 6 🔴 | canActivate (6 escenarios de roles) |
| **TOTAL** | | **52 tests** | |

### Cobertura por línea estimada (después de implementar)
```
auth/auth.service.ts           → ~95%
users/users.service.ts         → ~95%
qr/qr.service.ts               → 100%
vehicles/vehicles.service.ts   → ~85%
reservations/reservations.service.ts → ~90% (ya cubierto)
common/guards/roles.guard.ts   → 100%
```

### Zonas fuera del alcance del Nivel 1

Estos componentes **no se testean en Unit Tests** — pertenecen al Nivel 2 (Integration):

| Componente | Por qué no en Level 1 |
|---|---|
| `stripe/webhooks.service.ts` | Requiere simular eventos Stripe reales con firma |
| `operator/operator.service.ts` | Múltiples colas BullMQ + SSE — mejor en integración |
| `documents/documents.service.ts` | Integrado con S3 y BullMQ |
| `chat/chat.service.ts` | Sin lógica de negocio compleja (CRUD puro) |
| Todos los `*.controller.ts` | Los controllers se testean en Level 2 con Supertest |

---

## 11. Cómo ejecutar los tests

### Ejecutar todos los unit tests
```bash
cd backend
npm run test
```

### Ejecutar un archivo específico
```bash
npm run test auth.service
npm run test qr.service
npm run test roles.guard
```

### Modo watch (durante desarrollo)
```bash
npm run test:watch
```

### Con reporte de cobertura
```bash
npm run test:cov
```

> El reporte de cobertura genera `backend/coverage/lcov-report/index.html`  
> Abrir en el navegador para ver línea por línea qué está cubierto.

### Configuración Jest (ya existe en `package.json`)
```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

---

## Orden de implementación recomendado

```
1. QrService         ← 30 min  (sin deps, pura crypto, más fácil para entrar en calor)
2. RolesGuard        ← 45 min  (lógica pura de autorización, sin async)
3. UsersService      ← 1h      (QueryBuilder mocking + normalización email)
4. AuthService       ← 1.5h    (bcrypt mock + JWT mock + casos de seguridad)
5. VehiclesService   ← 45 min  (QueryBuilder mock + NotFoundException)
              TOTAL: ~4.5 horas
```

> La suite de `ReservationsService` ya existe y **pasa todos los tests**. Sirve como  
> referencia del estilo de mocking y la estructura de tests para el resto de suites.
