import { Response } from 'express';
import expressValidator from 'express-validator';
import { authService } from '../services/authService.js';
import { AuthRequest } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const { body, validationResult } = expressValidator;

export const authController = {
  validateRegister: [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').notEmpty().withMessage('Name is required'),
  ],

  validateLogin: [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],

  async register(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: errors.array(),
        });
      }

      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Register controller error:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  },

  async login(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: errors.array(),
        });
      }

      const result = await authService.login(req.body);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Login controller error:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  },

  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const user = await authService.getUserProfile(req.userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      logger.error('Get profile controller error:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  },

  validateCheckEmail: [
    body('email').isEmail().withMessage('Invalid email'),
  ],

  async checkEmail(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: errors.array(),
        });
      }

      const exists = await authService.checkEmailExists(req.body.email);

      res.status(200).json({
        success: true,
        data: { exists },
      });
    } catch (error: any) {
      logger.error('Check email controller error:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  },
};
