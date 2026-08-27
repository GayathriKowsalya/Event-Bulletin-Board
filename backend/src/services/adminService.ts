import { supabase } from '../config/supabase';
import { CreateEventInput, UpdateEventInput, Event } from '../types/event';

export const adminService = {
  async getDashboardStats() {
    // Total users
    const { count: usersCount, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (usersError) throw usersError;

    // Total registrations
    const { count: registrationsCount, error: regError } = await supabase
      .from('event_rsvps')
      .select('*', { count: 'exact', head: true });
      
    if (regError) throw regError;

    // Events and their status breakdown
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, event_date, event_end_date');
      
    if (eventsError) throw eventsError;

    const now = new Date();
    let upcomingEvents = 0;
    let ongoingEvents = 0;
    let endedEvents = 0;

    events.forEach(event => {
      const start = new Date(event.event_date);
      const end = new Date(event.event_end_date);

      if (now < start) {
        upcomingEvents++;
      } else if (now >= start && now < end) {
        ongoingEvents++;
      } else {
        endedEvents++;
      }
    });

    return {
      totalEvents: events.length,
      upcomingEvents,
      ongoingEvents,
      endedEvents,
      totalUsers: usersCount || 0,
      totalRegistrations: registrationsCount || 0
    };
  },

  async getAllEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(event => ({
      ...event,
      registration_count: event.rsvp_count || 0
    }));
  },

  async getPendingEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*, profile:profiles!created_by(id, full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async approveEvent(id: string, adminId: string) {
    const { data, error } = await supabase
      .from('events')
      .update({
        status: 'published',
        approved_by: adminId,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async rejectEvent(id: string, adminId: string, reason: string) {
    const { data, error } = await supabase
      .from('events')
      .update({
        status: 'rejected',
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAllRegistrations() {
    const { data, error } = await supabase
      .from('event_rsvps')
      .select(`
        *,
        profile:profiles(id, full_name),
        event:events(id, title)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getEventRegistrations(eventId: string) {
    const { data, error } = await supabase
      .from('event_rsvps')
      .select(`
        *,
        profile:profiles(id, full_name)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  },

  async getEventById(id: string) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    
    return {
      ...data,
      registration_count: data.rsvp_count || 0
    };
  },

  async createEvent(input: CreateEventInput & { created_by: string }) {
    const { data, error } = await supabase
      .from('events')
      .insert([{ ...input, status: 'published' }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateEvent(id: string, input: UpdateEventInput) {
    const { data, error } = await supabase
      .from('events')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEvent(id: string) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
