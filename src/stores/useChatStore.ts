"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ══════════════════════════════════════════════════════════════
// CHAT STORE — Persistent in-app messaging
// Messages are stored in localStorage and sent to the API
// for operator notification. The operator responds in real-time
// via the operator panel (or WhatsApp bridge when available).
// ══════════════════════════════════════════════════════════════

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "operator" | "system";
  timestamp: number; // epoch ms
  status: "sending" | "sent" | "delivered" | "read" | "error";
}

interface ChatState {
  messages: ChatMessage[];
  unreadCount: number;
}

interface ChatActions {
  addMessage: (text: string, sender: ChatMessage["sender"]) => ChatMessage;
  updateMessageStatus: (id: string, status: ChatMessage["status"]) => void;
  markAllRead: () => void;
  clearChat: () => void;
}

const INITIAL_STATE: ChatState = {
  messages: [],
  unreadCount: 0,
};

export const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      addMessage: (text, sender) => {
        const msg: ChatMessage = {
          id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text,
          sender,
          timestamp: Date.now(),
          status: sender === "user" ? "sending" : "delivered",
        };
        set((state) => ({
          messages: [...state.messages, msg],
          unreadCount:
            sender !== "user" ? state.unreadCount + 1 : state.unreadCount,
        }));
        return msg;
      },

      updateMessageStatus: (id, status) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, status } : m
          ),
        }));
      },

      markAllRead: () => set({ unreadCount: 0 }),

      clearChat: () => set(INITIAL_STATE),
    }),
    {
      name: "nexus-chat",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
