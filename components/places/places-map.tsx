"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PlaceListItem } from "@/lib/places-server";
import {
  MAP_TILE_ATTRIBUTION,
  MAP_TILE_URL,
  placeDivIcon,
  placeDivIconSelected,
  userDivIcon,
} from "@/lib/map-leaflet";
import {
  PLACE_CELIAC_LABELS,
  PLACE_TYPE_LABELS,
} from "@/types/database";

const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];
const DEFAULT_ZOOM = 12;

function FitBounds({
  places,
  userLocation,
  selectedId,
}: {
  places: PlaceListItem[];
  userLocation: { lat: number; lng: number } | null;
  selectedId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    // Invalidar tamaño tras layouts responsive / tabs
    const t = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(t);
  }, [map, places.length, selectedId]);

  useEffect(() => {
    if (selectedId) {
      const selected = places.find((p) => p.id === selectedId);
      if (selected) {
        map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 15), {
          duration: 0.45,
        });
        return;
      }
    }

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
  }, [map, places, userLocation, selectedId]);

  return null;
}

export function PlacesMap({
  places,
  className,
  userLocation = null,
  selectedId = null,
  onSelect,
}: {
  places: PlaceListItem[];
  className?: string;
  userLocation?: { lat: number; lng: number } | null;
  selectedId?: string | null;
  onSelect?: (placeId: string) => void;
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
        className="h-full w-full z-0"
        scrollWheelZoom
      >
        <TileLayer
          attribution={MAP_TILE_ATTRIBUTION}
          url={MAP_TILE_URL}
          crossOrigin="anonymous"
        />
        <FitBounds
          places={places}
          userLocation={userLocation}
          selectedId={selectedId}
        />
        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userDivIcon}
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
            icon={
              selectedId === place.id ? placeDivIconSelected : placeDivIcon
            }
            eventHandlers={{
              click: () => onSelect?.(place.id),
            }}
          >
            <Popup>
              <div className="min-w-[150px] text-sm">
                <p className="font-semibold text-[var(--color-brown)]">
                  {place.name}
                </p>
                <p className="text-xs text-neutral-600">
                  {PLACE_TYPE_LABELS[place.place_type]} ·{" "}
                  {PLACE_CELIAC_LABELS[place.celiac_level]}
                  {place.review_count > 0 &&
                    place.weighted_rating != null &&
                    ` · ${place.weighted_rating.toFixed(1)}★`}
                </p>
                {place.city && (
                  <p className="text-xs text-neutral-500">{place.city}</p>
                )}
                <a
                  href={`/locales/${place.slug}`}
                  className="mt-1.5 inline-block text-xs font-medium text-[#ed6c52] underline"
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
