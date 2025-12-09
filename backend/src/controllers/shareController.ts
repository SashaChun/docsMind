import { Response } from 'express';
import expressValidator from 'express-validator';
import { shareService, ShareVisibility } from '../services/shareService.js';
import { AuthRequest } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const { body, validationResult, param } = expressValidator;

export const shareController = {
  validateCreateDocumentShare: [
    param('id').isInt().withMessage('Document ID must be an integer'),
    body('visibility')
      .isIn(['public', 'private'])
      .withMessage('Visibility must be public or private'),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('expiresInMinutes')
      .optional()
      .isInt({ min: 1, max: 60 * 24 * 30 })
      .withMessage('expiresInMinutes must be between 1 minute and 30 days'),
  ],

  async createDocumentShare(req: AuthRequest, res: Response) {
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

      const documentId = parseInt(req.params.id, 10);
      const visibility = req.body.visibility as ShareVisibility;
      const expiresInMinutes = req.body.expiresInMinutes as number | undefined;
      const email = req.body.email as string | undefined;

      const result = await shareService.createDocumentShare({
        visibility,
        ownerUserId: req.userId,
        documentId,
        targetEmail: email,
        expiresInMinutes,
      });

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Create document share controller error:', error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  },

  async getByToken(req: AuthRequest, res: Response) {
    try {
      const token = req.params.token;
      const share = await shareService.getShareByToken(token);

      const isPrivate = share.type === 'document_private';
      if (isPrivate) {
        if (req.email) {
          if (!share.targetEmail || share.targetEmail.toLowerCase() !== req.email.toLowerCase()) {
            return res.status(403).json({
              success: false,
              error: 'Доступ заборонено. Цей документ призначений для іншого користувача.',
            });
          }
        }
      }

      if (!share.document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found for this share link',
        });
      }

      await shareService.incrementAccessCount(share.id);

      const document = share.document;

      return res.status(200).json({
        success: true,
        data: {
          share: {
            token: share.token,
            type: share.type,
            expiresAt: share.expiresAt,
            accessCount: share.accessCount,
            targetEmail: share.targetEmail,
          },
          document: {
            id: document.id,
            name: document.name,
            category: document.category,
            fileUrl: document.fileUrl,
            mimeType: document.mimeType,
            createdAt: document.createdAt,
            company: document.company
              ? {
                  id: document.company.id,
                  name: document.company.name,
                }
              : undefined,
          },
        },
      });
    } catch (error: any) {
      logger.error('Get share by token controller error:', error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  },

  async getReceived(req: AuthRequest, res: Response) {
    try {
      if (!req.email) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const shares = await shareService.getReceivedSharesForUser(req.email);

      const result = shares
        .filter((share) => !!share.document)
        .map((share) => ({
          id: share.id,
          token: share.token,
          type: share.type,
          createdAt: share.createdAt,
          expiresAt: share.expiresAt,
          accessCount: share.accessCount,
          from: {
            id: share.user.id,
            email: share.user.email,
            name: share.user.name,
          },
          document: share.document
            ? {
                id: share.document.id,
                name: share.document.name,
                category: share.document.category,
                fileUrl: share.document.fileUrl,
                mimeType: share.document.mimeType,
                createdAt: share.document.createdAt,
                company: share.document.company
                  ? {
                      id: share.document.company.id,
                      name: share.document.company.name,
                    }
                  : undefined,
              }
            : undefined,
        }));

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Get received shares controller error:', error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  },
};
