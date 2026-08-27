import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { profileController } from '../controllers/profileController';

const router = Router();

// All profile routes require authentication
router.use(requireAuth as any);

router.get('/', profileController.getProfile as any);
router.put('/', profileController.updateProfile as any);
router.get('/events', profileController.getProfileEvents as any);
router.get('/rsvps', profileController.getProfileRSVPs as any);

export default router;
