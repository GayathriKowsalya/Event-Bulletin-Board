"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { Event } from "@/lib/api";
import { useRouter } from "next/navigation";

const eventIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:34px;
      height:34px;
      background:#e50914;
      border:3px solid white;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 3px 10px rgba(0,0,0,0.4);
      display:flex;
      align-items:center;
      justify-content:center;
    ">
      <div style="
        width:10px;
        height:10px;
        background:white;
        border-radius:50%;
      "></div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

const userIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:42px;
      height:42px;
      background:#f97316;
      border:4px solid white;
      border-radius:50%;
      box-shadow:
        0 0 0 3px rgba(249,115,22,0.35),
        0 4px 12px rgba(0,0,0,0.4);
      display:flex;
      align-items:center;
      justify-content:center;
    ">
      <div style="
        width:14px;
        height:14px;
        background:white;
        border-radius:50%;
      "></div>
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -25],
});

interface NearbyEventsMapProps {
  events: Event[];
  userLat: number;
  userLng: number;
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLng =
    ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      (lat1 * Math.PI) / 180
    ) *
      Math.cos(
        (lat2 * Math.PI) / 180
      ) *
      Math.sin(dLng / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}

export default function NearbyEventsMap({
  events,
  userLat,
  userLng,
}: NearbyEventsMapProps) {
  const [mounted, setMounted] =
    useState(false);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const eventsWithDistance = useMemo(() => {
    return events
      .filter((event) => {
        const lat = Number(event.latitude);
        const lng = Number(event.longitude);

        return (
          Number.isFinite(lat) &&
          Number.isFinite(lng)
        );
      })
      .map((event) => {
        const eventLat = Number(
          event.latitude
        );

        const eventLng = Number(
          event.longitude
        );

        const calculatedDistance =
          calculateDistance(
            userLat,
            userLng,
            eventLat,
            eventLng
          );

        const apiDistance =
          event.distance_km !== null &&
          event.distance_km !== undefined
            ? Number(event.distance_km)
            : calculatedDistance;

        return {
          event,
          distance:
            Number.isFinite(apiDistance)
              ? apiDistance
              : calculatedDistance,
        };
      });
  }, [
    events,
    userLat,
    userLng,
  ]);

  let centerLat = userLat;
  let centerLng = userLng;
  let zoom = 13;

  if (eventsWithDistance.length > 0) {
    const allLats = [
      userLat,
      ...eventsWithDistance.map(
        ({ event }) =>
          Number(event.latitude)
      ),
    ];

    const allLngs = [
      userLng,
      ...eventsWithDistance.map(
        ({ event }) =>
          Number(event.longitude)
      ),
    ];

    centerLat =
      allLats.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / allLats.length;

    centerLng =
      allLngs.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / allLngs.length;

    const latDiff =
      Math.max(...allLats) -
      Math.min(...allLats);

    const lngDiff =
      Math.max(...allLngs) -
      Math.min(...allLngs);

    const maxDiff = Math.max(
      latDiff,
      lngDiff
    );

    if (maxDiff > 0.5) {
      zoom = 11;
    } else if (maxDiff > 0.2) {
      zoom = 12;
    } else {
      zoom = 13;
    }
  }

  if (!mounted) {
    return (
      <div
        className="
          w-[80%]
          mx-auto
          bg-[#27272a]
          rounded-xl
          animate-pulse
          border border-[#27272a]
          mb-6
        "
        style={{
          height: "320px",
        }}
      />
    );
  }

  return (
    <div
      className="
        w-[80%]
        mx-auto
        rounded-xl
        overflow-hidden
        border border-[#27272a]
        shadow-xl
        relative
        z-0
        mb-6
      "
      style={{
        height: "320px",
      }}
    >
      <MapContainer
        center={[
          centerLat,
          centerLng,
        ]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{
          height: "100%",
          width: "100%",
          zIndex: 0,
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* USER LOCATION */}
        <Marker
          position={[
            userLat,
            userLng,
          ]}
          icon={userIcon}
        >
          <Tooltip
            permanent
            direction="top"
            offset={[0, -18]}
          >
            <span
              style={{
                fontWeight: 700,
                color: "#f97316",
              }}
            >
              You are here
            </span>
          </Tooltip>

          <Popup>
            <div
              style={{
                minWidth: "150px",
                color: "#111827",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "15px",
                  marginBottom: "5px",
                }}
              >
                Your Location
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                }}
              >
                {userLat.toFixed(4)},{" "}
                {userLng.toFixed(4)}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* EVENTS */}
        {eventsWithDistance.map(
          ({ event, distance }) => {
            const eventLat = Number(
              event.latitude
            );

            const eventLng = Number(
              event.longitude
            );

            const middleLat =
              (userLat + eventLat) / 2;

            const middleLng =
              (userLng + eventLng) / 2;

            return (
              <React.Fragment
                key={event.id}
              >
                {/* DISTANCE LINE */}
                <Polyline
                  positions={[
                    [
                      userLat,
                      userLng,
                    ],
                    [
                      eventLat,
                      eventLng,
                    ],
                  ]}
                  pathOptions={{
                    color: "#f97316",
                    weight: 2,
                    opacity: 0.8,
                    dashArray: "6 6",
                  }}
                />

                {/* DISTANCE LABEL */}
                <Marker
                  position={[
                    middleLat,
                    middleLng,
                  ]}
                  icon={L.divIcon({
                    className: "",
                    html: `
                      <div style="
                        background:rgba(255,255,255,0.95);
                        color:#f97316;
                        font-size:11px;
                        font-weight:700;
                        padding:3px 6px;
                        border-radius:5px;
                        white-space:nowrap;
                        box-shadow:0 1px 5px rgba(0,0,0,0.25);
                        border:1px solid rgba(249,115,22,0.25);
                      ">
                        ${distance.toFixed(
                          1
                        )} km
                      </div>
                    `,
                    iconSize: [0, 0],
                    iconAnchor: [0, 0],
                  })}
                  interactive={false}
                />

                {/* EVENT MARKER */}
                <Marker
                  position={[
                    eventLat,
                    eventLng,
                  ]}
                  icon={eventIcon}
                >
                  <Popup>
                    <div
                      style={{
                        width: "250px",
                        color: "#111827",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "16px",
                          marginBottom: "5px",
                        }}
                      >
                        {event.title}
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "7px",
                        }}
                      >
                        📍 {event.location}
                      </div>

                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#f97316",
                          marginBottom: "10px",
                        }}
                      >
                        {distance.toFixed(
                          1
                        )} km away
                      </div>

                      <button
                        onClick={() =>
                          router.push(
                            `/events/${event.id}`
                          )
                        }
                        style={{
                          width: "100%",
                          padding:
                            "8px 12px",
                          border: "none",
                          borderRadius:
                            "7px",
                          background:
                            "#e50914",
                          color:
                            "#ffffff",
                          fontWeight: 600,
                          cursor:
                            "pointer",
                        }}
                      >
                        View Event
                      </button>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          }
        )}
      </MapContainer>

      {/* LEGEND */}
      <div
        style={{
          position: "absolute",
          top: "80px",
          left: "10px",
          zIndex: 1000,
          background:
            "rgba(255,255,255,0.95)",
          borderRadius: "8px",
          padding: "6px 9px",
          fontSize: "10px",
          color: "#111827",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            marginBottom: "3px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#f97316",
              display: "inline-block",
            }}
          />

          Your location
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#e50914",
              display: "inline-block",
            }}
          />

          Event
        </div>
      </div>
    </div>
  );
}