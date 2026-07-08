"use client";

import { useState } from "react";
import type { Place } from "@/lib/overpass";
import { formatDistance } from "@/lib/distance";
import { isOpenNow, getTodaySchedule } from "@/lib/time";

interface PlaceCardProps {
  place: Place;
  isSelected: boolean;
  onSelect: (id: number) => void;
  whatsappMessage?: string;
}

export default function PlaceCard({ place, isSelected, onSelect, whatsappMessage }: PlaceCardProps) {
  const [shareTooltip, setShareTooltip] = useState(false);
  const phone = place.phone?.replace(/[^+\d]/g, "");
  const waText = encodeURIComponent(whatsappMessage || "Hola, necesito asistencia mecánica. ¿Podrían ayudarme?");
  const waUrl = phone ? `https://wa.me/${phone.replace(/^\+/, "")}?text=${waText}` : null;
  const telUrl = phone ? `tel:${phone}` : null;
  const openStatus = isOpenNow(place.openingHours);
  const todaySchedule = getTodaySchedule(place.openingHours);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
  const wazeUrl = `https://www.waze.com/ul?ll=${place.lat},${place.lng}&navigate=yes`;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `${place.name} - ${place.address || "Sin dirección"} ${googleMapsUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: place.name, text: shareText, url: googleMapsUrl });
      } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(shareText);
      setShareTooltip(true);
      setTimeout(() => setShareTooltip(false), 2000);
    }
  };

  return (
    <div
      onClick={() => onSelect(place.id)}
      className={`rounded-xl border p-4 cursor-pointer transition-all active:scale-[0.98] ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-500/20"
          : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {place.name}
            </h3>
            {openStatus !== null && (
              <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                openStatus
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
              }`}>
                {openStatus ? "ABIERTO" : "CERRADO"}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {formatDistance(place.distance)}
          </p>
          {todaySchedule && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              {todaySchedule}
            </p>
          )}
          {place.address && (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 truncate">
              {place.address}
            </p>
          )}
        </div>
        <button
          onClick={handleShare}
          className="shrink-0 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors relative"
          title="Compartir"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {shareTooltip && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
              Copiado
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-2 mt-3">
        <div className="flex gap-2">
          {telUrl && (
            <a
              href={telUrl}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors min-h-[44px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Llamar
            </a>
          )}
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors min-h-[44px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          )}
        </div>
        <div className="flex gap-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-lg transition-colors min-h-[36px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Cómo llegar
          </a>
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors min-h-[36px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6c1.8 0 3.6.6 5.04 1.68-1.2.72-2.64 1.2-4.2 1.2-.84 0-1.68-.12-2.4-.36.24-.84.72-1.56 1.32-2.16.72-.72 1.56-1.2 2.4-1.44-.36-.12-.72-.12-1.08-.12H12c-.48 0-.96.12-1.44.24zm-5.28 5.04c.72-.36 1.56-.6 2.4-.72.48 1.32 1.32 2.4 2.4 3.12-.48.36-.96.84-1.32 1.32-.24-.12-.48-.12-.72-.12-.6 0-1.2.24-1.68.6-.24.24-.48.48-.6.72-.12.36-.12.72-.12 1.08 0 .36.12.72.24 1.08-.72.12-1.32.48-1.8.96-.48.6-.72 1.32-.72 2.16 0 .6.12 1.2.36 1.68-.96-.24-1.68-.96-2.16-1.8-.48-.84-.72-1.8-.72-2.76 0-1.2.36-2.28 1.08-3.24.36-.48.84-.84 1.32-1.14zm10.56 0c.48.3.96.66 1.32 1.14.72.96 1.08 2.04 1.08 3.24 0 .96-.24 1.92-.72 2.76-.48.84-1.2 1.56-2.16 1.8.24-.48.36-1.08.36-1.68 0-.84-.24-1.56-.72-2.16-.48-.48-1.08-.84-1.8-.96.12-.36.24-.72.24-1.08 0-.36 0-.72-.12-1.08-.12-.24-.36-.48-.6-.72-.48-.36-1.08-.6-1.68-.6-.24 0-.48 0-.72.12-.36-.48-.84-.96-1.32-1.32 1.08-.72 1.92-1.8 2.4-3.12.84.24 1.68.36 2.4.36.48 0 .96 0 1.44-.12-.12 0-.12 0-.12.12z"/>
            </svg>
            Waze
          </a>
        </div>
      </div>
    </div>
  );
}
