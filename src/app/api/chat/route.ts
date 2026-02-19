import { NextRequest, NextResponse } from "next/server";

// ══════════════════════════════════════════════════════════════
// POST /api/chat — Receives in-app chat messages
//
// MVP: Logs the message. When the backend is ready, this will:
//   1. Store the message in the database
//   2. Send a push notification to the operator
//   3. Forward to the operator's WhatsApp via the Business API
//   4. Emit a websocket event so the operator panel shows it live
// ══════════════════════════════════════════════════════════════

interface ChatPayload {
  messageId: string;
  text: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatPayload = await request.json();

    // Validate required fields
    if (!body.text || !body.messageId) {
      return NextResponse.json(
        { error: "Missing required fields: text, messageId" },
        { status: 400 }
      );
    }

    // ── MVP: Log the message ──────────────────────────────
    // In production, replace with database insert + notification
    console.log("[CHAT] New message received:", {
      id: body.messageId,
      text: body.text,
      time: new Date(body.timestamp).toISOString(),
    });

    // ── Future: Forward to operator ───────────────────────
    // await sendWhatsAppNotification(OPERATOR_WHATSAPP, body.text);
    // await sendEmailNotification("soporte@nexus.ma", body.text);
    // await db.chatMessages.create({ data: body });

    return NextResponse.json({
      success: true,
      messageId: body.messageId,
      receivedAt: Date.now(),
    });
  } catch (error) {
    console.error("[CHAT] Error processing message:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
