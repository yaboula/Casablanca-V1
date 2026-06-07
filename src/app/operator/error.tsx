"use client";

import { useEffect } from "react";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * F1.1 — Error boundary for the entire operator panel.
 * Replaces silent blank pages when serverFetch throws.
 * Shared by dashboard, documents, search, profile sub-pages.
 */
export default function OperatorError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log to observability platform in production
    console.error("[Operator] Page error:", error.message, error.digest);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <svg
          className="w-7 h-7 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-slate-900 mb-1">
        Error al cargar los datos
      </h2>
      <p className="text-sm text-slate-500 mb-6 max-w-xs">
        No se pudo conectar con el servidor. Comprueba la conexión y vuelve a
        intentarlo.
      </p>
      {process.env.NODE_ENV === "development" && (
        <p className="text-xs text-red-400 font-mono bg-red-50 px-3 py-1.5 rounded mb-4 max-w-sm break-all">
          {error.message}
        </p>
      )}
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
      >
        Reintentar
      </button>
    </div>
  );
}
