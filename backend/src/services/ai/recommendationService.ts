import { eventService } from '../eventService';
import { Event } from '../../types/event';

export const recommendationService = {
  async getRecommendations(latitude?: number, longitude?: number, userId?: string, token?: string): Promise<Event[]> {
    // Basic implementation: fetch active events
    // If lat/lon provided, use getNearbyEvents and sort by distance + capacity (popularity).
    // If user provided, we could factor in their history (skipped for basic MVP to avoid complex schemas, 
    // but structure is ready).
    
    let events: Event[] = [];
    
    if (latitude && longitude) {
       // getNearbyEvents already sorts by distance. We'll fetch within 50km to have a good pool.
       events = await eventService.getNearbyEvents(latitude, longitude, 50, token);
       
       // Sort by distance (primary) and registration_count (secondary popularity)
       events.sort((a: any, b: any) => {
          if (a.distance_km < 10 && b.distance_km >= 10) return -1;
          if (a.distance_km >= 10 && b.distance_km < 10) return 1;
          
          return (b.registration_count || 0) - (a.registration_count || 0);
       });
    } else {
       // Fallback: just popular active events
       events = await eventService.getActiveEvents(undefined, 'popular', undefined, token);
    }
    
    return events.slice(0, 5); // Return top 5 recommendations
  }
};
