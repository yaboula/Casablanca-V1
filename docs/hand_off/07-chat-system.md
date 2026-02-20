# 07 — Chat System

> In-app messaging between customers and the NEXUS operator team. Built to function as a WhatsApp-style interface within the platform.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Current State (MVP)](#2-current-state-mvp)
3. [Target Architecture](#3-target-architecture)
4. [API Specification](#4-api-specification)
5. [WebSocket Events](#5-websocket-events)
6. [Operator Panel Requirements](#6-operator-panel-requirements)
7. [Message Status Lifecycle](#7-message-status-lifecycle)
8. [Notifications](#8-notifications)
9. [Data Model Reference](#9-data-model-reference)

---

## 1. Overview

The NEXUS chat system allows customers to contact the operator team without leaving the platform and without needing WhatsApp. It exists at `/soporte/chat` and is accessible from:
- The Support page (`/soporte`) via a "Chatear" card
- The customer dashboard's Quick Actions section
- The ContactHub floating action button (bottom-right of most pages)

The UI is a full-screen WhatsApp-style interface with:
- Blue message bubbles (customer)
- White/grey message bubbles (operator)
- Message status indicators (✓ sent, ✓✓ delivered, ✓✓ read in blue)
- Auto-scroll to latest message
- Persistence in `localStorage` (key: `nexus-chat`)

---

## 2. Current State (MVP)

The frontend currently calls:
```
POST /api/chat
```

The current backend stub (`src/app/api/chat/route.ts`) only logs the message. **Real implementation is required.**

Frontend chat state is persisted in **localStorage** under key `nexus-chat`:
```typescript
{
  messages: ChatMessage[],
  unreadCount: number
}
```

This means on the server side, we do NOT currently have a persistent chat history per user. The backend must provide `GET /api/chat/history` to restore this if the user clears their browser storage.

---

## 3. Target Architecture

```
Customer Browser                 Backend                   Operator Browser
      │                             │                             │
      ├─ POST /api/chat ───────────►│                             │
      │  { messageId, text, ts }    │                             │
      │                             ├─ INSERT chat_messages       │
      │                             ├─ Emit WS: new_message ─────►│
      │                             ├─ Push notification to op    │
      │◄─ { success, receivedAt }   │                             │
      │                             │                             │
      │                             │◄── POST /api/chat/operator-reply
      │                             │    { userId, text, msgId }  │
      │                             ├─ INSERT chat_messages       │
      │                             ├─ Emit WS: op_reply ────────►│(echo)
      │◄── WS event: op_reply ──────│                             │
      │   { message }               │                             │
```

### WebSocket strategy
Use **Socket.io** or raw WebSocket. Each customer connects to a room keyed by their `userId`. Operators connect to an "operator" room and can see all customer conversations.

---

## 4. API Specification

All endpoints documented in detail at [02-api-endpoints.md](./02-api-endpoints.md#6-chat). Summary:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/chat` | USER | Submit a customer message |
| `GET` | `/api/chat/history` | USER | Fetch past messages |
| `POST` | `/api/chat/operator-reply` | OPERATOR | Send a reply |
| `PATCH` | `/api/chat/mark-read` | OPERATOR | Mark messages as read |

### Idempotency
`messageId` is client-generated (UUID v4). If the same `messageId` is submitted twice (retry on network failure), the backend must deduplicate:
```sql
INSERT INTO chat_messages (id, user_id, text, sender, timestamp, status)
VALUES ($1, $2, $3, 'user', $4, 'sent')
ON CONFLICT (id) DO NOTHING;
```

---

## 5. WebSocket Events

### Customer subscribes to room: `user:{userId}`
### Operator subscribes to room: `operator:all`

### Events (server → customer)
| Event | Payload | Trigger |
|-------|---------|---------|
| `op_reply` | `ChatMessage` | Operator sends reply |
| `status_update` | `{ messageId, status }` | Message delivered/read |
| `system_message` | `ChatMessage` | Automated system message |

### Events (server → operator)
| Event | Payload | Trigger |
|-------|---------|---------|
| `new_message` | `{ message: ChatMessage, user: { id, fullName } }` | Customer sends message |
| `user_typing` | `{ userId }` | Customer is typing (optional) |

### Socket connection auth
```javascript
// Client connects with auth token
const socket = io(process.env.NEXT_PUBLIC_WS_URL, {
  auth: { token: session.accessToken }
});
```

Backend verifies the token on `connection` event before allowing the socket to join rooms.

---

## 6. Operator Panel Requirements

The operator chat panel (at `/operator/chat`) must show:

1. **Conversation list** — all users who have sent messages, sorted by latest message, unread badge count
2. **Conversation view** — full message history with a selected user, real-time updates via WebSocket
3. **Reply input** — text input + send button, calls `POST /api/chat/operator-reply`
4. **Mark as read** — auto-marks messages as read when conversation is opened

### Message threading
Messages are per-user (not per-reservation) in V1. All messages from a user are in one thread regardless of which reservation they're about.

---

## 7. Message Status Lifecycle

```
CLIENT generates message → status: "sending"
         │
         ▼
POST /api/chat succeeds → status: "sent"
         │
         ▼ (WebSocket event from server OR polling)
Operator receives message → status: "delivered"
         │
         ▼
Operator opens conversation → status: "read"
```

### Status update to customer
When operator marks read (`PATCH /api/chat/mark-read`), backend emits WebSocket event to customer:
```json
{ "event": "status_update", "messageId": "msg-uuid", "status": "read" }
```
Customer's chat store updates the message status and renders blue double checkmarks.

---

## 8. Notifications

When a new customer message arrives, backend should notify the operator via at least one channel:

### Option A — Browser push notification
Requires operator browser to grant notification permission. Use Web Push Protocol:
```javascript
await webpush.sendNotification(operatorPushSubscription, JSON.stringify({
  title: "Nuevo mensaje — NEXUS",
  body: `${user.fullName}: ${message.text.slice(0, 80)}`,
  icon: "/favicon.ico"
}));
```

### Option B — WhatsApp Business API (optional forward)
Uncomment in `src/app/api/chat/route.ts`:
```javascript
// await sendWhatsAppNotification(OPERATOR_WHATSAPP, body.text);
```

Forward the message text to the operator's WhatsApp number for backup notification. The operator must still reply through the platform.

### Option C — Email
Fallback email notification to operator's inbox. Low priority, high latency.

---

## 9. Data Model Reference

Full schema in [01-data-models.md](./01-data-models.md#6-chatmessage).

```sql
CREATE TABLE chat_messages (
  id             UUID PRIMARY KEY,          -- client-generated idempotency key
  user_id        UUID NOT NULL REFERENCES users(id),
  reservation_id UUID REFERENCES reservations(id),
  text           TEXT NOT NULL,
  sender         TEXT NOT NULL CHECK (sender IN ('user', 'operator', 'system')),
  status         TEXT NOT NULL DEFAULT 'sent'
                    CHECK (status IN ('sending','sent','delivered','read','error')),
  timestamp      BIGINT NOT NULL,           -- epoch ms from client
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_timestamp ON chat_messages(timestamp DESC);
```

### System messages
Automated messages (welcome, status updates) have `sender = 'system'`. Insert them automatically:
- On first user message: insert system welcome message prior to storing user's first message
- On reservation status change: optionally insert a system message in that user's thread (e.g. "Tu reserva ha sido confirmada")
