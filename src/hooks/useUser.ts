"use client";

import { useState, useEffect } from "react";

export interface NexusUser {
  id: string;
  email: string;
  fullName: string;
  role: "USER" | "OPERATOR" | "ADMIN";
}

/**
 * Reads the authenticated user from the `nexus_user` cookie (public, not HttpOnly).
 * Returns `null` when there is no active session or on the server.
 *
 * This hook is synchronous-after-mount: it avoids SSR hydration mismatches by
 * returning `null` on the first render and resolving on mount.
 */
export function useUser(): NexusUser | null {
  const [user, setUser] = useState<NexusUser | null>(null);

  useEffect(() => {
    const sync = () => setUser(readUserCookie());
    sync();
    // Re-sync whenever login/logout fires the custom event
    window.addEventListener("nexus-auth-change", sync);
    return () => window.removeEventListener("nexus-auth-change", sync);
  }, []);

  return user;
}

export function readUserCookie(): NexusUser | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/nexus_user=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as NexusUser;
  } catch {
    return null;
  }
}
