/** Iconos y tiles compartidos para mapas Leaflet (sin depender de unpkg). */

import L from "leaflet";

/**
 * CARTO Voyager ahora exige API key (watermark "API KEY REQUIRED").
 * Por defecto usamos tiles OSM (sin key). Opcional: NEXT_PUBLIC_CARTO_API_KEY
 * para volver a Voyager con ?key=… (gratis en carto.com/basemaps/apikey).
 */
const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim();

export const MAP_TILE_URL = cartoKey
  ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoKey)}`
  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const MAP_TILE_ATTRIBUTION = cartoKey
  ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Marcador clásico desde /public (admin pin). */
export const leafletMarkerIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function pinHtml(selected: boolean): string {
  const size = selected ? 28 : 22;
  const ring = selected
    ? "box-shadow:0 0 0 3px rgba(237,108,82,.45),0 2px 6px rgba(0,0,0,.35);"
    : "box-shadow:0 1px 4px rgba(0,0,0,.35);";
  return `<span style="
    display:block;
    width:${size}px;height:${size}px;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    background:#ed6c52;
    border:2px solid #fff;
    ${ring}
  "></span>`;
}

export const placeDivIcon = L.divIcon({
  className: "celiapp-place-marker",
  html: pinHtml(false),
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  popupAnchor: [0, -18],
});

export const placeDivIconSelected = L.divIcon({
  className: "celiapp-place-marker-selected",
  html: pinHtml(true),
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -22],
});

export const userDivIcon = L.divIcon({
  className: "celiapp-user-marker",
  html: `<span style="
    display:block;width:14px;height:14px;border-radius:9999px;
    background:#2563eb;border:2px solid #fff;
    box-shadow:0 0 0 2px rgba(37,99,235,.4);
  "></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});
