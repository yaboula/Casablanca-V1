"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Headphones,
  MessageCircle,
  Phone,
  Send,
  X,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  Bot,
  ChevronDown,
} from "lucide-react";
import { useBookingStore } from "@/stores/useBookingStore";
import { OPERATOR_PHONE, OPERATOR_WHATSAPP } from "@/lib/constants";

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

type ContactChannel = "menu" | "chat";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "agent" | "bot";
  timestamp: Date;
  status: "sent" | "delivered" | "read";
}

// ── Auto-replies (mock) ──────────────────────────────────────

const AUTO_REPLIES: Array<{ keywords: RegExp; reply: string }> = [
  {
    keywords: /hola|hello|hi|buenas|hey/i,
    reply: "¡Hola! 👋 Soy el asistente de NEXUS. ¿En qué puedo ayudarte? Puedo informarte sobre reservas, recogida en aeropuerto o tu vehículo.",
  },
  {
    keywords: /reserva|booking|precio|price|coste/i,
    reply: "Puedes reservar cualquier vehículo desde 10€ de señal. El pago restante se realiza al recoger. ¿Quieres que te ayude a hacer una reserva?",
  },
  {
    keywords: /aeropuerto|airport|terminal|cmn|recoger|pickup/i,
    reply: "Estamos en las Terminales 1 y 2 del Aeropuerto Mohammed V. Al aterrizar, avísanos por aquí o por WhatsApp y nuestro operador te espera en la puerta. ⏱️ Recogida típica: 3 minutos.",
  },
  {
    keywords: /documento|passport|carnet|licen|check.?in/i,
    reply: "Necesitas pasaporte + carnet de conducir. Puedes subirlos antes de tu viaje en la sección Check-in de tu dashboard. ¡Así ahorras tiempo al llegar!",
  },
  {
    keywords: /seguro|insurance|jawaz|sim|incluye/i,
    reply: "Todos nuestros vehículos incluyen: ✅ Seguro a todo riesgo, ✅ Tag Jawaz para autopistas, ✅ SIM con 5GB de datos. Sin costes ocultos.",
  },
  {
    keywords: /cancel|cambiar|modific/i,
    reply: "Puedes cancelar o modificar tu reserva sin coste hasta 24h antes de la recogida. Para cambios urgentes, contáctanos por WhatsApp.",
  },
  {
    keywords: /horario|hora|when|abierto|open/i,
    reply: "Estamos disponibles 24/7 en el aeropuerto Mohammed V. Nuestro equipo se adapta a tu horario de vuelo, incluidas llegadas nocturnas. 🌙",
  },
  {
    keywords: /gracias|thanks|thx|merci/i,
    reply: "¡De nada! 😊 Si necesitas algo más, aquí estoy. ¡Buen viaje! 🚗",
  },
];

function getAutoReply(text: string): string {
  for (const { keywords, reply } of AUTO_REPLIES) {
    if (keywords.test(text)) return reply;
  }
  return "Gracias por tu mensaje. Un agente de NEXUS te responderá en breve. Para atención inmediata, puedes contactarnos por WhatsApp. 📲";
}

// ══════════════════════════════════════════════════════════════
// CONTACT HUB COMPONENT
// ══════════════════════════════════════════════════════════════

