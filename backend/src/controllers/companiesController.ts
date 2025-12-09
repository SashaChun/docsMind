import { Response } from 'express';
import expressValidator from 'express-validator';
import { companiesService } from '../services/companiesService.js';
import { AuthRequest } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const { body, param, query, validationResult } = expressValidator;

export const companiesController = {
  validateCreate: [
    body('name').notEmpty().withMessage('Name is required'),
    body('edrpou').notEmpty().withMessage('EDRPOU is required'),
    body('director').notEmpty().withMessage('Director is required'),
    body('accountant').notEmpty().withMessage('Accountant is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('email').isEmail().withMessage('Invalid email'),
  ],

  validateUpdate: [
    body('name').optional().notEmpty(),
    body('director').optional().notEmpty(),
    body('accountant').optional().notEmpty(),
    body('phone').optional().notEmpty(),
    body('email').optional().isEmail(),
  ],

  async create(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: errors.array(),
        });
      }

      if (!req.userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const company = await companiesService.createCompany(req.userId, req.body);

      res.status(201).json({
        success: true,
        data: company,
      });
    } catch (error: any) {
      logger.error('Create company controller error:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  },

  async getAll(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await companiesService.getCompanies(req.userId, page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Get companies controller error:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const companyId = parseInt(req.params.id);

      const company = await companiesService.getCompanyById(companyId, req.userId);

      res.status(200).json({
        success: true,
        data: company,
      });
    } catch (error: any) {
      logger.error('Get company controller error:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: errors.array(),
        });
      }

      if (!req.userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const companyId = parseInt(req.params.id);

      const company = await companiesService.updateCompany(companyId, req.userId, req.body);

      res.status(200).json({
        success: true,
        data: company,
      });
    } catch (error: any) {
      logger.error('Update company controller error:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const companyId = parseInt(req.params.id);

      const result = await companiesService.deleteCompany(companyId, req.userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Delete company controller error:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  },
};
