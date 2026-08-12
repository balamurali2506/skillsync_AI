import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import { getDashboard, getUsers, getResumeAnalytics, getInterviewAnalytics } from '../controllers/adminController.js';

const router = Router();

router.use(verifyJWT, requireAdmin);

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.get('/resumes', getResumeAnalytics);
router.get('/interviews', getInterviewAnalytics);

export default router;