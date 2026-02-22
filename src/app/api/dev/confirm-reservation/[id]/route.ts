/**
 * DEV ONLY — Bypasses Stripe by confirming a reservation directly in the DB.
 *
 * Only active when BYPASS_PAYMENT=true (never in production).
 * Called by BookFlowClient when NEXT_PUBLIC_BYPASS_PAYMENT=true.
 */
import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  // Hard guard — never run in production
  if (
    process.env.NODE_ENV === "production" ||
    process.env.BYPASS_PAYMENT !== "true"
  ) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { id } = await context.params;

  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ??
      "postgresql://nexus:nexus_secret@localhost:5432/nexus_db",
  });

  try {
    await client.connect();
    const result = await client.query(
      `UPDATE reservations
          SET status = 'CONFIRMED', updated_at = NOW()
        WHERE id = $1
          AND status NOT IN ('CANCELLED', 'COMPLETED')
        RETURNING id, status`,
      [id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Reservation not found or already in terminal state" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, id, status: "CONFIRMED" });
  } catch (err) {
    console.error("[dev/confirm-reservation] DB error:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  } finally {
    await client.end();
  }
}
