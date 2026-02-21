# INT-SPRINT 1 — Auth Layer
> **Objetivo**: Eliminar toda la autenticación simulada (cookies falsas) y conectar el frontend a los endpoints reales de NestJS con JWT.

---

## Contexto actual (estado mock)

| Archivo | Problema |
|---|---|
| `src/app/(auth)/login/page.tsx` | `setTimeout` fake + escribe cookie `nexus_session` con JSON plano (sin HTTP-only, sin firma) |
| `src/app/(auth)/register/page.tsx` | Ídem — mock delay + cookie falsa con `role: "USER"` hardcoded |
| `src/proxy.ts` | Lee `nexus_session` como JSON sin firma → cualquiera puede falsificar el rol |
| Middleware de Next.js | No valida firma JWT, solo lee el campo `role` del JSON de la cookie |

### Endpoints de backend disponibles
```
POST /api/v1/auth/register   → { accessToken, user }
POST /api/v1/auth/login      → { accessToken, user }
GET  /api/v1/auth/me         → { id, email, fullName, role }  (Bearer JWT)
```

---

## Arquitectura objetivo

```
Browser
  │
  ├─ POST /api/v1/auth/login  →  NestJS → { accessToken (JWT) }
  │
  ├─ Next.js API Route  POST /api/auth/session
  │     └── escribe cookie: nexus_token (HttpOnly, Secure, SameSite=Strict)
  │                          nexus_user  (JSON público: id, email, fullName, role)
  │
  ├─ src/proxy.ts (middleware Next.js)
  │     └── lee nexus_token + llama /api/v1/auth/me para validar
  │         o verifica JWT localmente (secret compartido)
  │
  └─ Cliente React
        └── lee nexus_user cookie (no HttpOnly) para UI personalizada
```

---

## Tareas

### T1-1 — API client base (`src/lib/api.ts`)
Crear un cliente HTTP centralizado que:
- Prefija todas las URLs con `NEXT_PUBLIC_API_URL` (variable de entorno)
- Adjunta automáticamente el JWT desde `localStorage` o cookie
- Lanza errores tipados con el shape del backend (`{ statusCode, message, error }`)

```typescript
// src/lib/api.ts (nuevo archivo)
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { auth?: boolean }
): Promise<T> { ... }
```

### T1-2 — Next.js API Route de sesión (`src/app/api/auth/session/route.ts`)
- `POST` — recibe `{ accessToken, user }` del cliente, escribe dos cookies:
  - `nexus_token`: HttpOnly, Secure, SameSite=Strict (el JWT puro)
  - `nexus_user`: JSON con `{ id, email, fullName, role }` — readable por JS para UI
- `DELETE` — limpia ambas cookies → logout

```typescript
// src/app/api/auth/session/route.ts (nuevo archivo)
export async function POST(req: Request) { ... }
export async function DELETE() { ... }
```

### T1-3 — Conectar LoginForm (`src/app/(auth)/login/page.tsx`)

**Eliminar:**
```typescript
// TODO: Replace with real auth API call
await new Promise((r) => setTimeout(r, 1200)); // mock delay
document.cookie = `nexus_session=...`;
```

**Reemplazar por:**
```typescript
const res = await apiFetch<{ accessToken: string; user: User }>('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
  headers: { 'Content-Type': 'application/json' },
});
// Escribir sesión vía Next.js API Route
await fetch('/api/auth/session', {
  method: 'POST',
  body: JSON.stringify(res),
  headers: { 'Content-Type': 'application/json' },
});
router.push(redirect);
```

**Manejo de errores tipados:**
- `401` → "Credenciales incorrectas"
- `422` → mostrar errores de validación por campo
- `500` → "Error del servidor, inténtalo más tarde"

### T1-4 — Conectar RegisterPage (`src/app/(auth)/register/page.tsx`)

**Eliminar** el mock delay y la cookie falsa.

**Payload al backend:**
```typescript
{
  email: form.email,
  password: form.password,
  fullName: form.name,
  phone: form.phone,
}
```

