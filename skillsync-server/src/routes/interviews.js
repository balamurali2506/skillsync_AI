import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { start, respond, end, history } from '../controllers/interviewController.js';

const router = Router();

// All interview routes require authentication
router.use(verifyJWT);

// Start a new interview session (uses latest resume automatically)
router.post('/start', start);

// Submit a spoken answer and get the next AI response (Dynamic Follow-up Engine)
router.post('/:id/respond', respond);

// End interview and generate final report
router.post('/:id/end', end);

// List user's past interviews
router.get('/history', history);

export default router;