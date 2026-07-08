import type { Coordinates } from "./geolocation";
import {
  buildOverpassQuery,
  parseOverpassResponse,
  type OverpassJson,
  type Place,
  type PlaceType,
} from "./overpass-query";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
] as const;

function getFetchTimeoutMs(radius: number): number {
  if (radius <= 5000) return 20_000;
  if (radius <= 12000) return 30_000;
  return 40_000;
}

async function queryOverpassEndpoint(
  endpoint: string,
  query: string,
  signal: AbortSignal
): Promise<Response> {
  return fetch(endpoint, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "AsistenciaMecanica/1.0 (Next.js proxy)",
    },
    signal,
    cache: "no-store",
  });
}

export async function fetchPlacesFromOverpass(
  type: PlaceType,
  coords: Coordinates,
  radius: number
): Promise<Place[]> {
  const query = buildOverpassQuery(type, coords.lat, coords.lng, radius);
  const fetchTimeoutMs = getFetchTimeoutMs(radius);
  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchTimeoutMs);

    try {
      const response = await queryOverpassEndpoint(endpoint, query, controller.signal);

      if (response.status === 429) {
        lastError = new Error("Demasiadas consultas. Espere un momento e intente nuevamente.");
        continue;
      }

      if (!response.ok) {
        lastError = new Error("Error del servidor de mapas. Intente nuevamente.");
        continue;
      }

      let json: OverpassJson;
      try {
        json = (await response.json()) as OverpassJson;
      } catch {
        lastError = new Error("Error al procesar la respuesta del servidor.");
        continue;
      }

      return parseOverpassResponse(json, coords);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        lastError = new Error(
          "La búsqueda tardó demasiado. Pruebe reducir el radio o intente de nuevo."
        );
      } else {
        lastError = new Error("Error de red al consultar Overpass API. Verifique su conexión.");
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError ?? new Error("No se pudo consultar el servidor de mapas.");
}
