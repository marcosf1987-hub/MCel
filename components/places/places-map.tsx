"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
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

const userIcon = L.divIcon({
  className: "places-user-marker",
  html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#2563eb;border:2px solid #fff;box-shadow:0 0 0 2px #2563eb66"></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function FitBounds({
  places,
  userLocation,
}: {
  places: PlaceListItem[];
  userLocation: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      if (places.length === 0) {
        map.setView([userLocation.lat, userLocation.lng], 13);
        return;
      }
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        ...places.map((p) => [p.lat, p.lng] as [number, number]),
      ]);
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
      return;
    }

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
  }, [map, places, userLocation]);

  return null;
}

export function PlacesMap({
  places,
  className,
  userLocation = null,
}: {
  places: PlaceListItem[];
  className?: string;
  userLocation?: { lat: number; lng: number } | null;
}) {
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : places.length === 1
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
        <FitBounds places={places} userLocation={userLocation} />
        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userIcon}
            >
              <Popup>Estás acá</Popup>
            </Marker>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={80}
              pathOptions={{
                color: "#2563eb",
                fillColor: "#2563eb",
                fillOpacity: 0.12,
                weight: 1,
              }}
            />
          </>
        )}
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
                  {"review_count" in place &&
                    place.review_count > 0 &&
                    place.weighted_rating != null &&
                    ` · ${place.weighted_rating.toFixed(1)}★`}
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
