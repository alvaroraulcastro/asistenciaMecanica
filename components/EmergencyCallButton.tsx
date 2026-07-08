"use client";

import type { Place } from "@/lib/overpass";

interface EmergencyCallButtonProps {
  nearestPlace: Place | null;
}

export default function EmergencyCallButton({ nearestPlace }: EmergencyCallButtonProps) {
  if (!nearestPlace || !nearestPlace.phone) return null;

  const phone = nearestPlace.phone.replace(/[^+\d]/g, "");
  const telUrl = `tel:${phone}`;

  return (
    <a
      href={telUrl}
      className="emergency-btn fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-base px-6 py-4 rounded-full shadow-lg shadow-red-600/30 transition-all active:scale-95 min-h-[56px] max-w-[calc(100vw-2rem)]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
      <span className="truncate">LLAMAR AL MÁS CERCANO</span>
    </a>
  );
}
