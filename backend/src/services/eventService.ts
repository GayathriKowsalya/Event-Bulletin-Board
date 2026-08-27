import { supabase, getAuthClient } from '../config/supabase';
import { CreateEventInput, UpdateEventInput, Event, EventRegistration } from '../types/event';

const getClient = (token?: string) => token ? getAuthClient(token) : supabase;

export const eventService = {
  async getActiveEvents(category?: string, sortBy?: string, filter?: string, token?: string): Promise<Event[]> {
    let query = getClient(token)
      .from('events')
      .select('*')
      .eq('status', 'active')
      .gte('event_end_date', new Date().toISOString());

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (filter === 'happeningSoon') {
      const now = new Date();
      const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      query = query.lte('event_date', in48Hours.toISOString()).gte('event_date', now.toISOString());
    }

    if (sortBy === 'latest') {
      query = query.order('event_date', { ascending: false });
    } else {
      // Default or soonest
      query = query.order('event_date', { ascending: true });
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return data.map((event: any) => ({
      ...event,
      registration_count: event.rsvp_count || 0
    }));
  },



  async getEventById(id: string, token?: string): Promise<Event | null> {
    const { data, error } = await getClient(token)
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (!data || data.status !== 'active') {
       if (error && error.code !== 'PGRST116') throw error;
       return null;
    }
    return data;
  },

  async searchEvents(q: string, sortBy?: string, token?: string): Promise<Event[]> {
    const { data, error } = await getClient(token)
      .from('events')
      .select('*')
      .eq('status', 'active')
      .gte('event_end_date', new Date().toISOString())
      .ilike('location', `%${q}%`)
      .order('event_date', { ascending: sortBy === 'latest' ? false : true });

    if (error) throw error;
    
    const result = data.map((event: any) => ({
      ...event,
      registration_count: event.rsvp_count || 0
    }));
    
    if (sortBy === 'popular') {
      result.sort((a: any, b: any) => b.registration_count - a.registration_count);
    }
    
    return result;
  },

  async createEvent(input: CreateEventInput & { created_by: string }, token: string): Promise<Event> {
    const { data, error } = await getClient(token)
      .from('events')
      .insert([{ ...input, status: 'active' }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateEvent(id: string, input: UpdateEventInput, token: string): Promise<Event | null> {
    const { data, error } = await getClient(token)
      .from('events')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEvent(id: string, token: string): Promise<void> {
    const { error } = await getClient(token)
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getNearbyEvents(latitude: number, longitude: number, radiusKm: number, token?: string): Promise<Event[]> {
    const { data, error } = await getClient(token)
      .from('events')
      .select('*')
      .eq('status', 'active')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .gte('event_end_date', new Date().toISOString());

    if (error) throw error;

    const events = data || [];
    
    // Haversine formula
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const nearbyEvents = events.map((event: any) => {
      const dLat = toRad(event.latitude - latitude);
      const dLon = toRad(event.longitude - longitude);
      const lat1 = toRad(latitude);
      const lat2 = toRad(event.latitude);

      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance_km = R * c;
      
      return {
        ...event,
        registration_count: event.rsvp_count || 0,
        distance_km
      };
    }).filter((event: any) => event.distance_km <= radiusKm);

    nearbyEvents.sort((a: any, b: any) => a.distance_km - b.distance_km);

    return nearbyEvents;
  },

  async getUserEvents(userId: string, token: string): Promise<Event[]> {
    const { data, error } = await getClient(token)
      .from('events')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async registerForEvent(eventId: string, userId: string, token: string): Promise<EventRegistration> {
    const client = getClient(token);
    
    // Check capacity first
    const { data: event, error: eventError } = await client
      .from('events')
      .select('capacity')
      .eq('id', eventId)
      .single();
      
    if (eventError || !event) throw new Error('Event not found');

    const { count, error: countError } = await client
      .from('event_rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (countError) throw countError;

    if (count !== null && count >= event.capacity) {
      const err = new Error('Event is at full capacity');
      (err as any).status = 400;
      throw err;
    }

    const { data, error } = await client
      .from('event_rsvps')
      .insert([{ event_id: eventId, user_id: userId }])
      .select()
      .single();
      
    if (error) {
      if (error.code === '23505') {
        const err = new Error('You have already registered for this event');
        (err as any).status = 409;
        throw err;
      }
      throw error;
    }
    return data;
  },
  
  async getRegistrationStatus(eventId: string, userId: string, token?: string): Promise<EventRegistration | null> {
    const { data, error } = await getClient(token)
      .from('event_rsvps')
      .select('*')
      .match({ event_id: eventId, user_id: userId })
      .maybeSingle();
      
    if (error) throw error;
    return data;
  },
  
  async getEventRegistrations(eventId: string, token: string): Promise<any[]> {
    const { data, error } = await getClient(token)
      .from('event_rsvps')
      .select(`
        *,
        profile:profiles(id, full_name, avatar_url)
      `)
      .eq('event_id', eventId);
      
    if (error) throw error;
    return data;
  }
  ,
  async unregisterForEvent(eventId: string, userId: string, token?: string): Promise<void> {
    const client = getClient(token);
    const { error } = await client
      .from('event_rsvps')
      .delete()
      .match({ event_id: eventId, user_id: userId });

    if (error) throw error;
  }
};
