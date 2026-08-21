import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { upload, analyze, list } from '../controllers/resumeController.js';

const router = Router();
router.use(verifyJWT);

// Ensure this line says '/analyze' to match your frontend!
router.post('/analyze', upload.single('resume'), analyze); 
router.get('/', list);

export default router;