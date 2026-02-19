# 08 — Environment Variables

> All environment variables required by the NEXUS platform. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser — never store secrets in them.

---

## Table of Contents

1. [Frontend Variables (Next.js)](#1-frontend-variables-nextjs)
2. [Backend Variables](#2-backend-variables)
3. [AWS / S3](#3-aws--s3)
4. [Stripe](#4-stripe)
5. [Sample `.env.local` (development)](#5-sample-envlocal-development)
6. [Sample `.env.production`](#6-sample-envproduction)
7. [Secrets Management](#7-secrets-management)

---

## 1. Frontend Variables (Next.js)

These are set in the Next.js environment (`.env.local` / Vercel dashboard).  
Variables prefixed `NEXT_PUBLIC_` are bundled into the client JS — **do not put secrets here**.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | ✅ | Base URL of the backend REST API | `https://api.nexus.ma` |
| `NEXT_PUBLIC_WS_URL` | ✅ | WebSocket server URL | `wss://api.nexus.ma` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe publishable key (starts with `pk_`) | `pk_live_...` |
| `NEXT_PUBLIC_OPERATOR_PHONE` | ✅ | Operator contact phone (displayed in UI) | `+212522000000` |
| `NEXT_PUBLIC_OPERATOR_WHATSAPP` | ✅ | Operator WhatsApp number for direct link | `212522000000` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Full frontend URL (for redirects, meta tags) | `https://nexus.ma` |

---

## 2. Backend Variables

> These are set on the backend service only and must never be exposed to the browser.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@host:5432/nexus` |
| `JWT_SECRET` | ✅ | Secret for signing JWTs — minimum 256-bit | `a-very-long-random-string-...` |
| `JWT_EXPIRES_IN` | ✅ | JWT expiry duration | `24h` |
| `NEXTAUTH_SECRET` | ✅ | NextAuth encryption secret (same or separate from JWT) | `another-random-string` |
| `NEXTAUTH_URL` | ✅ | Full URL of the Next.js app | `https://nexus.ma` |
| `CORS_ORIGIN` | ✅ | Allowed CORS origin | `https://nexus.ma` |
| `PORT` | — | Backend server port | `3001` |
| `NODE_ENV` | — | Environment | `production` |

---

## 3. AWS / S3

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `AWS_REGION` | ✅ | S3 bucket region | `eu-west-1` |
| `AWS_S3_BUCKET` | ✅ | S3 bucket name for document uploads | `nexus-documents` |
| `AWS_ACCESS_KEY_ID` | ✅* | AWS IAM access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | ✅* | AWS IAM secret | `wJalrX...` |

> *If deploying on AWS (EC2, ECS, Lambda), prefer **IAM instance roles** over hardcoded access keys. In that case, `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are not needed.

### S3 bucket CORS policy (required for presigned upload from browser)
```json
[
  {
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": ["https://nexus.ma"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## 4. Stripe

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key (starts with `sk_`) — **backend only** | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Webhook endpoint signing secret | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Publishable key — **frontend safe** | `pk_live_...` |

> `STRIPE_SECRET_KEY` must **never** be exposed to the browser. It lives only on the backend.

---

## 5. Sample `.env.local` (development)

```bash
# ── Next.js / Frontend ────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
NEXT_PUBLIC_OPERATOR_PHONE=+212522000000
NEXT_PUBLIC_OPERATOR_WHATSAPP=212522000000

# ── NextAuth ──────────────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production

# ── Backend (set in the backend service .env) ─────────────────
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nexus_dev
JWT_SECRET=dev-jwt-secret-min-32-chars-long
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000

# ── Stripe (backend only) ─────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # from: stripe listen --print-secret

# ── AWS ───────────────────────────────────────────────────────
AWS_REGION=eu-west-1
AWS_S3_BUCKET=nexus-documents-dev
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

---

## 6. Sample `.env.production`

```bash
# ── Next.js / Frontend ────────────────────────────────────────
NEXT_PUBLIC_API_URL=https://api.nexus.ma
NEXT_PUBLIC_WS_URL=wss://api.nexus.ma
NEXT_PUBLIC_APP_URL=https://nexus.ma
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_OPERATOR_PHONE=+212522000000
NEXT_PUBLIC_OPERATOR_WHATSAPP=212522000000

# ── NextAuth ──────────────────────────────────────────────────
NEXTAUTH_URL=https://nexus.ma
NEXTAUTH_SECRET=<randomly-generated-64-char-string>

# ── Backend ───────────────────────────────────────────────────
DATABASE_URL=postgresql://nexus_user:<PASS>@<DB_HOST>:5432/nexus_prod
JWT_SECRET=<randomly-generated-64-char-string>
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://nexus.ma

# ── Stripe ───────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── AWS ──────────────────────────────────────────────────────
AWS_REGION=eu-west-1
AWS_S3_BUCKET=nexus-documents
# Use IAM role in production — no hardcoded keys
```

---

## 7. Secrets Management

### Do not commit secrets to git

Add to `.gitignore`:
```
.env
.env.local
.env.production
.env.*.local
```

### Production secrets
Use a secrets manager:
- **Vercel** (for Next.js frontend): use Vercel Environment Variables dashboard
- **Backend**: use AWS Secrets Manager, HashiCorp Vault, or your cloud provider's secret store
- Inject secrets as environment variables at runtime — never bake them into Docker images

### Generating secure secrets
```bash
# 64-character secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using openssl
openssl rand -hex 32
```
