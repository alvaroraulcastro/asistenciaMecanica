import type { Coordinates } from "./geolocation";
import type { Place, PlaceType } from "./overpass";

const STORAGE_KEYS = {
  userLocation: "app_userLocation",
  activeFilter: "app_activeFilter",
  radius: "app_radius",
  lastPlaces: "app_lastPlaces",
} as const;

interface StoredData {
  userLocation: Coordinates | null;
  activeFilter: PlaceType;
  radius: number;
  lastPlaces: Place[];
}

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable
  }
}

export function loadAppState(): StoredData {
  return {
    userLocation: safeGet<Coordinates | null>(STORAGE_KEYS.userLocation, null),
    activeFilter: safeGet<PlaceType>(STORAGE_KEYS.activeFilter, "talleres"),
    radius: safeGet<number>(STORAGE_KEYS.radius, 5000),
    lastPlaces: safeGet<Place[]>(STORAGE_KEYS.lastPlaces, []),
  };
}

export function saveUserLocation(coords: Coordinates | null): void {
  safeSet(STORAGE_KEYS.userLocation, coords);
}

export function saveActiveFilter(filter: PlaceType): void {
  safeSet(STORAGE_KEYS.activeFilter, filter);
}

export function saveRadius(radius: number): void {
  safeSet(STORAGE_KEYS.radius, radius);
}

export function saveLastPlaces(places: Place[]): void {
  safeSet(STORAGE_KEYS.lastPlaces, places);
}
