"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { MOCK_DELIVERIES } from "@/lib/mock-operator-data";

export default function OperatorSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<typeof MOCK_DELIVERIES>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(() => {
    const q = query.trim().toLowerCase();
    if (!q) return;

    const matches = MOCK_DELIVERIES.filter(
      (d) =>
        d.customerName?.toLowerCase().includes(q) ||
        d.customerPhone?.replace(/[\s]/g, "").includes(q.replace(/[\s]/g, "")) ||
        d.id.toLowerCase().includes(q) ||
        d.vehicle.brand.toLowerCase().includes(q) ||
        d.vehicle.model.toLowerCase().includes(q)
    );
    setResults(matches);
    setSearched(true);

    if (matches.length === 0) {
      toast.error("Sin resultados");
    }
  }, [query]);

  return (
    <div className="max-w-lg mx-auto px-5 pt-6">
      <h1 className="text-lg font-bold text-slate-900 mb-4">Buscar reserva</h1>

      {/* Search input */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Nombre, teléfono o ID de reserva..."
          className="flex-1 min-h-[48px] px-4 bg-white border border-slate-200 rounded-xl
                     text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none shadow-sm"
        />
        <button
          onClick={handleSearch}
          className="min-h-[48px] px-4 bg-blue-600 text-white rounded-xl font-bold
                     hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Results */}
      {searched && results.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-8">
          No se encontraron reservas para &ldquo;{query}&rdquo;
        </p>
      )}

      <div className="space-y-2">
        {results.map((d) => (
          <button
            key={d.id}
            onClick={() => router.push(`/operator/delivery/${d.id}`)}
            className="w-full bg-white border border-slate-200 rounded-xl p-4 text-left
                       hover:border-slate-300 transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-slate-900">{d.customerName}</span>
              <span className="text-xs text-slate-400 font-mono">#{d.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {d.vehicle.brand} {d.vehicle.model}
              </span>
              <span className="text-xs font-bold text-slate-900">{d.balanceDueEUR} €</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
