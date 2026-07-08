"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import type { Place, PlaceType } from "@/lib/overpass";
import { fetchPlaces } from "@/lib/overpass";
import { getCurrentPosition, geocodeAddress, type Coordinates } from "@/lib/geolocation";
import { isOpenNow } from "@/lib/time";
import { loadAppState, saveUserLocation, saveActiveFilter, saveRadius, saveLastPlaces } from "@/lib/storage";
import FilterTabs from "@/components/FilterTabs";
import PlaceCard from "@/components/PlaceCard";
import LocationButton from "@/components/LocationButton";
import EmergencyHeader from "@/components/EmergencyHeader";
import EmergencyCallButton from "@/components/EmergencyCallButton";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const MAX_RETRIES = 2;

export default function Home() {
  const saved = loadAppState();
  const [userLocation, setUserLocation] = useState<Coordinates | null>(saved.userLocation);
  const [activeFilter, setActiveFilter] = useState<PlaceType>(saved.activeFilter);
  const [radius, setRadius] = useState(saved.radius);
  const [places, setPlaces] = useState<Place[]>(saved.lastPlaces);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [locationFound, setLocationFound] = useState(!!saved.userLocation);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (saved.userLocation && saved.lastPlaces.length > 0) {
      setLocationFound(true);
    }
  }, [saved.userLocation, saved.lastPlaces.length]);

  const loadPlaces = useCallback(async (coords: Coordinates, type: PlaceType, r: number, isRetry = false) => {
    if (!isRetry) {
      setLoading(true);
      setError(null);
      retryCountRef.current = 0;
    }
    try {
      const results = await fetchPlaces(type, coords, r);
      setPlaces(results);
      saveLastPlaces(results);
      if (results.length === 0) {
        setError("No se encontraron resultados en este radio. Pruebe ampliando la distancia.");
      }
      retryCountRef.current = 0;
    } catch (err) {
      if (!isRetry && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        const delay = 1000 * retryCountRef.current;
        setTimeout(() => {
          loadPlaces(coords, type, r, true);
        }, delay);
        return;
      }
      setError(err instanceof Error ? err.message : "Error desconocido al buscar.");
      setPlaces([]);
      retryCountRef.current = 0;
    } finally {
      if (!isRetry || retryCountRef.current === 0) {
        setLoading(false);
      }
    }
  }, []);

  const handleLocationFound = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const coords = await getCurrentPosition();
      setUserLocation(coords);
      saveUserLocation(coords);
      setLocationFound(true);
      await loadPlaces(coords, activeFilter, radius);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo obtener la ubicación.");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, radius, loadPlaces]);

  const handleManualSearch = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);
    try {
      const coords = await geocodeAddress(address);
      setUserLocation(coords);
      saveUserLocation(coords);
      setLocationFound(true);
      await loadPlaces(coords, activeFilter, radius);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar la dirección.");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, radius, loadPlaces]);

  const handleFilterChange = useCallback((filter: PlaceType) => {
    setActiveFilter(filter);
    saveActiveFilter(filter);
    if (userLocation) {
      loadPlaces(userLocation, filter, radius);
    }
  }, [userLocation, radius, loadPlaces]);

  const handleRadiusChange = useCallback((newRadius: number) => {
    setRadius(newRadius);
    saveRadius(newRadius);
    if (userLocation) {
      loadPlaces(userLocation, activeFilter, newRadius);
    }
  }, [userLocation, activeFilter, loadPlaces]);

  const handleSelectPlace = useCallback((id: number) => {
    setSelectedPlaceId(id);
    const el = document.getElementById(`place-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  const handleCenterLocation = useCallback(() => {
    if (userLocation && places.length > 0) {
      setSelectedPlaceId(null);
    }
  }, [userLocation, places]);

  const filteredPlaces = onlyOpen
    ? places.filter((p) => isOpenNow(p.openingHours) === true)
    : places;

  const nearestPlace = filteredPlaces.length > 0 ? filteredPlaces[0] : null;

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Mecánico y Grúa más cercana
          </h1>
          <EmergencyHeader userLocation={userLocation} />
        </div>
      </header>

      {/* Location Button / Error */}
      {!locationFound && (
        <div className="px-4 py-4 shrink-0">
          <LocationButton
            onLocationFound={handleLocationFound}
            onManualSearch={handleManualSearch}
            loading={loading && !locationFound}
          />
          {error && (
            <div className="mt-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      {locationFound && (
        <FilterTabs
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          radius={radius}
          onRadiusChange={handleRadiusChange}
          onlyOpen={onlyOpen}
          onOnlyOpenChange={setOnlyOpen}
        />
      )}

      {/* Map */}
      <div className={`shrink-0 ${locationFound ? "h-[45vh] md:h-[55vh]" : "h-[30vh]"}`}>
        <Map
          places={filteredPlaces}
          userLocation={userLocation}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={handleSelectPlace}
          onCenterLocation={handleCenterLocation}
        />
      </div>

      {/* Results */}
      {locationFound && (
        <div ref={resultsRef} className="flex-1 overflow-y-auto results-scroll px-4 py-3 pb-24">
          {loading && filteredPlaces.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Buscando {activeFilter === "talleres" ? "talleres mecánicos" : "servicios de grúa"}...</p>
            </div>
          )}

          {error && filteredPlaces.length === 0 && (
            <div className="text-center py-8">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">{error}</p>
              <button
                onClick={() => userLocation && loadPlaces(userLocation, activeFilter, radius)}
                className="mt-3 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {filteredPlaces.length > 0 && (
            <>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">
                {filteredPlaces.length} resultado{filteredPlaces.length !== 1 ? "s" : ""} encontrado{filteredPlaces.length !== 1 ? "s" : ""}
                {onlyOpen && ` (abierto${filteredPlaces.length !== 1 ? "s" : ""})`}
              </p>
              <div className="flex flex-col gap-3 pb-4">
                {filteredPlaces.map((place) => (
                  <div key={place.id} id={`place-${place.id}`}>
                    <PlaceCard
                      place={place}
                      isSelected={selectedPlaceId === place.id}
                      onSelect={setSelectedPlaceId}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Emergency Call Button */}
      <EmergencyCallButton nearestPlace={nearestPlace} />
    </div>
  );
}
