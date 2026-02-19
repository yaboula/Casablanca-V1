# 03 — Authentication & Roles

> NEXUS uses NextAuth on the frontend. The backend must be compatible with NextAuth's session/JWT adapter or expose its own token that NextAuth can consume.

---

## Table of Contents

1. [Auth Strategy](#1-auth-strategy)
2. [Registration & Login Flow](#2-registration--login-flow)
3. [Session / JWT Format](#3-session--jwt-format)
4. [Role Definitions](#4-role-definitions)
5. [Permission Matrix](#5-permission-matrix)
6. [Route Protection Rules](#6-route-protection-rules)
7. [Operator Auth (Proxy)](#7-operator-auth-proxy)
8. [Security Requirements](#8-security-requirements)

---

## 1. Auth Strategy

The frontend uses **NextAuth** (`next-auth`) with a credentials provider. The backend exposes standard REST endpoints for login/register and the NextAuth adapter calls them internally.

**Recommended backend approach (two options)**:

### Option A — NextAuth Database Adapter
Install `@auth/prisma-adapter` (or similar) and point NextAuth at your PostgreSQL database directly. NextAuth manages sessions/JWTs natively.

### Option B — Custom JWT (stateless)
Backend issues signed JWTs. NextAuth uses the **CredentialsProvider** with a custom `authorize()` callback that calls `POST /api/auth/login` and returns the user object. JWT is stored in NextAuth's encrypted session cookie.

> **Recommendation**: Option B is simpler for a separate backend service. The frontend team has designed with this approach in mind.

---

## 2. Registration & Login Flow

```
Customer Browser
    │
    ├─ POST /api/auth/register  →  Backend creates user, returns { user, token }
    │
    └─ POST /api/auth/login     →  Backend validates credentials, returns { user, token }
                                       │
                                       └─ NextAuth stores token in encrypted session cookie
                                          (httpOnly, SameSite=Lax)
```

### Password Requirements
- Minimum 8 characters
- Must contain at least 1 uppercase, 1 lowercase, 1 digit
- Store as `bcrypt` hash with cost factor ≥ 12

### OAuth (future)
Not in scope for V1. Design the `users` table to support `password_hash = null` for future OAuth users.

---

## 3. Session / JWT Format

### JWT Payload (what frontend expects in `session.user`)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "fullName": "John Doe",
  "role": "USER",
  "iat": 1753000000,
  "exp": 1753086400
}
```

### NextAuth session shape (from `session` object in components)
```typescript
session.user = {
  id: string,
  email: string,
  fullName: string,
  role: "USER" | "OPERATOR" | "ADMIN"
}
```

> The frontend reads `session.user.role` to conditionally render the operator dashboard link, admin controls, and user-only features (e.g. booking CTA, "Mis reservas" menu).

### Token Lifetime
- Access token: **24 hours**
- Refresh token: **7 days** (optional, not required for V1)

---

## 4. Role Definitions

| Role | Description |
|------|-------------|
| `USER` | Standard customer. Can browse, book, upload documents, view own reservations. |
| `OPERATOR` | NEXUS staff. Reviews documents, approves/rejects, marks vehicle pickup/return, responds to chat. |
| `ADMIN` | Full access: manage fleet, create/delete operators, view all data, change system config. |

### Role assignment
- New accounts via `/register` always receive `USER` role.
- `OPERATOR` and `ADMIN` roles must be assigned manually by an existing `ADMIN` (or via database seed on first deploy).

---

## 5. Permission Matrix

| Action | USER | OPERATOR | ADMIN |
|--------|:----:|:--------:|:-----:|
| Browse vehicle catalogue | ✅ | ✅ | ✅ |
| Create reservation | ✅ | — | ✅ |
| View own reservations | ✅ | — | ✅ |
| View all reservations | — | ✅ | ✅ |
| Cancel own reservation (PENDING_DEPOSIT only) | ✅ | — | ✅ |
| Cancel any reservation | — | ✅ | ✅ |
| Upload documents | ✅ | — | ✅ |
| View own document status | ✅ | — | ✅ |
| View all documents (pending review) | — | ✅ | ✅ |
| Approve / Reject documents | — | ✅ | ✅ |
| Mark reservation IN_PROGRESS / COMPLETED | — | ✅ | ✅ |
| Validate QR code | — | ✅ | ✅ |
| Send chat message (as user) | ✅ | — | — |
| Reply in chat (as operator) | — | ✅ | ✅ |
| Manage vehicles (CRUD) | — | — | ✅ |
| Manage users | — | — | ✅ |
| Assign OPERATOR role | — | — | ✅ |

---

## 6. Route Protection Rules

### Frontend route protection (middleware in `src/middleware.ts`)
| Route pattern | Required role |
|---------------|---------------|
| `/operator/**` | `OPERATOR` or `ADMIN` |
| `/dashboard` | `USER` |
| `/book`, `/booking` | `USER` |
| `/check-in` | `USER` |
| `/waiting-room` | `USER` |
| `/smart-ticket` | `USER` |
| `/profile` | Any authenticated |
| `/soporte`, `/soporte/chat` | Public (chat messages require auth when sent) |
| `/catalog` | Public |
| `/` (homepage) | Public |

### Backend route protection
Every protected API endpoint must verify:
1. Token is present and valid (not expired, signature correct)
2. `role` claim in JWT matches required permissions
3. Resource ownership — e.g. a `USER` can only access their own reservations (matching `user_id`)

---

## 7. Operator Auth (Proxy)

The frontend has a proxy at `src/app/api/proxy.ts` that handles operator authentication separately. This proxy forwards requests to the backend operator endpoints and attaches the operator session.

### Proxy behaviour
- Reads `OPERATOR_API_URL` from env
- Forwards `Authorization` header from the NextAuth session
- Returns 401 if the session does not have `OPERATOR` or `ADMIN` role

> The operator panel at `/operator/**` is server-side rendered and protected by Next.js middleware. No operator page is accessible without a valid `OPERATOR`/`ADMIN` session.

---

## 8. Security Requirements

### HTTPS
- All API endpoints must be served over HTTPS in production.
- HTTP is only acceptable in local development.

### CORS
Configure CORS to allow requests only from the frontend domain:
```
Access-Control-Allow-Origin: https://nexus.ma
Access-Control-Allow-Credentials: true
```

### Rate Limiting
| Endpoint | Limit |
|----------|-------|
| `POST /api/auth/login` | 10 req/min per IP |
| `POST /api/auth/register` | 5 req/min per IP |
| `POST /api/documents/upload-url` | 10 req/min per user |
| `POST /api/chat` | 30 req/min per user |

### Input Validation
- Validate all request bodies with a schema validation library (Zod, Joi, Yup, etc.)
- Sanitize text inputs to prevent XSS
- Validate file MIME types server-side (`image/jpeg`, `image/png`, `image/webp` only for documents)

### Secrets
- JWT secret: minimum 256-bit random string, stored in env, never committed to git
- Stripe webhook secret: from Stripe dashboard, used to verify webhook signatures
- AWS credentials: IAM role preferred over access key + secret
