"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Send,
  Smile,
  Phone,
  MoreVertical,
  Paperclip,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { useChatStore, type ChatMessage } from "@/stores/useChatStore";
import { OPERATOR_PHONE, OPERATOR_WHATSAPP } from "@/lib/constants";

// ══════════════════════════════════════════════════════════════
// IN-APP CHAT — WhatsApp-style real messaging
// Messages are persisted locally and forwarded to operator via API
// ══════════════════════════════════════════════════════════════

const OPERATOR_NAME = "NEXUS Soporte";
const OPERATOR_AVATAR = "N";

// Format time like WhatsApp: HH:MM
function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Group messages by date
function groupByDate(messages: ChatMessage[]) {
  const groups: { label: string; messages: ChatMessage[] }[] = [];
  let currentLabel = "";

  for (const msg of messages) {
    const date = new Date(msg.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label: string;
    if (date.toDateString() === today.toDateString()) {
      label = "Hoy";
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = "Ayer";
    } else {
      label = date.toLocaleDateString("es", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    if (label !== currentLabel) {
      groups.push({ label, messages: [msg] });
      currentLabel = label;
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

export default function ChatPage() {
  const { messages, addMessage, updateMessageStatus, markAllRead } =
    useChatStore();
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark all read when entering chat
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  // Auto-resize textarea
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
      e.target.style.height = "auto";
      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    },
    []
  );

  // Send message
  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isSending) return;

    setIsSending(true);
    const msg = addMessage(text, "user");
    setInputValue("");

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      // Send to API for operator notification
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: msg.id,
          text: msg.text,
          timestamp: msg.timestamp,
        }),
      });

      if (res.ok) {
        updateMessageStatus(msg.id, "sent");
        // Simulate "delivered" after 1s (in production the server would confirm)
        setTimeout(() => updateMessageStatus(msg.id, "delivered"), 1000);
      } else {
        updateMessageStatus(msg.id, "error");
      }
    } catch {
      updateMessageStatus(msg.id, "error");
    } finally {
      setIsSending(false);
    }
  }, [inputValue, isSending, addMessage, updateMessageStatus]);

  // Add welcome system message on first visit
  useEffect(() => {
    if (messages.length === 0) {
      addMessage(
        "¡Bienvenido al chat de NEXUS! 👋\n\nEscríbenos tu consulta y nuestro equipo te responderá lo antes posible. También puedes usar WhatsApp si lo prefieres.",
        "system"
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const messageGroups = groupByDate(messages);

  return (
    <div className="flex flex-col h-dvh bg-[#ECE5DD]">
      {/* ── Header (WhatsApp-style) ──────────────────── */}
      <header className="bg-[#075E54] shrink-0 safe-area-top">
        <div className="flex items-center gap-3 px-2 py-2.5">
          <Link
            href="/soporte"
            className="w-10 h-10 rounded-full flex items-center justify-center
                       hover:bg-white/10 transition-colors shrink-0"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-white">{OPERATOR_AVATAR}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-white truncate">
              {OPERATOR_NAME}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-emerald-200 font-medium">
                En línea · Respuesta en minutos
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <a
            href={`tel:+${OPERATOR_PHONE}`}
            className="w-10 h-10 rounded-full flex items-center justify-center
                       hover:bg-white/10 transition-colors shrink-0"
            aria-label="Llamar"
          >
            <Phone className="w-5 h-5 text-white" />
          </a>
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center
                       hover:bg-white/10 transition-colors shrink-0"
            aria-label="Más opciones"
          >
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* ── Chat area ────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8c8c8' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {/* End-to-end encryption notice */}
        <div className="flex justify-center mb-4">
          <div className="bg-[#FFF3C4]/90 rounded-lg px-4 py-2 shadow-sm max-w-[340px]">
            <p className="text-[11px] text-center text-amber-800 leading-relaxed">
              🔒 Tus mensajes llegan directamente a nuestro equipo de soporte.
              Responderemos aquí lo antes posible.
            </p>
          </div>
        </div>

        {/* Message groups */}
        {messageGroups.map((group) => (
          <div key={group.label}>
            {/* Date separator */}
            <div className="flex justify-center my-3">
              <span className="text-[11px] font-medium text-slate-600 bg-white/90 px-3 py-1 rounded-lg shadow-sm">
                {group.label}
              </span>
            </div>

            {/* Messages */}
            {group.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        ))}

        <div ref={chatEndRef} />
      </div>

      {/* ── Info banner (first time) ─────────────────── */}
      {messages.length <= 2 && (
        <div className="shrink-0 bg-[#DCF8C6]/50 border-t border-[#d4e9bf] px-4 py-2">
          <p className="text-[11px] text-[#075E54] text-center leading-relaxed">
            💡 ¿No tienes WhatsApp? No hay problema. Escribe aquí y nuestro equipo
            real te responde directamente. Sin bots.
          </p>
        </div>
      )}

      {/* ── Input bar ────────────────────────────────── */}
      <div className="shrink-0 bg-[#F0F0F0] px-2 py-2 flex items-end gap-1.5 safe-area-bottom">
        {/* Emoji button */}
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center
                     hover:bg-slate-200 transition-colors shrink-0"
          aria-label="Emoji"
        >
          <Smile className="w-6 h-6 text-[#54656F]" />
        </button>

        {/* Input container */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 flex items-end px-3 py-1.5">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escribe un mensaje..."
            rows={1}
            className="flex-1 text-sm bg-transparent text-slate-900 placeholder:text-slate-400
                       focus:outline-none resize-none min-h-[24px] max-h-[120px] py-1 leading-snug"
          />
          <button
            className="shrink-0 ml-1 text-[#54656F] hover:text-slate-900 transition-colors"
            aria-label="Adjuntar"
          >
            <Paperclip className="w-5 h-5 rotate-45" />
          </button>
        </div>

        {/* Send / Voice button */}
        {inputValue.trim() ? (
          <motion.button
            onClick={handleSend}
            disabled={isSending}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-full bg-[#075E54] flex items-center justify-center shrink-0
                       hover:bg-[#064e46] active:scale-95 transition-all disabled:opacity-50
                       shadow-md"
            aria-label="Enviar"
          >
            <Send className="w-5 h-5 text-white ml-0.5" />
          </motion.button>
        ) : (
          <button
            className="w-12 h-12 rounded-full bg-[#075E54] flex items-center justify-center shrink-0
                       hover:bg-[#064e46] transition-all shadow-md"
            aria-label="Imagen"
          >
            <ImageIcon className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MESSAGE BUBBLE
// ══════════════════════════════════════════════════════════════

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === "user";
  const isSystem = message.sender === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-white/90 rounded-lg px-4 py-2 shadow-sm max-w-[320px]">
          <p className="text-[12px] text-slate-600 text-center whitespace-pre-line leading-relaxed">
            {message.text}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={`flex mb-1 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* Operator avatar (small, only on first message of sequence) */}
      {!isUser && (
        <div className="w-0 shrink-0" />
      )}

      <div
        className={`relative max-w-[80%] sm:max-w-[65%] px-3 py-1.5 shadow-sm ${
          isUser
            ? "bg-[#DCF8C6] rounded-2xl rounded-tr-md"
            : "bg-white rounded-2xl rounded-tl-md"
        }`}
      >
        {/* Triangle notch */}
        <div
          className={`absolute top-0 w-3 h-3 ${
            isUser
              ? "right-[-5px] bg-[#DCF8C6]"
              : "left-[-5px] bg-white"
          }`}
          style={{
            clipPath: isUser
              ? "polygon(0 0, 100% 0, 0 100%)"
              : "polygon(0 0, 100% 0, 100% 100%)",
          }}
        />

        {/* Operator name */}
        {!isUser && (
          <p className="text-[12px] font-bold text-[#075E54] mb-0.5">
            {OPERATOR_NAME}
          </p>
        )}

        {/* Message text */}
        <p className="text-[14px] text-slate-900 whitespace-pre-line leading-relaxed pr-16">
          {message.text}
        </p>

        {/* Time + status */}
        <div className="flex items-center justify-end gap-1 -mt-1 mb-0.5">
          <span className="text-[10px] text-slate-500">{formatTime(message.timestamp)}</span>
          {isUser && <StatusIcon status={message.status} />}
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// STATUS ICON (WhatsApp-style checks)
// ══════════════════════════════════════════════════════════════

function StatusIcon({ status }: { status: ChatMessage["status"] }) {
  switch (status) {
    case "sending":
      return <Clock className="w-3 h-3 text-slate-400" />;
    case "sent":
      return <Check className="w-3.5 h-3.5 text-slate-400" />;
    case "delivered":
      return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />;
    case "read":
      return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
    case "error":
      return (
        <span className="text-[10px] text-red-500 font-medium">!</span>
      );
    default:
      return null;
  }
}
