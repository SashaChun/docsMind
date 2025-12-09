import { Router } from 'express';
import { shareController } from '../controllers/shareController.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post(
  '/document/:id',
  authMiddleware,
  shareController.validateCreateDocumentShare,
  shareController.createDocumentShare
);

router.get('/received', authMiddleware, shareController.getReceived);
router.get('/:token', optionalAuth, shareController.getByToken);

export default router;
