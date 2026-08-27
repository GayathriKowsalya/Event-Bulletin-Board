import { Router } from 'express';
import { eventController } from '../controllers/eventController';
import { requireAuth, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', eventController.getEvents);
router.post('/', requireAuth as any, eventController.createEvent as any);
router.get('/search', eventController.searchEvents);
router.get('/nearby', eventController.getNearbyEvents);
router.get('/my-events', requireAuth as any, eventController.getUserMyEvents as any);
router.get('/:id', eventController.getEventById);
router.put('/:id', requireAuth as any, eventController.updateEvent as any);
router.delete('/:id', requireAuth as any, eventController.deleteEvent as any);

// User routes for registration
router.post('/:id/register', requireAuth as any, eventController.registerForEvent as any);
router.get('/:id/registration', optionalAuth as any, eventController.getRegistrationStatus as any);
router.post('/:id/rsvp', requireAuth as any, eventController.registerForEvent as any);
router.delete('/:id/rsvp', requireAuth as any, eventController.unregisterForEvent as any);

export default router;
