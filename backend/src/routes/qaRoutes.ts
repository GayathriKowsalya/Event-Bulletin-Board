import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { qaController } from '../controllers/qaController';

const router = Router();

// Get questions for an event (public/optional auth)
router.get('/events/:eventId/questions', qaController.getQuestions);

// Ask a question
router.post('/events/:eventId/questions', requireAuth as any, qaController.askQuestion as any);

// Answer a question
router.post('/events/:eventId/questions/:questionId/answers', requireAuth as any, qaController.answerQuestion as any);

// Delete a question
router.delete('/events/:eventId/questions/:questionId', requireAuth as any, qaController.deleteQuestion as any);

// Delete an answer
router.delete('/events/:eventId/questions/:questionId/answers/:answerId', requireAuth as any, qaController.deleteAnswer as any);

export default router;