export default function ContactHub() {
  const { reservationId } = useBookingStore();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ContactChannel>("menu");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (view === "chat" && open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [view, open]);

  // Welcome message on first chat open
  useEffect(() => {
    if (view === "chat" && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          text: "¡Bienvenido al chat de NEXUS! 👋\n\nSoy tu asistente virtual. Puedo ayudarte con reservas, documentos, recogida en aeropuerto y más.\n\n¿En qué puedo ayudarte?",
          sender: "bot",
          timestamp: new Date(),
          status: "read",
        },
      ]);
    }
  }, [view, messages.length]);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Don't close if clicking the FAB button itself
        const fab = document.getElementById("contact-hub-fab");
        if (fab && fab.contains(e.target as Node)) return;
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      return () => document.removeEventListener("mousedown", onClickOutside);
    }
  }, [open]);

  function handleSendMessage() {
    const text = inputValue.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      text,
      sender: "user",
      timestamp: new Date(),
      status: "sent",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate "delivered"
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsg.id ? { ...m, status: "delivered" } : m))
      );
    }, 400);

    // Simulate "read" + auto-reply
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsg.id ? { ...m, status: "read" } : m))
      );
    }, 900);

    // Bot response
    setTimeout(() => {
      setIsTyping(false);
      const reply: ChatMessage = {
        id: `b-${Date.now()}`,
        text: getAutoReply(text),
        sender: "bot",
        timestamp: new Date(),
        status: "read",
      };
      setMessages((prev) => [...prev, reply]);

      // Increment unread if panel not in chat view
      if (view !== "chat") {
        setUnreadCount((c) => c + 1);
      }
    }, 1200 + Math.random() * 800);
  }

  function handleToggle() {
    if (open) {
      setOpen(false);
    } else {
      setOpen(true);
      setView("menu");
      setUnreadCount(0);
    }
  }

  function openChat() {
    setView("chat");
    setUnreadCount(0);
  }

  const whatsappUrl = `https://wa.me/${OPERATOR_WHATSAPP}?text=${encodeURIComponent(
    reservationId
      ? `Hola, necesito ayuda con mi reserva #${reservationId} en NEXUS.`
      : "Hola, necesito ayuda con mi reserva en NEXUS."
  )}`;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* ── Expanded Panel ──────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute bottom-[72px] right-0 w-[340px] sm:w-[380px] max-h-[520px] bg-white rounded-2xl
                       shadow-2xl shadow-black/12 border border-slate-200 overflow-hidden flex flex-col"
          >
            {view === "menu" ? (
              <MenuView
                onOpenChat={openChat}
                whatsappUrl={whatsappUrl}
                onClose={() => setOpen(false)}
              />
            ) : (
              <ChatView
                messages={messages}
                inputValue={inputValue}
                isTyping={isTyping}
                onInputChange={setInputValue}
                onSend={handleSendMessage}
                onBack={() => setView("menu")}
                chatEndRef={chatEndRef}
                inputRef={inputRef}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB Button ──────────────────────────────────── */}
      <motion.button
        id="contact-hub-fab"
        onClick={handleToggle}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1.2 }}
        className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center
                    hover:scale-110 active:scale-95 transition-all duration-200 ${
                      open
                        ? "bg-slate-800"
                        : "bg-gradient-to-br from-blue-600 to-blue-700"
                    }`}
        aria-label={open ? "Cerrar centro de contacto" : "Abrir centro de contacto"}
      >
        {/* Pulse ring */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20" />
        )}

        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Headphones className="w-6 h-6 text-white" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        {!open && unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500
                       text-[10px] font-bold text-white flex items-center justify-center
                       ring-2 ring-white"
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MENU VIEW
// ══════════════════════════════════════════════════════════════

function MenuView({
  onOpenChat,
  whatsappUrl,
  onClose,
}: {
  onOpenChat: () => void;
  whatsappUrl: string;
  onClose: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Centro de ayuda</h3>
              <p className="text-[11px] text-blue-100">NEXUS · CMN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center
                       hover:bg-white/20 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-xs text-blue-100/80 leading-relaxed">
          Estamos disponibles 24/7 para ayudarte. Elige cómo prefieres contactarnos.
        </p>
        {/* Status indicator */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-white/80 font-medium">
            Online ahora · Respuesta en ~2 min
          </span>
        </div>
      </div>

      {/* Channel options */}
      <div className="p-4 space-y-2">
        {/* In-app chat */}
        <button
          onClick={onOpenChat}
          className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200
                     hover:bg-blue-50 hover:border-blue-200 active:scale-[0.98]
                     transition-all group text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0
                          group-hover:bg-blue-100 transition-colors">
            <MessageCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900">Chat en vivo</p>
            <p className="text-[11px] text-slate-500">Habla con nosotros al instante</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-600">Online</span>
          </div>
        </button>

        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200
                     hover:bg-emerald-50 hover:border-emerald-200 active:scale-[0.98]
                     transition-all group text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0
                          group-hover:bg-emerald-100 transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-emerald-600">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900">WhatsApp</p>
            <p className="text-[11px] text-slate-500">Mensaje directo al equipo</p>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
            24/7
          </span>
        </a>

        {/* Phone */}
        <a
          href={`tel:+${OPERATOR_PHONE}`}
          className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200
                     hover:bg-violet-50 hover:border-violet-200 active:scale-[0.98]
                     transition-all group text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0
                          group-hover:bg-violet-100 transition-colors">
            <Phone className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900">Llamar</p>
            <p className="text-[11px] text-slate-500">Habla con un agente ahora</p>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
            Directo
          </span>
        </a>

        {/* Email */}
        <a
          href="mailto:soporte@nexus.ma?subject=Consulta desde NEXUS App"
          className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200
                     hover:bg-amber-50 hover:border-amber-200 active:scale-[0.98]
                     transition-all group text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0
                          group-hover:bg-amber-100 transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900">Email</p>
            <p className="text-[11px] text-slate-500">soporte@nexus.ma</p>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
            ~2h
          </span>
        </a>
      </div>

      {/* Bottom note */}
      <div className="px-4 pb-4">
        <p className="text-[10px] text-center text-slate-400">
          Soporte en español, français y العربية
        </p>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// CHAT VIEW
// ══════════════════════════════════════════════════════════════

function ChatView({
  messages,
  inputValue,
  isTyping,
  onInputChange,
  onSend,
  onBack,
  chatEndRef,
  inputRef,
}: {
  messages: ChatMessage[];
  inputValue: string;
  isTyping: boolean;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onBack: () => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100 shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
          aria-label="Volver"
        >
          <ChevronDown className="w-4 h-4 text-slate-500 rotate-90" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">NEXUS Asistente</p>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-emerald-600 font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50/50 min-h-0">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-2"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-1">
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
                  className="w-1.5 h-1.5 rounded-full bg-slate-400"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-slate-400"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                  className="w-1.5 h-1.5 rounded-full bg-slate-400"
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick replies */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 pt-1 flex gap-2 overflow-x-auto bg-white border-t border-slate-100 shrink-0">
          {["Hola 👋", "Reserva", "Recogida aeropuerto", "Documentos"].map((q) => (
            <button
              key={q}
              onClick={() => {
                onInputChange(q);
                // Trigger send after brief delay
                setTimeout(() => {
                  onInputChange(q);
                  onSend();
                }, 50);
              }}
              className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100
                         px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-blue-100
                         active:scale-95 transition-all shrink-0"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="shrink-0 border-t border-slate-100 bg-white px-3 py-2.5 flex items-center gap-2">
        <button
          className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0"
          aria-label="Adjuntar archivo"
        >
          <Paperclip className="w-4 h-4 text-slate-400" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
          placeholder="Escribe un mensaje..."
          className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5
                     placeholder:text-slate-400 text-slate-900 focus:outline-none focus:border-blue-300
                     focus:ring-2 focus:ring-blue-100 transition-all min-h-[40px]"
        />
        <button
          className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0"
          aria-label="Emoji"
        >
          <Smile className="w-4 h-4 text-slate-400" />
        </button>
        <motion.button
          onClick={onSend}
          whileTap={{ scale: 0.9 }}
          disabled={!inputValue.trim()}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
            inputValue.trim()
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              : "bg-slate-100 text-slate-300 cursor-not-allowed"
          }`}
          aria-label="Enviar"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// CHAT BUBBLE
// ══════════════════════════════════════════════════════════════

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === "user";
  const timeStr = message.timestamp.toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
          <Bot className="w-3 h-3 text-white" />
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`text-sm leading-relaxed px-3.5 py-2.5 shadow-sm whitespace-pre-line ${
            isUser
              ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
              : "bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-md"
          }`}
        >
          {message.text}
        </div>

        {/* Time + status */}
        <div className={`flex items-center gap-1 mt-1 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-slate-400">{timeStr}</span>
          {isUser && (
            <span className="text-[10px]">
              {message.status === "read" ? (
                <CheckCheck className="w-3 h-3 text-blue-400" />
              ) : message.status === "delivered" ? (
                <CheckCheck className="w-3 h-3 text-slate-400" />
              ) : (
                <Check className="w-3 h-3 text-slate-400" />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
