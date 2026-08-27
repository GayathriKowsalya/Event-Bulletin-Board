import { Request, Response } from 'express';
import { eventService } from '../services/eventService';
import { CreateEventInput, UpdateEventInput } from '../types/event';
import { AuthRequest } from '../middleware/auth';

export const eventController = {
  async getEvents(req: Request, res: Response) {
    try {
      const category = req.query.category as string;
      const sortBy = req.query.sortBy as string;
      const filter = req.query.filter as string;
      const events = await eventService.getActiveEvents(category, sortBy, filter);
      res.status(200).json({ events });
    } catch (error: any) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  },



  async getEventById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const event = await eventService.getEventById(id);
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      res.status(200).json({ event });
    } catch (error: any) {
      console.error('Error fetching event by id:', error);
      res.status(500).json({ error: 'Failed to fetch event' });
    }
  },

  async searchEvents(req: Request, res: Response) {
    try {
      const q = req.query.q as string;
      const sortBy = req.query.sortBy as string;
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      const events = await eventService.searchEvents(q, sortBy);
      res.status(200).json({ events });
    } catch (error: any) {
      console.error('Error searching events:', error);
      res.status(500).json({ error: 'Failed to search events' });
    }
  },

  async getNearbyEvents(req: Request, res: Response) {
    try {
      const lat = parseFloat((req.query.latitude || req.query.lat) as string);
      const lon = parseFloat((req.query.longitude || req.query.lng) as string);
      const radius = parseFloat(req.query.radius as string) || 10;

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'Valid latitude and longitude are required' });
      }

      const events = await eventService.getNearbyEvents(lat, lon, radius);
      res.status(200).json({ events });
    } catch (error: any) {
      console.error('Error fetching nearby events:', error);
      res.status(500).json({ error: 'Failed to fetch nearby events' });
    }
  },

  async getUserMyEvents(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const events = await eventService.getUserEvents(user.id, user.token);
      res.status(200).json({ events });
    } catch (error: any) {
      console.error('Error fetching user events:', error);
      res.status(500).json({ error: 'Failed to fetch user events' });
    }
  },

  async createEvent(req: AuthRequest, res: Response) {
    try {
      const input: CreateEventInput = req.body;
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Basic validation
      if (!input.title?.trim() || !input.description?.trim() || !input.category?.trim() || !input.event_date || !input.event_end_date || !input.location?.trim() || input.capacity === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const startDate = new Date(input.event_date);
      const endDate = new Date(input.event_end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid event date' });
      }
      
      if (endDate <= startDate) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }
      
      if (input.capacity <= 0) {
        return res.status(400).json({ error: 'Capacity must be positive' });
      }

      const eventPayload = { ...input, created_by: user.id };
      const newEvent = await eventService.createEvent(eventPayload, user.token);
      res.status(201).json({ event: newEvent });
    } catch (error: any) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  },

  async updateEvent(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const input: UpdateEventInput = req.body;
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Check ownership (or let RLS handle it, but throwing 403 explicitly is better if not found)
      const existingEvent = await eventService.getEventById(id);
      if (!existingEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }
      if (existingEvent.created_by && existingEvent.created_by !== user.id) {
        return res.status(403).json({ error: 'Forbidden: You do not own this event' });
      }
      
      if (input.event_date && input.event_end_date) {
        const startDate = new Date(input.event_date);
        const endDate = new Date(input.event_end_date);
        if (endDate <= startDate) {
          return res.status(400).json({ error: 'End date must be after start date' });
        }
      }
      
      const updatedEvent = await eventService.updateEvent(id, input, user.token);
      if (!updatedEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      res.status(200).json({ event: updatedEvent });
    } catch (error: any) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: 'Failed to update event' });
    }
  },

  async deleteEvent(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const existingEvent = await eventService.getEventById(id);
      if (!existingEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }
      if (existingEvent.created_by && existingEvent.created_by !== user.id) {
        return res.status(403).json({ error: 'Forbidden: You do not own this event' });
      }

      await eventService.deleteEvent(id, user.token);
      res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: 'Failed to delete event' });
    }
  },
  
  async registerForEvent(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const user = req.user;
      
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      
      const event = await eventService.getEventById(id);
      if (!event || event.status !== 'active') {
        return res.status(404).json({ error: 'Event not found or not active' });
      }
      
      if (new Date(event.event_date) <= new Date()) {
         return res.status(400).json({ error: 'Registration closed - event is currently ongoing or has ended' });
      }

      const registration = await eventService.registerForEvent(id, user.id, user.token);
      
      // Get updated count
      const updatedEvent = await eventService.getEventById(id);
      
      res.status(200).json({ 
        message: 'Registration successful', 
        registration,
        attending: true,
        rsvp_count: updatedEvent?.registration_count || (event.registration_count || 0) + 1
      });
    } catch (error: any) {
      console.error('Error registering for event:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'You are already registered for this event.' });
      }
      res.status(error.status || 500).json({ error: error.message || 'Failed to register' });
    }
  },
  
  async getRegistrationStatus(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const user = req.user;
      
      if (!user) {
        return res.status(200).json({ registered: false });
      }
      
      const registration = await eventService.getRegistrationStatus(id, user.id, user.token);
      res.status(200).json({ registered: !!registration, registration });
    } catch (error: any) {
      console.error('Error getting registration status:', error);
      res.status(500).json({ error: 'Failed to get registration status' });
    }
  },
  
  async getEventRegistrations(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const event = await eventService.getEventById(id);
      if (!event || event.created_by !== user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const registrations = await eventService.getEventRegistrations(id, user.token);
      res.status(200).json({ registrations });
    } catch (error: any) {
      console.error('Error getting event registrations:', error);
      res.status(500).json({ error: 'Failed to fetch registrations' });
    }
  },
  async unregisterForEvent(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const user = req.user;

      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const event = await eventService.getEventById(id);
      if (!event) return res.status(404).json({ error: 'Event not found' });

      // check if registration exists
      const registration = await eventService.getRegistrationStatus(id, user.id, user.token);
      if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      await eventService.unregisterForEvent(id, user.id, user.token);
      
      const updatedEvent = await eventService.getEventById(id);

      res.status(200).json({ 
        message: 'Unregistered successfully',
        attending: false,
        rsvp_count: updatedEvent?.registration_count || Math.max(0, (event.registration_count || 0) - 1)
      });
    } catch (error: any) {
      console.error('Error unregistering from event:', error);
      res.status(500).json({ error: 'Failed to unregister' });
    }
  }
};
