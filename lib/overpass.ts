import { haversineDistance } from "./distance";
import type { Coordinates } from "./geolocation";

export interface Place {
  id: number;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  distance: number;
  tags: Record<string, string>;
}

export type PlaceType = "talleres" | "gruas";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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

function buildQuery(type: PlaceType, lat: number, lng: number, radius: number): string {
  const tag = type === "talleres" ? '"shop"="car_repair"' : '"amenity"="towing_service"';
  return `
    [out:json][timeout:10];
    (
      node[${tag}](around:${radius},${lat},${lng});
    );
    out body;
  `.trim();
}

function parseOverpassResponse(json: OverpassJson, userCoords: Coordinates): Place[] {
  return (json.elements || [])
    .filter((el) => el.type === "node" && el.lat !== undefined && el.lon !== undefined)
    .map((el) => ({
      id: el.id,
      name: el.tags?.name || el.tags?.["name:es"] || "Sin nombre",
      lat: el.lat!,
      lng: el.lon!,
      address: buildAddress(el.tags || {}),
      phone: el.tags?.phone || el.tags?.["contact:phone"],
      distance: haversineDistance(userCoords.lat, userCoords.lng, el.lat!, el.lon!),
      tags: el.tags || {},
    }))
    .sort((a, b) => a.distance - b.distance);
}

function buildAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    tags["addr:street"],
    tags["addr:housenumber"],
    tags["addr:city"],
    tags["addr:suburb"],
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

interface OverpassJson {
  elements: Array<{
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    tags?: Record<string, string>;
  }>;
}

export async function fetchPlaces(
  type: PlaceType,
  coords: Coordinates,
  radius: number
): Promise<Place[]> {
  const cacheKey = getCacheKey(type, coords.lat, coords.lng, radius);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const query = buildQuery(type, coords.lat, coords.lng, radius);

  let response: Response;
  try {
    response = await fetch(OVERPASS_URL, {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  } catch {
    throw new Error("Error de red al consultar Overpass API. Verifique su conexión.");
  }

  if (response.status === 429) {
    throw new Error("Demasiadas consultas. Espere un momento e intente nuevamente.");
  }

  if (!response.ok) {
    throw new Error("Error del servidor de mapas. Intente nuevamente.");
  }

  let json: OverpassJson;
  try {
    json = await response.json();
  } catch {
    throw new Error("Error al procesar la respuesta del servidor.");
  }

  const places = parseOverpassResponse(json, coords);
  setCache(cacheKey, places);
  return places;
}
