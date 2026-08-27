"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEventById, Event, checkRegistrationStatus, registerForEvent, deleteEvent, rsvpForEvent, unregisterForEvent } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EditEventForm } from "@/components/EditEventForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, Share2, Users, Check } from "lucide-react";
import { EventQA } from "@/components/EventQA";
import { LiveCountdown } from "@/components/LiveCountdown";
import { ExpectedCrowd } from "@/components/ExpectedCrowd";
import dynamic from "next/dynamic";

const EventMap = dynamic(() => import("@/components/EventMap"), { ssr: false });
export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, profile } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [isRegistered, setIsRegistered] = useState(false);
  const [goingLoading, setGoingLoading] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id, user]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const data = await getEventById(id);
      setEvent(data);
      
      if (user) {
        const { registered } = await checkRegistrationStatus(id);
        setIsRegistered(registered);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load event");
    } finally {
      setLoading(false);
    }
  };



  const handleGoingToggle = async () => {
    if (!user || !event) {
      router.push('/login');
      return;
    }

    setGoingLoading(true);

    const prevCount = event.registration_count || 0;
    const prevRegistered = isRegistered;

    // optimistic update
    if (!prevRegistered) {
      setEvent({ ...event, registration_count: prevCount + 1 });
      setIsRegistered(true);
      try {
        const result = await rsvpForEvent(event.id);
        // Sync with truth
        setEvent(prev => prev ? { ...prev, registration_count: result.rsvp_count } : prev);
        setIsRegistered(result.attending);
        toast.success("Marked as going");
      } catch (err: any) {
        // revert
        setEvent({ ...event, registration_count: prevCount });
        setIsRegistered(prevRegistered);
        toast.error(err.message || 'Failed to RSVP');
      } finally {
        setGoingLoading(false);
      }
    } else {
      setEvent({ ...event, registration_count: Math.max(0, prevCount - 1) });
      setIsRegistered(false);
      try {
        const result = await unregisterForEvent(event.id);
        // Sync with truth
        setEvent(prev => prev ? { ...prev, registration_count: result.rsvp_count } : prev);
        setIsRegistered(result.attending);
        toast.success("Removed from going list");
      } catch (err: any) {
        // revert
        setEvent({ ...event, registration_count: prevCount });
        setIsRegistered(prevRegistered);
        toast.error(err.message || 'Failed to remove going');
      } finally {
        setGoingLoading(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    try {
      await deleteEvent(event.id);
      toast.success("Event deleted successfully.");
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete event.");
    }
  };

  const handleShare = async () => {
    if (!event) return;

    const generateCardBlob = async (): Promise<Blob | null> => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 630;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // background
        const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        g.addColorStop(0, '#0f172a');
        g.addColorStop(1, '#065f46');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 52px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
        const title = event.title;
        // simple wrap
        const maxWidth = 1080;
        const words = title.split(' ');
        let line = '';
        let y = 160;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line.trim(), 60, y);
            line = words[n] + ' ';
            y += 64;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line.trim(), 60, y);

        // date and time
        ctx.fillStyle = '#d1fae5';
        ctx.font = '28px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
        ctx.fillText(`${formattedDate} • ${formattedTime}`, 60, y + 80);

        // location
        ctx.fillStyle = '#a7f3d0';
        ctx.font = '24px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
        ctx.fillText(event.location || '', 60, y + 120);

        return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
      } catch (err) {
        console.error('Card generation error', err);
        return null;
      }
    };

    const blob = await generateCardBlob();
    const pageUrl = window.location.href;

    if (blob && (navigator as any).canShare) {
      try {
        const file = new File([blob], 'invite.png', { type: 'image/png' });
        // @ts-ignore
        if (navigator.canShare({ files: [file] })) {
          // @ts-ignore
          await navigator.share({ files: [file], title: event.title, text: `Join me at ${event.title}` });
          return;
        }
      } catch (err) {
        console.error('Share with file failed', err);
      }
    }

    // Fallback: copy link and open image in new tab for download
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      a.download = `${slug || 'event'}-invite.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      navigator.clipboard.writeText(pageUrl);
      toast.success('Invitation image downloaded and link copied to clipboard');
      return;
    }

    // last fallback: just copy link
    navigator.clipboard.writeText(pageUrl);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-400 animate-pulse">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-gray-400 mb-6">{error || "This event may have been removed or does not exist."}</p>
          <Button onClick={() => router.push("/")} className="bg-[#18181b] border border-[#27272a] hover:bg-[#27272a]">Back to Events</Button>
        </div>
      </div>
    );
  }

  const eventDateObj = new Date(event.event_date);
  const formattedDate = eventDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = eventDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const eventEndDateObj = event.event_end_date ? new Date(event.event_end_date) : new Date(eventDateObj.getTime() + 3 * 60 * 60 * 1000);
  const formattedEndDate = eventEndDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedEndTime = eventEndDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const now = Date.now();
  const startTime = eventDateObj.getTime();
  const endTime = eventEndDateObj.getTime();
  
  let statusText = "Ended";
  let badgeClasses = "text-red-500 bg-red-500/10 border-red-500/20";
  let dotClasses = "bg-red-500";
  
  if (now < startTime) {
    statusText = "Upcoming";
    badgeClasses = "text-green-500 bg-green-500/10 border-green-500/20";
    dotClasses = "bg-green-500";
  } else if (now >= startTime && now < endTime) {
    statusText = "Ongoing";
    badgeClasses = "text-orange-500 bg-orange-500/10 border-orange-500/20";
    dotClasses = "bg-orange-500";
  }
  
  const isEnded = statusText === "Ended";
  const isOngoing = statusText === "Ongoing";
  const isFull = (event.registration_count || 0) >= event.capacity;
  const registrationDisabled = isEnded || isOngoing || isFull;

  const isOwner = user?.id === event.created_by;

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/")} className="text-gray-400 hover:text-white -ml-4 hover:bg-[#18181b]">
            ← Back to Events
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-grow w-full lg:w-2/3">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                  {event.category}
                </span>
                <LiveCountdown startDate={event.event_date} endDate={event.event_end_date} />
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">{event.title}</h1>
              
              {isOwner && (
                <div className="flex gap-3 mb-8">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="bg-transparent border-[#27272a] text-white hover:bg-[#27272a]">Edit Event</Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(true)} className="bg-red-900/50 text-red-500 hover:bg-red-900/80 border border-red-900/50">Delete Event</Button>
                </div>
              )}
            </div>

            {event.image_url && (
              <div className="mb-10 rounded-xl overflow-hidden border border-[#27272a]">
                <img src={event.image_url} alt={event.title} className="w-full h-auto object-cover max-h-[500px]" />
              </div>
            )}
            
            <div className="prose prose-invert max-w-none mb-10">
              <p className="text-lg text-gray-300 whitespace-pre-wrap leading-relaxed">
                {event.description}
              </p>
            </div>
            
            {event.latitude && event.longitude ? (
              <div className="mb-10 space-y-4">
                <h3 className="text-xl font-bold tracking-tight">Location</h3>
                <EventMap 
                  latitude={event.latitude} 
                  longitude={event.longitude} 
                  title={event.title} 
                  location={event.location} 
                />
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#e50914] hover:text-[#b80710] hover:underline font-medium text-sm mt-2"
                >
                  <MapPin className="w-4 h-4" />
                  Open in Google Maps
                </a>
              </div>
            ) : (
              <div className="mb-10">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#e50914] hover:text-[#b80710] hover:underline font-medium"
                >
                  <MapPin className="w-5 h-5" />
                  View on Google Maps
                </a>
              </div>
            )}

            <div className="mb-10">
              <EventQA eventId={event.id} />
            </div>
          </div>

          <div className="w-full lg:w-1/3">
            <div className="bg-[#18181b] border border-[#27272a] p-6 rounded-xl space-y-6 sticky top-24 shadow-2xl">
              <h3 className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-4">Event Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-500 mt-1 shrink-0" />
                  <div>
                    <div className="text-white font-medium">{formattedDate}</div>
                    <div className="text-white font-medium">{formattedEndDate !== formattedDate && formattedEndDate}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-500 mt-1 shrink-0" />
                  <div className="text-white font-medium">{formattedTime} - {formattedEndTime}</div>
                </div>
              </div>
              
              <Separator className="border-[#27272a]" />
              
              <div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-1 shrink-0" />
                  <span className="text-white font-medium leading-snug">{event.location}</span>
                </div>
              </div>

              <Separator className="border-[#27272a]" />

              <div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#e50914] shrink-0" />
                  <div className="text-sm font-medium text-white">
                    <span className="text-[#e50914] text-lg font-bold">{event.registration_count || 0}</span> <span className="text-gray-400">/ {event.capacity} registered</span>
                  </div>
                </div>
              </div>

              <ExpectedCrowd rsvpCount={event.registration_count || 0} capacity={event.capacity} />

              <div className="flex flex-col gap-3 pt-4">
                {user ? (
                  <Button 
                    className={`w-full text-base font-bold py-6 flex items-center justify-center gap-2 ${
                      isRegistered 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : (registrationDisabled ? 'bg-[#27272a] text-gray-500 cursor-not-allowed' : 'bg-[#e50914] text-white hover:bg-[#b80710]')
                    }`}
                    onClick={handleGoingToggle}
                    disabled={goingLoading || (!isRegistered && registrationDisabled)}
                  >
                    {goingLoading ? "Processing..." : isRegistered ? (
                      <><Check className="w-5 h-5" /> ✓ Going</>
                    ) : (
                      isFull ? "Event Full" : (isEnded ? "Event Ended" : (isOngoing ? "Registration Closed" : "I'm Going"))
                    )}
                  </Button>
                ) : (
                  <Button className="w-full text-base font-bold py-6 bg-[#18181b] border-2 border-[#27272a] text-white hover:bg-[#27272a]" onClick={() => router.push("/login")}>
                    Login to RSVP
                  </Button>
                )}

                <Button className="w-full flex items-center justify-center gap-2 py-6 bg-transparent hover:bg-[#27272a] text-white border-2 border-[#27272a]" onClick={handleShare}>
                  <Share2 className="w-5 h-5" /> Share Event
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[425px] bg-[#18181b] text-white border-[#27272a]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <EditEventForm 
            event={event} 
            onSuccess={(updatedEvent) => {
              setEvent(updatedEvent);
              setIsEditing(false);
            }} 
            onCancel={() => setIsEditing(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="sm:max-w-[400px] bg-[#18181b] text-white border-[#27272a]">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-gray-300">
            Are you sure you want to delete this event? This action cannot be undone.
          </div>
          <div className="flex justify-end gap-2">
            <Button className="bg-[#27272a] text-white hover:bg-[#3f3f46]" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" className="bg-[#e50914] text-white hover:bg-[#b80710]" onClick={handleDelete}>Yes, Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
