"use client";

import type { PlaceType } from "@/lib/overpass";

interface FilterTabsProps {
  activeFilter: PlaceType;
  onFilterChange: (filter: PlaceType) => void;
  radius: number;
  onRadiusChange: (radius: number) => void;
  onlyOpen: boolean;
  onOnlyOpenChange: (onlyOpen: boolean) => void;
}

const FILTERS: { key: PlaceType; label: string; icon: string }[] = [
  { key: "talleres", label: "Talleres", icon: "🔧" },
  { key: "gruas", label: "Grúas", icon: "🚛" },
];

export default function FilterTabs({ activeFilter, onFilterChange, radius, onRadiusChange, onlyOpen, onOnlyOpenChange }: FilterTabsProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
      <div className="flex gap-2 mb-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all min-h-[44px] ${
              activeFilter === f.key
                ? "bg-blue-600 text-white shadow-md"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <label htmlFor="radius" className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
          Radio: {radius >= 1000 ? `${(radius / 1000).toFixed(1)} km` : `${radius} m`}
        </label>
        <input
          id="radius"
          type="range"
          min={1000}
          max={20000}
          step={1000}
          value={radius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-blue-600"
        />
      </div>
      <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={onlyOpen}
          onChange={(e) => onOnlyOpenChange(e.target.checked)}
          className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Solo abiertos ahora</span>
      </label>
    </div>
  );
}
