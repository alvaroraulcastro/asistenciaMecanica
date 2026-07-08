# AGENTS.md - Mecánico y Grúa más cercana

## Resumen del proyecto

Aplicación web PWA mobile-first que, usando geolocalización del usuario, muestra en un mapa los talleres mecánicos y servicios de grúa más cercanos con botones de llamada y WhatsApp. Todo funciona client-side sin backend propio.

## Comandos de verificación

```bash
# Verificar tipos TypeScript
npx tsc --noEmit

# Build de producción
npm run build

# Lint (nota: eslint-config-next tiene issues conocidos con Node.js 22)
npm run lint

# Desarrollo
npm run dev
```

## Stack técnico

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Estilos**: Tailwind CSS v4
- **Mapa**: Leaflet + react-leaflet (OpenStreetMap tiles)
- **APIs externas**: Overpass API (talleres/grúas), Nominatim (geocodificación)
- **PWA**: manifest.json + service worker (pendiente)
- **Node**: v22.23.1, npm 11.16.0

## Convenciones del proyecto

### TypeScript
- Todos los componentes usan `"use client"` (son interactivos)
- El Map.tsx se importa con `dynamic(() => ..., { ssr: false })` porque Leaflet necesita `window`
- Interfaces principales: `Place`, `PlaceType`, `Coordinates`
- Path alias: `@/*` mapea a la raíz del proyecto

### Componentes
- Cada componente está en un archivo separado bajo `components/`
- Componentes funcionales con hooks, sin clases
- Props tipadas con interfaces
- Tailwind para todos los estilos (sin CSS modules)
- Botones mínimos de 44x44px para touch (mobile-first)

### Estructura de archivos
```
app/
  layout.tsx          # Layout raíz, metadata, font, PWA tags
  page.tsx            # Home: estado principal, integra todo
  globals.css         # Leaflet CSS + Tailwind overrides
components/
  Map.tsx             # Mapa Leaflet (sin SSR)
  PlaceCard.tsx       # Tarjeta de resultado con botones acción
  FilterTabs.tsx      # Tabs Talleres/Grúas + slider radio
  LocationButton.tsx  # Botón ubicación + input manual
lib/
  overpass.ts         # Consultas Overpass API + caché localStorage
  geolocation.ts      # navigator.geolocation + Nominatim geocoding
  distance.ts         # Haversine + formato distancia
public/
  manifest.json       # PWA manifest
  icons/              # Iconos SVG para PWA
```

### Estado (app/page.tsx)
El estado global vive en `page.tsx`:
- `userLocation: Coordinates | null` - Ubicación del usuario
- `activeFilter: PlaceType` - "talleres" | "gruas"
- `radius: number` - Radio de búsqueda en metros (1000-20000)
- `places: Place[]` - Resultados de Overpass
- `selectedPlaceId: number | null` - Lugar seleccionado en mapa/lista
- `locationFound: boolean` - Si ya se obtuvo ubicación
- `loading: boolean` - Estado de carga
- `error: string | null` - Mensajes de error

### APIs externas
- **Overpass API** (`https://overpass-api.de/api/interpreter`): Consultas POST con query QL
  - Talleres: `node["shop"="car_repair"](around:RADIO,LAT,LON)`
  - Grúas: `node["amenity"="towing_service"](around:RADIO,LAT,LON)`
  - Rate limiting: máximo ~2 req/s, caché 10min en localStorage
  - Manejar HTTP 429 (rate limit) y errores de red
- **Nominatim** (`https://nominatim.openstreetmap.org/search`): Geocodificación inversa
  - Requiere User-Agent header
  - Solo para búsqueda manual de dirección

### Estilos
- Tailwind v4 con `@import "tailwindcss"`
- Variables CSS en `:root` y `@media (prefers-color-scheme: dark)`
- Overrides de Leaflet en `globals.css` (popup, zoom, marcadores)
- Scrollbar personalizado para la lista de resultados
- Range input personalizado para el slider de radio

### PWA
- `public/manifest.json` con display: standalone
- Meta tags en layout.tsx: theme-color, apple-web-app, viewport
- Iconos SVG en `public/icons/` (placeholder, reemplazar con PNG para producción)

## Datos y tipos

### Place (lib/overpass.ts)
```typescript
interface Place {
  id: number;          // ID del nodo OSM
  name: string;        // name o "Sin nombre"
  lat: number;
  lng: number;
  address?: string;    // addr:street, addr:housenumber, addr:city
  phone?: string;      // phone o contact:phone
  distance: number;    // km desde el usuario
  tags: Record<string, string>;  // Todos los tags OSM
}
```

### PlaceType (lib/overpass.ts)
```typescript
type PlaceType = "talleres" | "gruas";
```

### Coordinates (lib/geolocation.ts)
```typescript
interface Coordinates {
  lat: number;
  lng: number;
}
```

## Errores conocidos

1. **ESLint con Node.js 22**: `eslint-config-next` tiene un bug de compatibilidad con `es-abstract/2025/ToString`. El lint no funciona pero el build y typescript pasan correctamente.

2. **Iconos PWA**: Los iconos son SVG placeholder. Para producción se necesitan PNG (192x192 y 512x512).

3. **Service Worker**: Aún no implementado. Para PWA completa se necesita registrar un SW.

## Flujos principales

### Flujo de geolocalización
1. Usuario toca "Encontrar cerca de mí"
2. Se solicita permiso `navigator.geolocation.getCurrentPosition`
3. Si permiso denegado → mostrar input de dirección manual
4. Si exitoso → coordinadas a `fetchPlaces()` → mostrar mapa + resultados

### Flujo de búsqueda manual
1. Usuario toca "O escriba su dirección manualmente"
2. Se muestra input de texto
3. Al enviar → `geocodeAddress()` con Nominatim → coordinadas a `fetchPlaces()`

### Flujo de selección
1. Usuario toca una tarjeta en la lista
2. Se hace scroll a la tarjeta + se centra el mapa en el marcador
3. Se abre el popup del marcador en el mapa
4. Botones "Llamar" (tel:) y "WhatsApp" (wa.me) abren apps nativas

## Futuras mejoras pendientes

- Service worker para PWA offline
- Iconos PNG reales
- Filtro por tipo de servicio (eléctrico, grúa pesada)
- Compartir ubicación del taller
- Backend propio para caché persistente
- Supabase para storing
