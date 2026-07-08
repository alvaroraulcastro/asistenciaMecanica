import { haversineDistance } from "./distance";
import type { Coordinates } from "./geolocation";

export interface Place {
  id: number;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  openingHours?: string;
  distance: number;
  tags: Record<string, string>;
}

export type PlaceType = "talleres" | "gruas";

export interface OverpassJson {
  elements: Array<{
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    tags?: Record<string, string>;
  }>;
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

function getQueryTimeout(radius: number): number {
  if (radius <= 5000) return 15;
  if (radius <= 12000) return 25;
  return 35;
}

export function buildOverpassQuery(
  type: PlaceType,
  lat: number,
  lng: number,
  radius: number
): string {
  const tag = type === "talleres" ? '"shop"="car_repair"' : '"amenity"="towing_service"';
  const timeout = getQueryTimeout(radius);
  return `
    [out:json][timeout:${timeout}];
    (
      node[${tag}](around:${radius},${lat},${lng});
    );
    out body;
  `.trim();
}

export function parseOverpassResponse(json: OverpassJson, userCoords: Coordinates): Place[] {
  return (json.elements || [])
    .filter((el) => el.type === "node" && el.lat !== undefined && el.lon !== undefined)
    .map((el) => ({
      id: el.id,
      name: el.tags?.name || el.tags?.["name:es"] || "Sin nombre",
      lat: el.lat!,
      lng: el.lon!,
      address: buildAddress(el.tags || {}),
      phone: el.tags?.phone || el.tags?.["contact:phone"],
      openingHours: el.tags?.["opening_hours"],
      distance: haversineDistance(userCoords.lat, userCoords.lng, el.lat!, el.lon!),
      tags: el.tags || {},
    }))
    .sort((a, b) => a.distance - b.distance);
}
