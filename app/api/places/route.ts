import { NextRequest, NextResponse } from "next/server";
import { fetchPlacesFromOverpass } from "@/lib/overpass-server";
import type { PlaceType } from "@/lib/overpass-query";

const VALID_TYPES = new Set<PlaceType>(["talleres", "gruas"]);

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const { type, lat, lng, radius } = body as {
    type?: unknown;
    lat?: unknown;
    lng?: unknown;
    radius?: unknown;
  };

  if (typeof type !== "string" || !VALID_TYPES.has(type as PlaceType)) {
    return NextResponse.json({ error: "Tipo de búsqueda inválido." }, { status: 400 });
  }

  if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Coordenadas inválidas." }, { status: 400 });
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Coordenadas fuera de rango." }, { status: 400 });
  }

  const safeRadius =
    typeof radius === "number" && Number.isFinite(radius)
      ? Math.min(20_000, Math.max(1_000, Math.round(radius)))
      : 5_000;

  try {
    const places = await fetchPlacesFromOverpass(type as PlaceType, { lat, lng }, safeRadius);
    return NextResponse.json({ places });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido al buscar.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
