import { Router } from 'express';
import { aiController } from '../controllers/aiController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/events/parse', aiController.parseEvent);
router.post('/events/moderate', aiController.moderateEvent);
router.get('/events/recommendations', optionalAuth as any, aiController.getRecommendations as any);

export default router;
