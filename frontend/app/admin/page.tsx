"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/api";

interface AdminEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  event_date: string;
  event_end_date?: string;
  location: string;
  capacity: number;
  status: "pending" | "published" | "rejected";
  rejection_reason?: string | null;
  created_at?: string;
}

type Tab = "pending" | "published" | "rejected";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [fetching, setFetching] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isAdmin = profile?.role === "admin";

  // --------------------------------------------------
  // ADMIN ACCESS
  // --------------------------------------------------
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [loading, user, isAdmin, router]);

  // --------------------------------------------------
  // LOAD EVENTS
  // --------------------------------------------------
  async function loadEvents() {
    if (!user || !isAdmin) return;

    setFetching(true);
    setError("");

    try {
      const headers = await getAuthHeaders();

      const response = await fetch(
        `${API_URL}/api/admin/events`,
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Failed to load events."
        );
      }

      const allEvents = Array.isArray(result)
        ? result
        : result.events || [];

      setEvents(allEvents);
    } catch (err) {
      console.error("Admin events error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load events."
      );
    } finally {
      setFetching(false);
    }
  }

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------
  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadEvents();
    }
  }, [loading, user, isAdmin]);

  // --------------------------------------------------
  // APPROVE / REJECT
  // --------------------------------------------------
  async function updateEventStatus(
    eventId: string,
    action: "approve" | "reject"
  ) {
    let reason = "";

    if (action === "reject") {
      reason =
        window
          .prompt("Enter the reason for rejecting this event:")
          ?.trim() || "";

      if (!reason) {
        return;
      }
    }

    setProcessingId(eventId);
    setError("");

    try {
      const headers = await getAuthHeaders();

      const response = await fetch(
        `${API_URL}/api/admin/events/${eventId}/${action}`,
        {
          method: "POST",
          headers,
          body:
            action === "reject"
              ? JSON.stringify({ reason })
              : JSON.stringify({}),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `Failed to ${
              action === "approve" ? "approve" : "reject"
            } event.`
        );
      }

      await loadEvents();
    } catch (err) {
      console.error(`Admin ${action} error:`, err);

      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${action} event.`
      );
    } finally {
      setProcessingId(null);
    }
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------
  if (loading) {
    return (
      <main className="min-h-screen bg-[#0b0b0d] px-4 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-10 text-center">
            <p className="text-gray-400">
              Loading admin dashboard...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // NOT ADMIN
  // --------------------------------------------------
  if (!user || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0b0d] text-white">
        <p className="text-gray-400">
          Redirecting...
        </p>
      </main>
    );
  }

  // --------------------------------------------------
  // FILTER EVENTS
  // --------------------------------------------------
  const pendingEvents = events.filter(
    (event) => event.status === "pending"
  );

  const publishedEvents = events.filter(
    (event) => event.status === "published"
  );

  const rejectedEvents = events.filter(
    (event) => event.status === "rejected"
  );

  const visibleEvents =
    activeTab === "pending"
      ? pendingEvents
      : activeTab === "published"
        ? publishedEvents
        : rejectedEvents;

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------
  function formatDate(dateString: string) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Invalid date";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Invalid time";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // --------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------
  return (
    <main className="min-h-screen bg-[#0b0b0d] px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e50914]">
              ADMIN PANEL
            </p>

            <h1 className="mt-2 text-3xl font-extrabold">
              Event Management
            </h1>

            <p className="mt-2 text-gray-400">
              Review and manage event submissions.
            </p>
          </div>

          <Link href="/">
            <Button
              variant="outline"
              className="border-[#27272a] bg-transparent text-white hover:bg-[#27272a]"
            >
              ← Back to Events
            </Button>
          </Link>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">

          <button
            onClick={() => setActiveTab("pending")}
            className={`rounded-xl border p-5 text-left transition ${
              activeTab === "pending"
                ? "border-yellow-500/40 bg-yellow-500/10"
                : "border-[#27272a] bg-[#18181b] hover:border-yellow-500/30"
            }`}
          >
            <p className="text-sm text-gray-400">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-400">
              {pendingEvents.length}
            </p>
          </button>

          <button
            onClick={() => setActiveTab("published")}
            className={`rounded-xl border p-5 text-left transition ${
              activeTab === "published"
                ? "border-green-500/40 bg-green-500/10"
                : "border-[#27272a] bg-[#18181b] hover:border-green-500/30"
            }`}
          >
            <p className="text-sm text-gray-400">
              Published
            </p>

            <p className="mt-2 text-3xl font-bold text-green-400">
              {publishedEvents.length}
            </p>
          </button>

          <button
            onClick={() => setActiveTab("rejected")}
            className={`rounded-xl border p-5 text-left transition ${
              activeTab === "rejected"
                ? "border-red-500/40 bg-red-500/10"
                : "border-[#27272a] bg-[#18181b] hover:border-red-500/30"
            }`}
          >
            <p className="text-sm text-gray-400">
              Rejected
            </p>

            <p className="mt-2 text-3xl font-bold text-red-400">
              {rejectedEvents.length}
            </p>
          </button>

        </div>

        {/* TAB TITLE */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {activeTab === "pending" &&
                "Pending Review"}

              {activeTab === "published" &&
                "Published Events"}

              {activeTab === "rejected" &&
                "Rejected Events"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {visibleEvents.length} event
              {visibleEvents.length !== 1 ? "s" : ""}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={loadEvents}
            className="border-[#27272a] bg-transparent text-white hover:bg-[#27272a]"
          >
            Refresh
          </Button>
        </div>

        {/* LOADING */}
        {fetching && (
          <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-10 text-center">
            <p className="text-gray-400">
              Loading events...
            </p>
          </div>
        )}

        {/* EMPTY */}
        {!fetching && visibleEvents.length === 0 && (
          <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-12 text-center">
            <p className="text-xl font-bold">
              No {activeTab} events
            </p>

            <p className="mt-2 text-gray-400">
              {activeTab === "pending"
                ? "New submissions will appear here for approval."
                : activeTab === "published"
                  ? "Approved events will appear here."
                  : "Rejected events will appear here."}
            </p>
          </div>
        )}

        {/* EVENT LIST */}
        {!fetching && visibleEvents.length > 0 && (
          <div className="space-y-5">

            {visibleEvents.map((event) => {
              const isProcessing =
                processingId === event.id;

              return (
                <article
                  key={event.id}
                  className="rounded-xl border border-[#27272a] bg-[#18181b] p-6 shadow-lg"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

                    {/* EVENT INFO */}
                    <div className="flex-1">

                      {/* STATUS */}
                      <div className="mb-3 flex flex-wrap items-center gap-3">

                        {event.status === "pending" && (
                          <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-yellow-400">
                            Pending Review
                          </span>
                        )}

                        {event.status === "published" && (
                          <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-400">
                            Published
                          </span>
                        )}

                        {event.status === "rejected" && (
                          <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400">
                            Rejected
                          </span>
                        )}

                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          {event.category}
                        </span>

                      </div>

                      {/* TITLE */}
                      <h2 className="text-2xl font-extrabold text-white">
                        {event.title}
                      </h2>

                      {/* DESCRIPTION */}
                      <p className="mt-3 max-w-3xl leading-7 text-gray-400">
                        {event.description}
                      </p>

                      {/* DETAILS */}
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">

                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">
                            Date
                          </p>

                          <p className="mt-1 font-semibold text-gray-200">
                            {formatDate(event.event_date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">
                            Time
                          </p>

                          <p className="mt-1 font-semibold text-gray-200">
                            {formatTime(event.event_date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">
                            Location
                          </p>

                          <p className="mt-1 font-semibold text-gray-200">
                            {event.location}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">
                            Capacity
                          </p>

                          <p className="mt-1 font-semibold text-gray-200">
                            {event.capacity}
                          </p>
                        </div>

                      </div>

                      {/* REJECTION REASON */}
                      {event.status === "rejected" &&
                        event.rejection_reason && (
                          <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-red-400">
                              Rejection Reason
                            </p>

                            <p className="mt-2 text-sm leading-6 text-gray-300">
                              {event.rejection_reason}
                            </p>
                          </div>
                        )}

                    </div>

                    {/* ACTIONS */}
                    {event.status === "pending" && (
                      <div className="flex shrink-0 flex-col gap-3 lg:w-40">

                        <Button
                          disabled={isProcessing}
                          onClick={() =>
                            updateEventStatus(
                              event.id,
                              "approve"
                            )
                          }
                          className="w-full bg-[#e50914] font-bold text-white hover:bg-[#b80710]"
                        >
                          {isProcessing
                            ? "Processing..."
                            : "✓ Approve"}
                        </Button>

                        <Button
                          disabled={isProcessing}
                          variant="outline"
                          onClick={() =>
                            updateEventStatus(
                              event.id,
                              "reject"
                            )
                          }
                          className="w-full border-red-500/30 bg-transparent font-bold text-red-400 hover:bg-red-500/10"
                        >
                          {isProcessing
                            ? "Processing..."
                            : "✕ Reject"}
                        </Button>

                      </div>
                    )}

                  </div>
                </article>
              );
            })}

          </div>
        )}

      </div>
    </main>
  );
}