import { Event } from "@/lib/api";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const eventEndDate = event.event_end_date ? new Date(event.event_end_date) : new Date(eventDate.getTime() + 3 * 60 * 60 * 1000);
  const formattedEndDate = eventEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedEndTime = eventEndDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const now = Date.now();
  const startTime = eventDate.getTime();
  const endTime = eventEndDate.getTime();
  
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
  
  const registrationCount = event.registration_count || 0;
  const isFull = registrationCount >= event.capacity;

  return (
    <Card className="flex flex-col h-full hover:shadow-2xl transition-all duration-300 relative bg-[#18181b] text-white border-[#27272a] hover:bg-[#27272a]/50 overflow-hidden group">
      <Link href={`/events/${event.id}`} className="absolute inset-0 z-0" aria-label={`View ${event.title}`} />
      
      <div className="absolute top-0 left-0 w-full h-1 bg-[#e50914] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 z-10" />

      {event.image_url && (
        <div className="h-32 w-full relative overflow-hidden z-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] to-transparent z-10" />
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}

      <CardHeader className={`relative z-10 pointer-events-none pb-2 ${event.image_url ? 'pt-0' : ''}`}>
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
            {event.category}
          </span>
          <div className="flex flex-col items-end gap-1">
            <div className={`px-2 py-1 rounded-md border text-xs font-semibold flex items-center gap-1.5 ${badgeClasses}`}>
              <span className={`w-2 h-2 rounded-full ${dotClasses}`} />
              {statusText}
            </div>
            {event.distance_km !== undefined && (
              <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#e50914]" />
                {event.distance_km.toFixed(1)} km away
              </span>
            )}
          </div>
        </div>
        <CardTitle className="line-clamp-2 text-xl font-extrabold mb-2 text-white">{event.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow relative z-10 pointer-events-none pb-2">
        <div className="space-y-3 text-sm mt-2">
          <div className="flex items-center text-gray-300 font-medium gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>{formattedDate} {formattedDate !== formattedEndDate && `- ${formattedEndDate}`}</span>
          </div>
          <div className="flex items-center text-gray-300 font-medium gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>{formattedTime} - {formattedEndTime}</span>
          </div>
          <div className="flex items-start text-gray-400 gap-2">
            <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>
      </CardContent>
      
      <div className="px-6 py-4 relative z-10 pointer-events-none border-t border-[#27272a] mx-2 mt-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="w-4 h-4 text-[#e50914]" />
          <span>
            <span className="text-[#e50914]">{registrationCount}</span> / {event.capacity} registered
          </span>
        </div>
      </div>
      
      <CardFooter className="pt-2 pb-6 flex justify-between items-center relative z-20">
        <Link href={`/events/${event.id}`}>
          <Button variant="outline" className="bg-transparent border-[#27272a] text-white hover:bg-[#e50914] hover:text-white hover:border-[#e50914] transition-colors">
            View Event
          </Button>
        </Link>
        {statusText === 'Upcoming' && !isFull && (
          <Link href={`/events/${event.id}`}>
            <Button className="bg-[#e50914] text-white hover:bg-[#b80710] transition-colors">
              RSVP
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
