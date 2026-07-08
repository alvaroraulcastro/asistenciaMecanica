import type { Coordinates } from "./geolocation";
import type { Place, PlaceType } from "./overpass-query";

export type { Place, PlaceType } from "./overpass-query";

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const CLIENT_TIMEOUT_MS = 45_000;

interface CacheEntry {
  data: Place[];
  timestamp: number;
}

function getCacheKey(type: PlaceType, lat: number, lng: number, radius: number): string {
  return `overpass_${type}_${lat.toFixed(3)}_${lng.toFixed(3)}_${radius}`;
}

function getCached(key: string): Place[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setCache(key: string, data: Place[]): void {
  try {
    const entry: CacheEntry = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable
  }
}

export async function fetchPlaces(
  type: PlaceType,
  coords: Coordinates,
  radius: number
): Promise<Place[]> {
  const cacheKey = getCacheKey(type, coords.lat, coords.lng, radius);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        lat: coords.lat,
        lng: coords.lng,
        radius,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("La búsqueda tardó demasiado. Pruebe reducir el radio o intente de nuevo.");
    }
    throw new Error("Error de red al consultar el servidor. Verifique su conexión.");
  } finally {
    clearTimeout(timeoutId);
  }

  let payload: { places?: Place[]; error?: string };
  try {
    payload = await response.json();
  } catch {
    throw new Error("Error al procesar la respuesta del servidor.");
  }

  if (!response.ok) {
    throw new Error(payload.error || "Error del servidor de mapas. Intente nuevamente.");
  }

  const places = payload.places ?? [];
  setCache(cacheKey, places);
  return places;
}
