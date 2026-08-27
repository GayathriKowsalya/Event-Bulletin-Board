"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Event } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { getUserMyEvents } from "@/lib/api";

export default function MyEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push("/login");
      return;
    }

    if (user) {
      fetchMyEvents();
    }
  }, [user, router]);

  const fetchMyEvents = async () => {
    try {
      const data = await getUserMyEvents();
      setEvents(data || []);
    } catch (error) {
      toast.error("Failed to load your events");
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e50914]"></div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-md text-xs font-semibold">🟠 Pending Review</span>;
      case 'published': return <span className="px-2 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-md text-xs font-semibold">🟢 Published</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md text-xs font-semibold">🔴 Rejected</span>;
      case 'expired': return <span className="px-2 py-1 bg-gray-500/10 text-gray-500 border border-gray-500/20 rounded-md text-xs font-semibold">⚫ Expired</span>;
      default: return <span className="px-2 py-1 bg-gray-500/10 text-gray-500 border border-gray-500/20 rounded-md text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-12 flex-grow">
        <h1 className="text-3xl font-bold mb-8">My Submitted Events</h1>
        
        {events.length === 0 ? (
          <div className="text-center py-16 bg-[#18181b] rounded-lg border border-[#27272a]">
            <p className="text-gray-400 mb-4">You haven't submitted any events yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {events.map((event) => {
              const eventDate = new Date(event.event_date);
              return (
                <Card key={event.id} className="bg-[#18181b] border-[#27272a] text-white">
                  <CardHeader className="pb-3 flex flex-row justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold">{event.title}</CardTitle>
                      <p className="text-sm text-gray-400 mt-1 uppercase tracking-wider">{event.category}</p>
                    </div>
                    {getStatusBadge(event.status)}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{eventDate.toLocaleDateString()} {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    
                    {event.status === 'rejected' && event.rejection_reason && (
                      <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-md flex gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-red-500">Rejection Reason:</p>
                          <p className="text-sm text-red-400">{event.rejection_reason}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
