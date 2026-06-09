"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CurrentUser } from "@/lib/auth/types";
import { LogoutButton } from "./LogoutButton";

export function SessionNav() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/auth/session", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json();
        return payload?.user ?? null;
      })
      .then((nextUser) => {
        if (isMounted) setUser(nextUser);
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setHasLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!hasLoaded) {
    return <span className="text-sm text-neutral-500">Session</span>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link className="text-sm font-bold text-neutral-700" href="/login">
          Login
        </Link>
        <Link
          className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-bold text-white"
          href="/register"
        >
          Register
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <span className="text-sm font-semibold text-neutral-700">
        {user.fullName || user.email}
      </span>
      <Link className="text-sm font-bold text-neutral-700" href="/dashboard">
        Dashboard
      </Link>
      {user.role === "OPERATOR" || user.role === "ADMIN" ? (
        <Link className="text-sm font-bold text-neutral-700" href="/operator/dashboard">
          Operator
        </Link>
      ) : null}
      {user.role === "ADMIN" ? (
        <Link className="text-sm font-bold text-neutral-700" href="/admin">
          Admin
        </Link>
      ) : null}
      <LogoutButton />
    </div>
  );
}
