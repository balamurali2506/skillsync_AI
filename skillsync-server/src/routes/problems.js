import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { list, create, createValidation, remove } from '../controllers/problemsController.js';

const router = Router();

router.use(verifyJWT);            // every route below requires a valid JWT
router.get('/',          list);
router.post('/',         createValidation, create);
router.delete('/:id',    remove);

export default router;