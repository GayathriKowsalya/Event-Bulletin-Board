"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icon issue in Next.js
const icon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

interface EventMapProps {
  latitude: number;
  longitude: number;
  title: string;
  location: string;
}

export default function EventMap({
  latitude,
  longitude,
  title,
  location,
}: EventMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-64 bg-[#27272a] rounded-xl animate-pulse" />
    );
  }

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-[#27272a] shadow-xl z-0 relative">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        style={{
          height: "100%",
          width: "100%",
          zIndex: 0,
        }}
      >
        {/* OpenStreetMap - No API key required */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Event marker */}
        <Marker
          position={[latitude, longitude]}
          icon={icon}
        >
          <Popup>
            <div className="font-bold text-gray-900">
              {title}
            </div>

            <div className="text-sm text-gray-600">
              {location}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}