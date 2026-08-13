/** Iconos y tiles compartidos para mapas Leaflet (sin depender de unpkg). */

import L from "leaflet";

export const MAP_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

export const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** Marcador clásico desde /public (no CSP externo). */
export const leafletMarkerIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/** Pin de marca CeliApp (divIcon, sin imagen remota). */
export const placeDivIcon = L.divIcon({
  className: "celiapp-place-marker",
  html: `<span style="
    display:block;
    width:22px;height:22px;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    background:var(--color-accent,#c45c26);
    border:2px solid #fff;
    box-shadow:0 1px 4px rgba(0,0,0,.35);
  "></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  popupAnchor: [0, -18],
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
