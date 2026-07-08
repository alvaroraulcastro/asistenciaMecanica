"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Place } from "@/lib/overpass";
import { formatDistance } from "@/lib/distance";

interface MapProps {
  places: Place[];
  userLocation: { lat: number; lng: number } | null;
  selectedPlaceId: number | null;
  onSelectPlace: (id: number) => void;
  onCenterLocation: () => void;
}

const markerIcon = (type: string) => {
  const color = type === "talleres" ? "#ef4444" : "#3b82f6";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);
    "><span style="transform:rotate(45deg);font-size:14px;color:white;">${type === "talleres" ? "🔧" : "🚛"}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function Map({ places, userLocation, selectedPlaceId, onSelectPlace, onCenterLocation }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([0, 0], 13);

    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    map.setView([userLocation.lat, userLocation.lng], 14);

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      const userIcon = L.divIcon({
        className: "user-marker",
        html: `<div style="
          width:20px;height:20px;border-radius:50%;
          background:#22c55e;border:3px solid white;
          box-shadow:0 0 0 3px rgba(34,197,94,.3),0 2px 6px rgba(0,0,0,.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup("<strong>Tu ubicación</strong>");
    }
  }, [userLocation]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    places.forEach((place) => {
      const icon = markerIcon(place.tags?.shop || place.tags?.amenity || "");
      const marker = L.marker([place.lat, place.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="min-width:160px">
            <strong>${place.name}</strong><br/>
            <small>${formatDistance(place.distance)}</small>
            ${place.address ? `<br/><small>${place.address}</small>` : ""}
            ${place.phone ? `<br/><a href="tel:${place.phone}" style="color:#2563eb">📞 Llamar</a>` : ""}
          </div>`
        );

      marker.on("click", () => onSelectPlace(place.id));
      markersRef.current.push(marker);
    });
  }, [places, onSelectPlace]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlaceId) return;

    const place = places.find((p) => p.id === selectedPlaceId);
    if (place) {
      map.setView([place.lat, place.lng], 16, { animate: true });
      const marker = markersRef.current.find((m) => {
        const ll = m.getLatLng();
        return ll.lat === place.lat && ll.lng === place.lng;
      });
      if (marker) marker.openPopup();
    }
  }, [selectedPlaceId, places]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation || places.length === 0) return;

    const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng]]);
    places.forEach((p) => bounds.extend([p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [userLocation, places]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <button
        onClick={onCenterLocation}
        className="absolute bottom-4 left-4 z-[1000] bg-white dark:bg-zinc-800 rounded-full p-3 shadow-lg border border-zinc-200 dark:border-zinc-700 active:scale-95 transition-transform"
        aria-label="Centrar en mi ubicación"
        title="Centrar en mi ubicación"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-700 dark:text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
}
