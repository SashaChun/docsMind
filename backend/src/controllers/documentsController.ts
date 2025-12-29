import { Response } from 'express';
import expressValidator from 'express-validator';
import { documentsService } from '../services/documentsService.js';
import { AuthRequest } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { env } from '../config/env.js';

const { body, query, validationResult } = expressValidator;

export const documentsController = {
  validateUpload: [
    body('name').notEmpty().withMessage('Document name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('companyId').isInt().withMessage('Valid company ID is required'),
  ],

  async upload(req: AuthRequest, res: Response) {
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

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'File is required',
        });
      }

      logger.info('File upload details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer?.length || 0,
      });

      // Log first 20 bytes to verify file format
      if (req.file.buffer && req.file.buffer.length > 0) {
        const first20Bytes = req.file.buffer.slice(0, 20);
        const hexString = first20Bytes.toString('hex');
        const asciiString = first20Bytes.toString('ascii').replace(/[^\x20-\x7E]/g, '.');
        
        logger.info(`First 20 bytes (hex): ${hexString}`);
        logger.info(`First 20 bytes (ascii): ${asciiString}`);
        logger.info(`First 2 bytes: 0x${first20Bytes[0].toString(16)} 0x${first20Bytes[1].toString(16)}`);
        
        // DOCX files should start with PK (ZIP signature: 50 4B)
        if (req.file.mimetype.includes('wordprocessingml') || req.file.mimetype.includes('msword')) {
          if (first20Bytes[0] !== 0x50 || first20Bytes[1] !== 0x4B) {
            logger.warn(`⚠️ WARNING: File does not have ZIP signature! Got: 0x${first20Bytes[0].toString(16)} 0x${first20Bytes[1].toString(16)} instead of 0x50 0x4B (PK)`);
            logger.warn(`This file may not be a valid DOCX file and may fail to open in the editor.`);
            // Temporarily allow upload to see what happens
            // return res.status(400).json({
            //   success: false,
            //   error: 'Invalid DOCX file format - file does not appear to be a ZIP archive',
            // });
          }
        }
      }

      if (req.file.size === 0 || !req.file.buffer || req.file.buffer.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'File is empty',
        });
      }

      if (req.file.size > env.MAX_FILE_SIZE) {
        return res.status(400).json({
          success: false,
          error: 'File size exceeds maximum limit',
        });
      }

      if (!env.ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
        logger.warn('File type not allowed:', {
          mimetype: req.file.mimetype,
          allowed: env.ALLOWED_MIME_TYPES,
        });
        return res.status(400).json({
          success: false,
          error: 'File type not allowed',
        });
      }

      const document = await documentsService.uploadDocument(
        req.userId,
        {
          ...req.body,
          companyId: parseInt(req.body.companyId, 10),
        },
        req.file
      );

      res.status(201).json({
        success: true,
        data: document,
      });
    } catch (error: any) {
      logger.error('Upload document controller error:', error);
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

      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const category = (req.query.category as string) || undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await documentsService.getDocuments(
        req.userId,
        companyId,
        category,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Get documents controller error:', error);
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

      const documentId = parseInt(req.params.id);

      const document = await documentsService.getDocumentById(documentId, req.userId);

      res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error: any) {
      logger.error('Get document controller error:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  },

  async getFile(req: AuthRequest, res: Response) {
    try {
      const documentId = parseInt(req.params.id, 10);

      if (!req.userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const document = await documentsService.getDocumentById(documentId, req.userId);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found',
        });
      }

      const { getFileStream } = await import('../utils/minio.js');
      const fileStream = await getFileStream(document.fileName);

      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
      // Кодуємо ім'я файлу для підтримки кирилиці (RFC 5987)
      const encodedFileName = encodeURIComponent(document.fileName).replace(/'/g, '%27');
      res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodedFileName}`);
      
      fileStream.pipe(res);
    } catch (error: any) {
      logger.error('Get file controller error:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const documentId = parseInt(req.params.id, 10);

      if (!req.userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        }); //s
      }

      await documentsService.deleteDocument(documentId, req.userId);

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete document controller error:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  },

  async updateContent(req: AuthRequest, res: Response) {
    try {
      const documentId = parseInt(req.params.id, 10);
      const { content } = req.body;

      if (!req.userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'Content is required',
        });
      }

      const document = await documentsService.updateDocumentContent(
        documentId,
        req.userId,
        content
      );

      res.json({
        success: true,
        data: document,
      });
    } catch (error: any) {
      logger.error('Update content controller error:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  },
};
