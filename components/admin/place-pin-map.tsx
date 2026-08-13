"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  leafletMarkerIcon,
  MAP_TILE_ATTRIBUTION,
  MAP_TILE_URL,
} from "@/lib/map-leaflet";

const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 15));
  }, [map, lat, lng]);
  return null;
}

function ClickHandler({
  onChange,
}: {
  onChange: (c: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function PlacePinMap({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (c: { lat: number; lng: number }) => void;
}) {
  const hasPin = lat != null && lng != null;
  const center: [number, number] = hasPin ? [lat, lng] : DEFAULT_CENTER;

  return (
    <div className="h-[280px] w-full overflow-hidden rounded-xl border border-[var(--color-border)]">
      <MapContainer
        center={center}
        zoom={hasPin ? 15 : 12}
        className="h-full w-full z-0"
        scrollWheelZoom
      >
        <TileLayer
          attribution={MAP_TILE_ATTRIBUTION}
          url={MAP_TILE_URL}
          crossOrigin="anonymous"
        />
        <ClickHandler onChange={onChange} />
        {hasPin && (
          <>
            <Recenter lat={lat} lng={lng} />
            <Marker
              position={[lat, lng]}
              icon={leafletMarkerIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target;
                  const p = m.getLatLng();
                  onChange({ lat: p.lat, lng: p.lng });
                },
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
