export interface Coordinates {
  lat: number;
  lng: number;
}

export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("La geolocalización no está soportada en este navegador."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Permiso de ubicación denegado. Puede ingresar su dirección manualmente."));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Ubicación no disponible. Intente ingresando su dirección."));
            break;
          case error.TIMEOUT:
            reject(new Error("Tiempo de espera agotado. Intente nuevamente."));
            break;
          default:
            reject(new Error("Error al obtener la ubicación."));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

export async function geocodeAddress(address: string): Promise<Coordinates> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "MecanicoCercaApp/1.0" },
  });

  if (!res.ok) {
    throw new Error("Error al buscar la dirección.");
  }

  const data = await res.json();

  if (!data || data.length === 0) {
    throw new Error("No se encontró la dirección. Intente con otra.");
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}
