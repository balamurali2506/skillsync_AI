import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { chat, history } from '../controllers/chatController.js';

const router = Router();
router.use(verifyJWT);

router.post('/', chat);
router.get('/history', history);

export default router;