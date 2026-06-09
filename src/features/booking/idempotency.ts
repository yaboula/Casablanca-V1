/**
 * Idempotency-key lifecycle for reservation creation.
 *
 * Rules (from FRONTEND_RESILIENCE_ADDENDUM.md):
 * - Generate once when the user reaches the final create step.
 * - Persist in sessionStorage so the same key is reused on refresh/retry.
 * - Reuse on retry for the same draft (vehicleId must match).
 * - Clear after backend confirms reservation creation.
 * - Clear when the user explicitly cancels/abandons the draft.
 * - Clear when the draft is unrecoverable (backend validation requires restart).
 * - Expire after TTL_MS (default 24h).
 *
 * The key is stored ONLY in sessionStorage (session-scoped, not localStorage).
 * Backend-owned state (reservation UUID, payment status) is never stored here.
 */

import type { IdempotencyRecord } from "./types";

const STORAGE_KEY = "nx_booking_idempotency";

/** Default TTL: 24 hours */
const TTL_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Key generation
// ---------------------------------------------------------------------------

/**
 * Generates a cryptographically random idempotency key using the Web Crypto
 * API, which is available in all modern browsers and in the Next.js edge/client
 * runtime. Returns a UUID v4-format string.
 */
function generateKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  // Fallback for environments where crypto.randomUUID is unavailable.
  // This path should not be reached in a modern browser or Node 18+.
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  array[6] = (array[6] & 0x0f) | 0x40;
  array[8] = (array[8] & 0x3f) | 0x80;
  return [...array]
    .map((b, i) => {
      const hex = b.toString(16).padStart(2, "0");
      return [4, 6, 8, 10].includes(i) ? `-${hex}` : hex;
    })
    .join("");
}

// ---------------------------------------------------------------------------
// SessionStorage helpers (safe — handles environments without sessionStorage)
// ---------------------------------------------------------------------------

function readRecord(): IdempotencyRecord | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isIdempotencyRecord(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeRecord(record: IdempotencyRecord): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Quota exceeded or private browsing — continue without persistence.
  }
}

function removeRecord(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

function isIdempotencyRecord(value: unknown): value is IdempotencyRecord {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.key === "string" &&
    typeof r.vehicleId === "string" &&
    typeof r.createdAt === "number" &&
    typeof r.expiresAt === "number"
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the existing idempotency key for the given vehicleId if it is still
 * valid (not expired, same vehicle). Otherwise generates and stores a new one.
 *
 * Call this once when the user commits to reserving — NOT on every button
 * click or every render. Do not create a new key on every retry.
 */
export function getOrCreateIdempotencyKey(vehicleId: string): string {
  const existing = readRecord();

  if (existing) {
    const isExpired = Date.now() > existing.expiresAt;
    const isSameVehicle = existing.vehicleId === vehicleId;

    if (!isExpired && isSameVehicle) {
      return existing.key;
    }

    // Stale or wrong vehicle — remove and re-generate.
    removeRecord();
  }

  const now = Date.now();
  const record: IdempotencyRecord = {
    key: generateKey(),
    vehicleId,
    createdAt: now,
    expiresAt: now + TTL_MS,
  };

  writeRecord(record);
  return record.key;
}

/**
 * Returns the persisted idempotency key if it is valid for the given vehicleId.
 * Returns null if no key exists, it is expired, or it belongs to a different vehicle.
 *
 * Use this to check if a key already exists without creating one.
 */
export function peekIdempotencyKey(vehicleId: string): string | null {
  const existing = readRecord();
  if (!existing) return null;
  if (Date.now() > existing.expiresAt) {
    removeRecord();
    return null;
  }
  if (existing.vehicleId !== vehicleId) return null;
  return existing.key;
}

/**
 * Clears the stored idempotency key.
 *
 * Must be called:
 * - After backend confirms reservation creation (success path).
 * - When the user explicitly cancels or abandons the booking.
 * - When the backend rejects the draft as unrecoverable.
 */
export function clearIdempotencyKey(): void {
  removeRecord();
}

/**
 * Returns whether the current stored key is still valid for the given vehicleId.
 * Useful for UI readiness checks.
 */
export function hasValidIdempotencyKey(vehicleId: string): boolean {
  return peekIdempotencyKey(vehicleId) !== null;
}
