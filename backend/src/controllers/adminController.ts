import { Response } from 'express';
import { adminService } from '../services/adminService';
import { CreateEventInput, UpdateEventInput } from '../types/event';
import { AuthRequest } from '../middleware/auth';

export const adminController = {
  async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      const stats = await adminService.getDashboardStats();
      res.status(200).json({ stats });
    } catch (error: any) {
      console.error('Error fetching admin dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  },

  async getEvents(req: AuthRequest, res: Response) {
    try {
      const events = await adminService.getAllEvents();
      res.status(200).json({ events });
    } catch (error: any) {
      console.error('Error fetching admin events:', error);
      res.status(500).json({ error: 'Failed to fetch admin events' });
    }
  },

  async getPendingEvents(req: AuthRequest, res: Response) {
    try {
      const events = await adminService.getPendingEvents();
      res.status(200).json({ events });
    } catch (error: any) {
      console.error('Error fetching pending events:', error);
      res.status(500).json({ error: 'Failed to fetch pending events' });
    }
  },

  async approveEvent(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const event = await adminService.approveEvent(id, user.id);
      res.status(200).json({ message: 'Event approved', event });
    } catch (error: any) {
      console.error('Error approving event:', error);
      res.status(500).json({ error: 'Failed to approve event' });
    }
  },

  async rejectEvent(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const event = await adminService.rejectEvent(id, user.id, reason || 'No reason provided');
      res.status(200).json({ message: 'Event rejected', event });
    } catch (error: any) {
      console.error('Error rejecting event:', error);
      res.status(500).json({ error: 'Failed to reject event' });
    }
  },

  async getUsers(req: AuthRequest, res: Response) {
    try {
      const users = await adminService.getAllUsers();
      res.status(200).json({ users });
    } catch (error: any) {
      console.error('Error fetching admin users:', error);
      res.status(500).json({ error: 'Failed to fetch admin users' });
    }
  },

  async getRegistrations(req: AuthRequest, res: Response) {
    try {
      const registrations = await adminService.getAllRegistrations();
      res.status(200).json({ registrations });
    } catch (error: any) {
      console.error('Error fetching admin registrations:', error);
      res.status(500).json({ error: 'Failed to fetch admin registrations' });
    }
  },

  async createEvent(req: AuthRequest, res: Response) {
    try {
      const input: CreateEventInput = req.body;
      const user = req.user;
      
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

      const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      const createdBy = isValidUUID(user!.id) ? user!.id : null;

      const eventPayload = { ...input, created_by: createdBy };
      const newEvent = await adminService.createEvent(eventPayload as any);
      res.status(201).json({ event: newEvent });
    } catch (error: any) {
      console.error('Error creating event (admin):', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  },

  async updateEvent(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const input: UpdateEventInput = req.body;
      
      const existingEvent = await adminService.getEventById(id);
      if (!existingEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      if (input.event_date && input.event_end_date) {
        const startDate = new Date(input.event_date);
        const endDate = new Date(input.event_end_date);
        if (endDate <= startDate) {
          return res.status(400).json({ error: 'End date must be after start date' });
        }
      }
      
      const updatedEvent = await adminService.updateEvent(id, input);
      res.status(200).json({ event: updatedEvent });
    } catch (error: any) {
      console.error('Error updating event (admin):', error);
      res.status(500).json({ error: 'Failed to update event' });
    }
  },

  async deleteEvent(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      
      const existingEvent = await adminService.getEventById(id);
      if (!existingEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }

      await adminService.deleteEvent(id);
      res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting event (admin):', error);
      res.status(500).json({ error: 'Failed to delete event' });
    }
  },

  async getEventRegistrations(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const registrations = await adminService.getEventRegistrations(id);
      res.status(200).json({ registrations });
    } catch (error: any) {
      console.error('Error fetching event registrations (admin):', error);
      res.status(500).json({ error: 'Failed to fetch registrations' });
    }
  }
};
