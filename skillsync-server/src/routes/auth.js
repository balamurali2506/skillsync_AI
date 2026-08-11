import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { register, registerValidation, login, loginValidation, me } from '../controllers/authController.js';

const router = Router();

router.post('/register', registerValidation, register);
router.post('/login',    loginValidation,    login);
router.get('/me',        verifyJWT,          me);

export default router;