# 🔧 Mecánico y Grúa más cercana

Aplicación web responsive (mobile-first) que, usando la geolocalización del usuario, muestra en un mapa los **talleres mecánicos** y **servicios de grúa** más cercanos, con botones de acción directa para llamar o abrir WhatsApp.

## Stack técnico

- **Next.js** con App Router y TypeScript
- **Tailwind CSS** para estilos
- **Leaflet** + **react-leaflet** con tiles de **OpenStreetMap**
- **Overpass API** para consultar talleres y grúas
- **PWA** instalable en el celular

## Inalación y ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Abrir en el navegador
# http://localhost:3000
```

## Build para producción

```bash
npm run build
npm start
```

## Características

- 🗺️ Mapa interactivo con marcadores
- 📍 Geolocalización automática o búsqueda manual por dirección
- 🔧 Filtro de talleres mecánicos
- 🚛 Filtro de servicios de grúa
- 📏 Radio ajustable (1-20 km)
- 📞 Botón de llamada directa
- 💬 Botón de WhatsApp con mensaje prellenado
- 🌙 Modo oscuro automático
- 📱 PWA instalable
- ⚡ Caché de resultados (10 minutos)
- 📐 Diseño mobile-first optimizado para uso con una mano

## APIs utilizadas (gratuitas, sin API key)

- **Overpass API**: Consultas de talleres y grúas
- **Nominatim**: Geocodificación de direcciones
- **OpenStreetMap**: Tiles del mapa

## Estructura del proyecto

```
/
├── app/
│   ├── layout.tsx          # Meta tags PWA, fuente
│   ├── page.tsx            # Página principal con mapa y resultados
│   └── globals.css         # Estilos Leaflet + Tailwind
├── components/
│   ├── Map.tsx             # Mapa Leaflet (carga dinámica, sin SSR)
│   ├── PlaceCard.tsx       # Tarjeta de cada taller/grúa
│   ├── FilterTabs.tsx      # Tabs de filtro + slider de radio
│   └── LocationButton.tsx  # Botón de ubicación + búsqueda manual
├── lib/
│   ├── overpass.ts         # Consultas a Overpass API + caché
│   ├── geolocation.ts      # Helpers de geolocalización + Nominatim
│   └── distance.ts         # Cálculo de distancia Haversine
├── public/
│   ├── manifest.json       # Configuración PWA
│   └── icons/              # Iconos para PWA
└── .env.example
```

## Licencia

MIT
