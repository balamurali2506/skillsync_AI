import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { getDashboard } from '../controllers/dashboardController.js';

const router = Router();

router.use(verifyJWT);

// The single aggregation endpoint the premium dashboard uses
router.get('/', getDashboard);

export default router;