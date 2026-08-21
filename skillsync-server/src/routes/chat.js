import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { sendMessage, getHistory, clearHistory } from '../controllers/chatController.js';

const router = Router();
router.use(verifyJWT);

router.post('/', sendMessage);
router.get('/history', getHistory);
router.delete('/history', clearHistory);

export default router;