**Flujo post-registro:** llamar `/api/auth/session` igual que en login (el backend devuelve el JWT directamente al registrar).

**Validación extra en frontend:**
- `email` ya registrado → backend responde `409 Conflict` → mostrar error inline bajo el campo de email

### T1-5 — Reescribir proxy middleware (`src/proxy.ts`)

**Estrategia**: validar que la cookie `nexus_token` exista y no haya expirado **localmente** (verificando el claim `exp` del JWT decodificado sin firma — seguro porque no es una operación de autorización, solo de routing).

Para rutas protegidas críticas, añadir una llamada `GET /api/v1/auth/me` desde un Server Component para obtener el usuario real en SSR.

```typescript
// src/proxy.ts — lógica nueva
function getSessionFromCookie(req: NextRequest): { role: string } | null {
  const token = req.cookies.get('nexus_token')?.value;
  if (!token) return null;
  // Decodificar payload sin verificar firma (solo para routing)
  const payload = JSON.parse(atob(token.split('.')[1]));
  if (payload.exp * 1000 < Date.now()) return null;
  return { role: payload.role };
}
```

### T1-6 — Logout button

Crear `src/components/layout/LogoutButton.tsx`:
- Llama `DELETE /api/auth/session` → limpia cookies
- Redirige a `/login`
- Integrar en `Header.tsx` (condicionalmente si hay sesión)

### T1-7 — `useUser` hook (`src/hooks/useUser.ts`)

Hook para leer el usuario actual desde la cookie `nexus_user` (lectura sin fetch):
```typescript
export function useUser(): User | null {
  // Lee y parsea la cookie nexus_user (pública, no HttpOnly)
}
```
Consumir en Header, Dashboard, etc.

### T1-8 — Variables de entorno

Añadir a `.env.local` del frontend:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
# Producción:
NEXT_PUBLIC_API_URL=https://api.nexus.ma/api/v1
```

Añadir a `.env.example` del frontend para documentación.

---

## Criterios de aceptación

- [ ] Login con credenciales reales → JWT almacenado en cookie HttpOnly
- [ ] Login con credenciales incorrectas → toast de error con mensaje del server
- [ ] Register → cuenta creada en PostgreSQL → sesión iniciada automáticamente
- [ ] Cookie `nexus_session` falsa eliminada del código
- [ ] Middleware proxy no puede ser bypasseado con cookie falsa
- [ ] Logout limpia ambas cookies y redirige
- [ ] `useUser()` disponible en cualquier componente cliente
- [ ] Rutas operator (`/operator/*`) solo accesibles con `role === 'OPERATOR' | 'ADMIN'`

---

## Archivos a modificar

| Archivo | Acción |
|---|---|
| `src/app/(auth)/login/page.tsx` | Reescribir `handleSubmit` |
| `src/app/(auth)/register/page.tsx` | Reescribir `handleSubmit` |
| `src/proxy.ts` | Reescribir `getSessionRole` |
| `src/app/layout.tsx` | Integrar `useUser` |
| `src/components/layout/Header.tsx` | Mostrar usuario + botón logout |

| Archivo | Crear |
|---|---|
| `src/lib/api.ts` | Cliente HTTP centralizado |
| `src/app/api/auth/session/route.ts` | Next.js API Route de sesión |
| `src/components/layout/LogoutButton.tsx` | Botón de cierre de sesión |
| `src/hooks/useUser.ts` | Hook de usuario actual |

---

## Dependencias externas
- Ninguna nueva librería necesaria (fetch nativo + JWT decode manual)
- El backend ya expone los endpoints — **no requiere cambios en NestJS**

## Bloquea
- **INT-SPRINT 2** (catálogo con disponibilidad real necesita `pickupDate`/`returnDate` del store, no auth)
- **INT-SPRINT 3** (booking requiere JWT en headers)
- Todo sprint posterior que use datos del usuario autenticado
