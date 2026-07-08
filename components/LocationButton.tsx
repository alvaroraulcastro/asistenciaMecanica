"use client";

import { useState } from "react";

interface LocationButtonProps {
  onLocationFound: () => void;
  onManualSearch: (address: string) => void;
  loading: boolean;
}

export default function LocationButton({ onLocationFound, onManualSearch, loading }: LocationButtonProps) {
  const [showManual, setShowManual] = useState(false);
  const [address, setAddress] = useState("");

  const handleSearch = () => {
    if (address.trim()) {
      onManualSearch(address.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  if (showManual) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 shadow-lg">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
          Ingrese su dirección o ciudad:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: Av. Reforma 123, Ciudad de México"
            className="flex-1 px-3 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            autoFocus
          />
          <button
            onClick={handleSearch}
            disabled={!address.trim() || loading}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm min-h-[44px] transition-colors"
          >
            {loading ? "..." : "Buscar"}
          </button>
        </div>
        <button
          onClick={() => setShowManual(false)}
          className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Usar mi ubicación
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onLocationFound}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all active:scale-[0.98] text-lg min-h-[56px]"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Buscando...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Encontrar cerca de mí
          </>
        )}
      </button>
      <button
        onClick={() => setShowManual(true)}
        className="w-full flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 py-2 text-sm font-medium transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        O escriba su dirección manualmente
      </button>
    </div>
  );
}
