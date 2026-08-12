import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { start, answer, end, list, getReport } from '../controllers/interviewController.js';

const router = Router();
router.use(verifyJWT);

router.post('/start', start);
router.post('/:id/answer', answer);
router.post('/:id/end', end);
router.get('/', list);
router.get('/:id/report', getReport);

export default router;