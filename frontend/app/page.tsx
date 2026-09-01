"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { EventGrid } from "@/components/EventGrid";
import { NearbyEvents } from "@/components/NearbyEvents";
import { categories } from "@/lib/mockData";
import {
  getEvents,
  searchEvents,
  Event,
  API_URL,
  getAuthHeaders,
} from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { Sparkles } from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("soonest");
  const [events, setEvents] = useState<Event[]>([]);
  const [happeningSoon, setHappeningSoon] = useState<Event[]>([]);
  const [trending, setTrending] = useState<Event[]>([]);
  const [recommendations, setRecommendations] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { session } = useAuth();

  // Animated hero text
  const heroWords = [
    "Local Events",
    "Upcoming Events",
    "Amazing Events",
    "Trending Events",
  ];

  const [heroWordIndex, setHeroWordIndex] = useState(0);
  const [heroVisible, setHeroVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade/slide out
      setHeroVisible(false);

      // Change text after the exit animation
      setTimeout(() => {
        setHeroWordIndex((current) => (current + 1) % heroWords.length);
        setHeroVisible(true);
      }, 350);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (searchQuery.trim()) {
        const data = await searchEvents(searchQuery, sortBy);

        if (selectedCategory !== "All") {
          setEvents(
            data.filter(
              (event) => event.category === selectedCategory
            )
          );
        } else {
          setEvents(data);
        }
      } else {
        const data = await getEvents(
          selectedCategory,
          sortBy
        );

        setEvents(data);
      }

      if (
        !searchQuery.trim() &&
        selectedCategory === "All"
      ) {
        const [
          soonData,
          trendingData,
          recData,
        ] = await Promise.all([
          getEvents(
            "All",
            "soonest",
            "happeningSoon"
          ),

          getEvents(
            "All",
            "popular",
            "trending"
          ),

          getAuthHeaders()
            .then((headers) =>
              fetch(
                `${API_URL}/api/ai/events/recommendations`,
                { headers }
              )
            )
            .then((res) =>
              res.ok
                ? res.json()
                : { events: [] }
            ),
        ]);

        setHappeningSoon(soonData);
        setTrending(trendingData);

        if (recData?.events) {
          setRecommendations(recData.events);
        } else {
          setRecommendations([]);
        }
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to load events. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedCategory,
    sortBy,
    session,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchEvents]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans flex flex-col">

      <Header onEventCreated={fetchEvents} />

      {/* HERO SECTION */}
      <div className="bg-[#121215] border-b border-[#27272a] py-16 md:py-24 relative overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-b from-[#e50914]/10 to-transparent pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10">

          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">

            Discover{" "}

            {/* ANIMATED WORDS */}
            <span
              className={`
                inline-block
                text-[#e50914]
                transition-all
                duration-350
                ease-in-out
                ${
                  heroVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-4"
                }
              `}
            >
              {heroWords[heroWordIndex]}
            </span>

            {" "}Near You

          </h2>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Find events worth attending. Connect with your
            community, learn new skills, and experience local
            culture.
          </p>

          <div className="max-w-2xl mx-auto flex flex-col md:flex-row gap-4 items-center bg-[#18181b] p-2 rounded-2xl border border-[#27272a]">

            <div className="w-full">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>

          </div>
        </div>
      </div>

      {/* MAIN */}
      <main className="container mx-auto px-4 py-12 flex-grow">

        {/* NEARBY EVENTS */}
        <NearbyEvents />

        {/* FILTERS */}
        <div className="mb-10 space-y-6">

          <div className="flex flex-col md:flex-row justify-between items-center gap-6">

            <div className="w-full overflow-x-auto pb-2 custom-scrollbar">

              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />

            </div>

            <div className="flex-shrink-0 flex items-center gap-2">

              <span className="text-sm font-medium text-gray-400">
                Sort by:
              </span>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
                className="bg-[#18181b] border border-[#27272a] text-sm text-white rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#e50914]"
              >
                <option value="soonest">
                  Soonest
                </option>

                <option value="latest">
                  Latest
                </option>

                <option value="popular">
                  Most Registered
                </option>
              </select>

            </div>

          </div>
        </div>

        {/* LOADING */}
        {loading ? (

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

            {[1, 2, 3, 4, 5, 6, 7, 8].map(
              (n) => (
                <div
                  key={n}
                  className="h-[400px] bg-[#18181b] animate-pulse rounded-xl border border-[#27272a]"
                />
              )
            )}

          </div>

        ) : error ? (

          /* ERROR */
          <div className="py-24 text-center max-w-md mx-auto">

            <h3 className="text-2xl font-bold text-white mb-2">
              Unable to load events
            </h3>

            <p className="text-gray-400 mb-8">
              Please check your connection and try again.
            </p>

            <button
              onClick={fetchEvents}
              className="px-6 py-2 bg-[#e50914] text-white font-medium rounded-md hover:bg-[#b80710] transition-colors"
            >
              Retry
            </button>

          </div>

        ) : events.length === 0 ? (

          /* NO EVENTS */
          <div className="py-24 text-center max-w-md mx-auto">

            <div className="w-20 h-20 bg-[#18181b] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#27272a]">

              <span className="text-3xl opacity-50">
                📅
              </span>

            </div>

            <h3 className="text-2xl font-bold text-white mb-2">
              No upcoming events
            </h3>

            <p className="text-gray-400">

              {searchQuery
                ? `We couldn't find any events matching "${searchQuery}". Try adjusting your search.`
                : "There aren't any events scheduled yet."}

            </p>

          </div>

        ) : (

          /* EVENTS */
          <div className="space-y-16">

            {/* RECOMMENDED */}
            {!searchQuery &&
              selectedCategory === "All" &&
              recommendations.length > 0 && (

                <section>

                  <div className="flex items-center gap-3 mb-6">

                    <Sparkles className="w-6 h-6 text-yellow-400" />

                    <h3 className="text-2xl font-bold text-white">
                      Recommended for You
                    </h3>

                  </div>

                  <div className="border-t border-[#27272a] pt-6">

                    <EventGrid
                      events={recommendations}
                    />

                  </div>

                </section>
              )}

            {/* HAPPENING SOON */}
            {!searchQuery &&
              selectedCategory === "All" &&
              happeningSoon.length > 0 && (

                <section>

                  <div className="flex items-center gap-3 mb-6">

                    <div className="w-2 h-8 bg-green-500 rounded-full" />

                    <h3 className="text-2xl font-bold text-white">
                      Happening Soon
                    </h3>

                  </div>

                  <div className="border-t border-[#27272a] pt-6">

                    <EventGrid
                      events={happeningSoon.slice(0, 4)}
                    />

                  </div>

                </section>
              )}

            {/* TRENDING */}
            {!searchQuery &&
              selectedCategory === "All" &&
              trending.length > 0 && (

                <section>

                  <div className="flex items-center gap-3 mb-6">

                    <div className="w-2 h-8 bg-[#e50914] rounded-full" />

                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      🔥 Trending Events
                    </h3>

                  </div>

                  <div className="border-t border-[#27272a] pt-6">

                    <EventGrid
                      events={trending}
                    />

                  </div>

                </section>
              )}

            {/* UPCOMING EVENTS */}
            <section>

              <h3 className="text-2xl font-bold text-white mb-6">
                Upcoming Events
              </h3>

              <div className="border-t border-[#27272a] pt-6">

                <EventGrid events={events} />

              </div>

            </section>

          </div>
        )}

      </main>
    </div>
  );
}