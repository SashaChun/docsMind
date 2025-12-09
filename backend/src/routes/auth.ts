import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', authController.validateRegister, authController.register);
router.post('/login', authController.validateLogin, authController.login);
router.get('/profile', authMiddleware, authController.getProfile);
router.post('/check-email', authController.validateCheckEmail, authController.checkEmail);

export default router;
