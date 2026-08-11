import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { upload, analyze, list } from '../controllers/resumeController.js';

const router = Router();

router.use(verifyJWT); // Protect all resume routes

// Note: upload.single('resume') tells multer to look for a form field named 'resume'
router.post('/analyze', upload.single('resume'), analyze);
router.get('/', list);

export default router;