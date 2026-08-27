import { Router, Request, Response } from 'express';
import { expirePastEvents } from '../jobs/expirationJob';

const router = Router();

router.post('/expire-events', async (req: Request, res: Response) => {
  try {
    const expiredCount = await expirePastEvents();
    res.status(200).json({ success: true, expiredCount });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to expire events' });
  }
});

export default router;
