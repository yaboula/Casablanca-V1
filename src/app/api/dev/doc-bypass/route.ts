/**
 * DEV ONLY — Marks a document as uploaded (PENDING_REVIEW) directly in Postgres,
 * bypassing the S3 presign + upload flow entirely.
 *
 * Only active when BYPASS_PAYMENT=true in .env.local.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Client } from "pg";

interface DocBypassBody {
  reservationId: string;
  type: "PASSPORT" | "DRIVING_LICENSE";
}

export async function POST(req: NextRequest) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.BYPASS_PAYMENT !== "true"
  ) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  // Read userId from JWT (same pattern as book-bypass)
  const cookieStore = await cookies();
  const token = cookieStore.get("nexus_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let userId: string;
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    userId = payload.sub;
    if (!userId) throw new Error("no sub");
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { reservationId, type }: DocBypassBody = await req.json();

  const db = new Client({
    connectionString:
      process.env.DATABASE_URL ??
      "postgresql://nexus:nexus_secret@localhost:5433/nexus_db",
  });

  try {
    await db.connect();

    // Resolve userId via fallback (same logic as book-bypass)
    let resolvedUserId = userId;
    const uRes = await db.query<{ id: string }>(
      "SELECT id FROM users WHERE id = $1",
      [userId],
    );
    if (!uRes.rows.length) {
      const fallback = await db.query<{ id: string }>(
        "SELECT id FROM users WHERE email = $1 LIMIT 1",
        ["user@nexus.dev"],
      );
      if (!fallback.rows.length) {
        return NextResponse.json(
          { error: "No usable user found" },
          { status: 401 },
        );
      }
      resolvedUserId = fallback.rows[0].id;
    }

    // Delete any previous non-approved doc of same type for this reservation
    // so we don't hit the unique index on (reservation_id, type) WHERE APPROVED
    await db.query(
      `DELETE FROM reservation_documents
       WHERE reservation_id = $1 AND type = $2 AND status != 'APPROVED'`,
      [reservationId, type],
    );

    const fakeFileKey = `dev/bypass/${reservationId}/${type}-${Date.now()}.jpg`;

    await db.query(
      `INSERT INTO reservation_documents
         (user_id, reservation_id, type, file_key, status, created_at)
       VALUES ($1, $2, $3, $4, 'PENDING_REVIEW', NOW())`,
      [resolvedUserId, reservationId, type, fakeFileKey],
    );

    console.log(
      `[dev/doc-bypass] OK userId=${resolvedUserId} reservationId=${reservationId} type=${type}`,
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[dev/doc-bypass] error:", err);
    return NextResponse.json(
      { error: "DB error", detail: String(err) },
      { status: 500 },
    );
  } finally {
    await db.end();
  }
}
