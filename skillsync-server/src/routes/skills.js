import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { getSkillGap, analyzeWithJob } from '../controllers/skillGapController.js';

const router = Router();
router.use(verifyJWT);

router.get('/gap', getSkillGap);
router.post('/job-match', analyzeWithJob);

export default router;