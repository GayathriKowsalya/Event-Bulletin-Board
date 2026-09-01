"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Event, API_URL } from "@/lib/api";
import { EventGrid } from "./EventGrid";
import { Button } from "./ui/button";
import { MapPin, Search } from "lucide-react";
import { toast } from "sonner";

function MapLoadingPlaceholder() {
  return (
    <div className="w-full h-96 bg-[#27272a] rounded-xl overflow-hidden border border-[#27272a] shadow-xl z-0 relative mb-6 animate-pulse flex items-center justify-center">
      <div className="text-gray-500 text-sm">
        Loading map...
      </div>
    </div>
  );
}

const NearbyEventsMap = dynamic(
  () => import("./NearbyEventsMap"),
  {
    ssr: false,
    loading: () => <MapLoadingPlaceholder />,
  }
);

export function NearbyEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationGranted, setLocationGranted] =
    useState<boolean | null>(null);

  // Start with a wider radius so nearby cities/areas
  // such as Coimbatore and RS Puram can be included.
  const [radius, setRadius] = useState<number>(50);

  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const radii = [5, 10, 25, 50];

  const fetchNearbyEvents = useCallback(
    async (
      lat: number,
      lng: number,
      rad: number
    ) => {
      setLoading(true);

      try {
        const url =
          `${API_URL}/api/events/nearby` +
          `?latitude=${lat}` +
          `&longitude=${lng}` +
          `&radius=${rad}`;

        console.log(
          "[NearbyEvents] Fetching:",
          url
        );

        const res = await fetch(url, {
          cache: "no-store",
        });

        const data = await res.json();

        console.log(
          "[NearbyEvents] Status:",
          res.status
        );

        console.log(
          "[NearbyEvents] Response:",
          data
        );

        if (!res.ok) {
          setEvents([]);

          toast.error(
            `Failed to fetch nearby events (${res.status}).`
          );

          return;
        }

        const eventsArray =
          Array.isArray(data.events)
            ? data.events
            : [];

        console.log(
          `[NearbyEvents] Found ${eventsArray.length} events`
        );

        setEvents(eventsArray);

        if (eventsArray.length > 0) {
          toast.success(
            `Found ${eventsArray.length} events near you.`
          );
        } else {
          toast.info(
            `No events found within ${rad} km.`
          );
        }
      } catch (error) {
        console.error(
          "[NearbyEvents] Fetch error:",
          error
        );

        setEvents([]);

        toast.error(
          "An error occurred while fetching nearby events."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error(
        "Geolocation is not supported by your browser."
      );
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {
          latitude,
          longitude,
        } = position.coords;

        console.log(
          `[NearbyEvents] Location: ${latitude}, ${longitude}`
        );

        setCoordinates({
          lat: latitude,
          lng: longitude,
        });

        setLocationGranted(true);

        // Fetch immediately.
        // This avoids waiting for the useEffect.
        fetchNearbyEvents(
          latitude,
          longitude,
          radius
        );
      },
      (error) => {
        console.error(
          "[NearbyEvents] Geolocation error:",
          error.code,
          error.message
        );

        setLoading(false);
        setLocationGranted(false);

        toast.error(
          "Location access denied. You can search by neighbourhood instead."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [fetchNearbyEvents, radius]);

  // Fetch again only when the radius changes
  // after we already have the user's location.
  useEffect(() => {
    if (!coordinates || !locationGranted) {
      return;
    }

    fetchNearbyEvents(
      coordinates.lat,
      coordinates.lng,
      radius
    );
  }, [
    radius,
    coordinates,
    locationGranted,
    fetchNearbyEvents,
  ]);

  return (
    <div className="mb-12 border border-[#27272a] rounded-lg p-6 bg-[#18181b]/50">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-6 h-6 text-[#e50914]" />

        <h2 className="text-2xl font-bold text-white">
          Events Near You
        </h2>
      </div>

      {/* LOCATION NOT REQUESTED */}
      {locationGranted === null && (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">
            Find exciting events happening around your
            current location.
          </p>

          <Button
            onClick={requestLocation}
            className="bg-[#e50914] text-white hover:bg-[#b80710]"
            disabled={loading}
          >
            {loading
              ? "Finding location..."
              : "Use My Location"}
          </Button>
        </div>
      )}

      {/* LOCATION DENIED */}
      {locationGranted === false && (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">
            Location access was denied.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              variant="outline"
              onClick={() => {
                const searchInput =
                  document.getElementById(
                    "search-input"
                  );

                if (searchInput) {
                  searchInput.focus();
                }
              }}
              className="border-[#27272a] hover:bg-[#e50914] hover:text-white"
            >
              <Search className="w-4 h-4 mr-2" />
              Search by Neighbourhood
            </Button>

            <Button
              variant="secondary"
              onClick={requestLocation}
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* LOCATION AVAILABLE */}
      {locationGranted === true &&
        coordinates && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <p className="text-gray-300">
                Showing events within{" "}
                <span className="font-bold text-white">
                  {radius} km
                </span>
              </p>

              <div className="flex flex-wrap gap-2">
                {radii.map((r) => (
                  <Button
                    key={r}
                    size="sm"
                    variant={
                      radius === r
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setRadius(r)
                    }
                    className={
                      radius === r
                        ? "bg-[#e50914] hover:bg-[#b80710] text-white border-transparent"
                        : "bg-transparent border-[#27272a] hover:bg-[#27272a] text-gray-300"
                    }
                    disabled={loading}
                  >
                    {r} km
                  </Button>
                ))}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={requestLocation}
                  className="text-gray-400 hover:text-white"
                  disabled={loading}
                >
                  Refresh Location
                </Button>
              </div>
            </div>

            {/* MAP */}
            <NearbyEventsMap
              events={events}
              userLat={coordinates.lat}
              userLng={coordinates.lng}
            />

            {/* LOADING */}
            {loading && events.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e50914] mx-auto" />

                <p className="mt-4 text-gray-400">
                  Loading nearby events...
                </p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />

                <p className="text-gray-400 text-lg">
                  No events found matching your
                  location.
                </p>

                <p className="text-gray-500 text-sm mt-2">
                  Try increasing the search radius
                  or adding events with a valid
                  location.
                </p>
              </div>
            ) : (
              <EventGrid events={events} />
            )}
          </div>
        )}
    </div>
  );
}