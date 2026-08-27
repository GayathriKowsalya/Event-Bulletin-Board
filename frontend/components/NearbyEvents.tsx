"use client";

import { useState, useEffect } from "react";
import { Event } from "@/lib/api";
import { EventGrid } from "./EventGrid";
import { Button } from "./ui/button";
import { MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function NearbyEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [radius, setRadius] = useState<number>(10);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  const radii = [5, 10, 25, 50];
  const router = useRouter();

  const fetchNearbyEvents = async (lat: number, lng: number, rad: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/events/nearby?latitude=${lat}&longitude=${lng}&radius=${rad}`);
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events || []);
        if (data.events?.length > 0) {
          toast.success(`Found ${data.events.length} events near you.`);
        } else {
          toast.info(`No events found within ${rad} km.`);
        }
      } else {
        toast.error("Failed to fetch nearby events.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching nearby events.");
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setLocationGranted(true);
        fetchNearbyEvents(latitude, longitude, radius);
      },
      (error) => {
        setLoading(false);
        setLocationGranted(false);
        toast.error("Location access denied. You can search by neighbourhood instead.");
      }
    );
  };

  useEffect(() => {
    if (coordinates && locationGranted) {
      fetchNearbyEvents(coordinates.lat, coordinates.lng, radius);
    }
  }, [radius]);

  return (
    <div className="mb-12 border border-[#27272a] rounded-lg p-6 bg-[#18181b]/50">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-6 h-6 text-[#e50914]" />
        <h2 className="text-2xl font-bold text-white">Events Near You</h2>
      </div>

      {locationGranted === null && (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">Find exciting events happening around your current location.</p>
          <Button 
            onClick={requestLocation}
            className="bg-[#e50914] text-white hover:bg-[#b80710]"
            disabled={loading}
          >
            {loading ? "Finding location..." : "Use My Location"}
          </Button>
        </div>
      )}

      {locationGranted === false && (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">Location access was denied.</p>
          <div className="flex gap-4 justify-center">
            <Button 
              variant="outline" 
              onClick={() => {
                const searchInput = document.getElementById("search-input");
                if (searchInput) searchInput.focus();
              }}
              className="border-[#27272a] hover:bg-[#e50914] hover:text-white"
            >
              <Search className="w-4 h-4 mr-2" /> Search by Neighbourhood
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

      {locationGranted === true && coordinates && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <p className="text-gray-300">
              Showing events within <span className="font-bold text-white">{radius} km</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {radii.map(r => (
                <Button
                  key={r}
                  size="sm"
                  variant={radius === r ? "default" : "outline"}
                  onClick={() => setRadius(r)}
                  className={radius === r ? "bg-[#e50914] hover:bg-[#b80710] text-white border-transparent" : "bg-transparent border-[#27272a] hover:bg-[#27272a] text-gray-300"}
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
          
          {loading && events.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e50914] mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading nearby events...</p>
            </div>
          ) : (
            <EventGrid events={events} />
          )}
        </div>
      )}
    </div>
  );
}
