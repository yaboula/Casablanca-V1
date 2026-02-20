import { z } from 'zod';

// ================================================================
// Environment variable validation schema
// The app will NOT start if any required variable is missing or invalid.
// This is a hard requirement (Zero-trust principle from RFC-002).
// ================================================================

const EnvSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  API_PREFIX: z.string().default('api/v1'),

  // PostgreSQL
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid postgresql:// URL' }),
  DATABASE_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  // Redis
  REDIS_URL: z
    .string()
    .refine((v) => v.startsWith('redis://') || v.startsWith('rediss://'), {
      message: 'REDIS_URL must start with redis:// or rediss://',
    }),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32, { message: 'JWT_SECRET must be at least 32 characters' }),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Stripe
  STRIPE_SECRET_KEY: z
    .string()
    .refine((v) => v.startsWith('sk_'), { message: 'STRIPE_SECRET_KEY must start with sk_' }),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .refine((v) => v.startsWith('whsec_'), { message: 'STRIPE_WEBHOOK_SECRET must start with whsec_' }),
  STRIPE_DEPOSIT_EUR: z.coerce.number().int().positive().default(10),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().default('eu-west-3'),
  AWS_S3_BUCKET: z.string().min(1),
  AWS_S3_PRESIGN_EXPIRES_SECONDS: z.coerce.number().int().positive().default(900),

  // QR
  QR_SIGNING_SECRET: z.string().min(32, { message: 'QR_SIGNING_SECRET must be at least 32 chars' }),

  // CORS
  FRONTEND_URL: z.string().url(),

  // Operator
  OPERATOR_WHATSAPP: z.string().min(7),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = EnvSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  ✗ ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error('\n❌ Invalid environment variables:\n' + errors + '\n');
    process.exit(1);
  }

  return result.data;
}
