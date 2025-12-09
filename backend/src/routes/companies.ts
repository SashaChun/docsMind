import { Router } from 'express';
import { companiesController } from '../controllers/companiesController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/', companiesController.validateCreate, companiesController.create);
router.get('/', companiesController.getAll);
router.get('/:id', companiesController.getById);
router.put('/:id', companiesController.validateUpdate, companiesController.update);
router.delete('/:id', companiesController.delete);

export default router;
