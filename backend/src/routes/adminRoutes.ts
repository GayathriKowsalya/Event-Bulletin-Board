import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Secure all admin routes
router.use(requireAdmin as any);

router.get('/dashboard', adminController.getDashboardStats as any);
router.get('/events', adminController.getEvents as any);
router.get('/users', adminController.getUsers as any);
router.get('/registrations', adminController.getRegistrations as any);

// Admin event management
router.get('/events/pending', adminController.getPendingEvents as any);
router.post('/events/:id/approve', adminController.approveEvent as any);
router.post('/events/:id/reject', adminController.rejectEvent as any);
router.post('/events', adminController.createEvent as any);
router.put('/events/:id', adminController.updateEvent as any);
router.delete('/events/:id', adminController.deleteEvent as any);
router.get('/events/:id/registrations', adminController.getEventRegistrations as any);

export default router;
