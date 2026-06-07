/**
 * DEV ONLY — Creates a CONFIRMED reservation directly in Postgres,
 * bypassing NestJS + Stripe entirely.
 *
 * Only active when BYPASS_PAYMENT=true in .env.local.
 * Never reachable in production.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Client } from "pg";

interface BookBypassBody {
  vehicleId: string;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  customerName: string;
  customerPhone: string;
  pricePerDayCents?: number;
}

export async function POST(req: NextRequest) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.BYPASS_PAYMENT !== "true"
  ) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  // Get current user from the JWT stored in the HttpOnly nexus_token cookie.
  // The JWT payload contains `sub` = user UUID (same as req.user.id in NestJS).
  // We prefer this over the public nexus_user cookie because it can never be
  // stale or malformed — it's the same token NestJS accepts.
  const cookieStore = await cookies();
  const token = cookieStore.get("nexus_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let userId: string;
  try {
    const payloadBase64 = token.split(".")[1];
    // base64url → standard base64 (replace - and _ then pad)
    const b64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    userId = payload.sub;
    if (!userId) throw new Error("no sub");
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body: BookBypassBody = await req.json();
  const {
    vehicleId,
    pickupDate,
    returnDate,
    pickupLocation,
    customerName,
    customerPhone,
    pricePerDayCents,
  } = body;

  const pickup = new Date(pickupDate);
  const returns = new Date(returnDate);
  const totalDays = Math.max(
    1,
    Math.round((returns.getTime() - pickup.getTime()) / 86_400_000),
  );

  const db = new Client({
    connectionString:
      process.env.DATABASE_URL ??
      "postgresql://nexus:nexus_secret@localhost:5433/nexus_db",
  });

  try {
    await db.connect();

    // Resolve the userId: prefer the one from the JWT, but in DEV if it's
    // stale (e.g. after a DB reset) fall back to the seed USER account.
    let resolvedUserId = userId;
    const uRes = await db.query<{ id: string }>(
      "SELECT id FROM users WHERE id = $1",
      [userId],
    );
    if (!uRes.rows.length) {
      console.warn(
        `[dev/book-bypass] JWT sub=${userId} not in DB — falling back to user@nexus.dev`,
      );
      const fallback = await db.query<{ id: string }>(
        "SELECT id FROM users WHERE email = $1 LIMIT 1",
        ["user@nexus.dev"],
      );
      if (!fallback.rows.length) {
        return NextResponse.json(
          { error: "No usable user found. Please log in again." },
          { status: 401 },
        );
      }
      resolvedUserId = fallback.rows[0].id;
    }
    console.log(
      `[dev/book-bypass] userId=${resolvedUserId} vehicleId=${vehicleId}`,
    );

    // Use client-provided price if available; fallback to DB lookup
    let resolvedPriceCents = pricePerDayCents;
    if (!resolvedPriceCents) {
      const vRes = await db.query<{ price_per_day_eur_cents: number }>(
        "SELECT price_per_day_eur_cents FROM vehicles WHERE id = $1",
        [vehicleId],
      );
      if (!vRes.rows.length) {
        return NextResponse.json(
          { error: "Vehicle not found", detail: `id=${vehicleId}` },
          { status: 404 },
        );
      }
      resolvedPriceCents = vRes.rows[0].price_per_day_eur_cents;
    }
    const totalPriceEurCents = resolvedPriceCents * totalDays;

    // Insert reservation as CONFIRMED
    const rRes = await db.query<{ id: string }>(
      `INSERT INTO reservations
         (user_id, vehicle_id, pickup_date, return_date, total_days,
          total_price_eur_cents, deposit_eur_cents, pickup_location,
          status, customer_name, customer_phone,
          stripe_payment_intent_id, stripe_client_secret, qr_code_hash,
          created_at, updated_at)
       VALUES
         ($1, $2, $3, $4, $5,
          $6, 1000, $7,
          'CONFIRMED', $8, $9,
          NULL, NULL, NULL,
          NOW(), NOW())
       RETURNING id`,
      [
        resolvedUserId,
        vehicleId,
        pickup,
        returns,
        totalDays,
        totalPriceEurCents,
        pickupLocation,
        customerName,
        customerPhone,
      ],
    );

    const reservationId = rRes.rows[0].id;
    return NextResponse.json({
      id: reservationId,
      status: "CONFIRMED",
      stripeClientSecret: null,
      totalPriceEurCents,
    });
  } catch (err) {
    console.error("[dev/book-bypass] error:", err);
    return NextResponse.json(
      { error: "DB error", detail: String(err) },
      { status: 500 },
    );
  } finally {
    await db.end();
  }
}
