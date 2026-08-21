import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { updateAIPreferences, getAIPreferences, testAIKey } from '../controllers/settingsController.js';

const router = Router();
router.use(verifyJWT);

router.get('/ai', getAIPreferences);
router.patch('/ai', updateAIPreferences);
router.post('/ai/test', testAIKey);

export default router;