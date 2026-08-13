"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PlaceListItem } from "@/lib/places-server";
import {
  PLACE_CELIAC_LABELS,
  PLACE_TYPE_LABELS,
} from "@/types/database";

const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];
const DEFAULT_ZOOM = 12;

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ places }: { places: PlaceListItem[] }) {
  const map = useMap();

  useEffect(() => {
    if (places.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }
    if (places.length === 1) {
      map.setView([places[0].lat, places[0].lng], 15);
      return;
    }
    const bounds = L.latLngBounds(
      places.map((p) => [p.lat, p.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, places]);

  return null;
}

export function PlacesMap({
  places,
  className,
}: {
  places: PlaceListItem[];
  className?: string;
}) {
  const center: [number, number] =
    places.length === 1
      ? [places[0].lat, places[0].lng]
      : DEFAULT_CENTER;

  return (
    <div className={className ?? "h-[420px] w-full overflow-hidden rounded-xl"}>
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds places={places} />
        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={markerIcon}
          >
            <Popup>
              <div className="min-w-[140px] text-sm">
                <p className="font-semibold">{place.name}</p>
                <p className="text-xs text-neutral-600">
                  {PLACE_TYPE_LABELS[place.place_type]} ·{" "}
                  {PLACE_CELIAC_LABELS[place.celiac_level]}
                </p>
                {place.city && (
                  <p className="text-xs text-neutral-500">{place.city}</p>
                )}
                <a
                  href={`/locales/${place.slug}`}
                  className="mt-1 inline-block text-xs font-medium text-emerald-700 underline"
                >
                  Ver ficha
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
