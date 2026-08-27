import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

export const profileController = {
  async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Map headline/bio to location for frontend consistency
      const mappedProfile = {
        ...profile,
        location: profile.location || profile.bio || null,
        avatar: profile.avatar_url || null,
        name: profile.full_name || null,
      };

      res.status(200).json({ profile: mappedProfile });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  },

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { name, location, avatar } = req.body;

      const updates: any = {};
      if (name !== undefined) {
        updates.full_name = name;
      }
      if (location !== undefined) {
        updates.location = location;
      }
      if (avatar !== undefined) {
        updates.avatar_url = avatar;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select('*')
        .single();

      if (error) throw error;

      const mappedProfile = {
        ...profile,
        location: profile.location || profile.bio || null,
        avatar: profile.avatar_url || null,
        name: profile.full_name || null,
      };

      res.status(200).json({ profile: mappedProfile });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },

  async getProfileEvents(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { data: events, error } = await supabase
        .from('events')
        .select(`
          *,
          profile:profiles!events_created_by_fkey(id, full_name, avatar_url)
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json({ events });
    } catch (error: any) {
      console.error('Error fetching profile events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  },

  async getProfileRSVPs(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      // First get the registrations
      const { data: registrations, error: regError } = await supabase
        .from('event_rsvps')
        .select('event_id')
        .eq('user_id', user.id);

      if (regError) throw regError;

      const eventIds = registrations.map(r => r.event_id);
      
      if (eventIds.length === 0) {
        return res.status(200).json({ events: [] });
      }

      // Then get the full events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .order('event_date', { ascending: true });

      if (eventsError) throw eventsError;

      res.status(200).json({ events });
    } catch (error: any) {
      console.error('Error fetching profile RSVPs:', error);
      res.status(500).json({ error: 'Failed to fetch RSVPs' });
    }
  }
};
