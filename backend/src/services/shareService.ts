import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export type ShareVisibility = 'public' | 'private';
export type ShareType = 'document_public' | 'document_private' | 'folder_public' | 'folder_private' | 'multiple_public' | 'multiple_private';

interface CreateDocumentShareOptions {
  visibility: ShareVisibility;
  ownerUserId: number;
  documentId: number;
  targetEmail?: string;
  expiresInMinutes?: number;
}

interface CreateFolderShareOptions {
  visibility: ShareVisibility;
  ownerUserId: number;
  folderId: number;
  targetEmail?: string;
  expiresInMinutes?: number;
}

interface CreateMultipleShareOptions {
  visibility: ShareVisibility;
  ownerUserId: number;
  documentIds: number[];
  targetEmail?: string;
  expiresInMinutes?: number;
}

export const shareService = {
  async createDocumentShare(options: CreateDocumentShareOptions) {
    const { visibility, ownerUserId, documentId, targetEmail, expiresInMinutes } = options;

    try {
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          userId: ownerUserId,
        },
      });

      if (!document) {
        const error = new Error('Document not found');
        (error as any).statusCode = 404;
        throw error;
      }

      if (visibility === 'private' && !targetEmail) {
        const error = new Error('Target email is required for private share');
        (error as any).statusCode = 400;
        throw error;
      }

      const type: ShareType = visibility === 'public' ? 'document_public' : 'document_private';
      // -1 означає безлімітний термін (100 років)
      const isUnlimited = expiresInMinutes === -1;
      const minutes = isUnlimited ? 60 * 24 * 365 * 100 : (expiresInMinutes && expiresInMinutes > 0 ? expiresInMinutes : 60 * 24 * 365 * 100);
      const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
      const token = crypto.randomBytes(32).toString('hex');

      const share = await prisma.share.create({
        data: {
          token,
          type,
          documentId: document.id,
          userId: ownerUserId,
          targetEmail:
            visibility === 'private' && targetEmail
              ? targetEmail.toLowerCase()
              : null,
          expiresAt,
        },
      });

      const url = `${env.FRONTEND_URL}/share/${share.token}`;

      logger.info(`Share link created: ${share.type} for document ${document.id} by user ${ownerUserId}`);

      return {
        token: share.token,
        url,
        type: share.type,
        targetEmail: share.targetEmail,
        expiresAt: share.expiresAt,
      };
    } catch (error) {
      logger.error('Create document share error:', error);
      throw error;
    }
  },

  async getShareByToken(token: string) {
    try {
      const share = await prisma.share.findUnique({
        where: { token },
        include: {
          document: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!share) {
        const error = new Error('Share link not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const now = new Date();
      if (share.expiresAt <= now) {
        const error = new Error('Share link expired');
        (error as any).statusCode = 404;
        throw error;
      }

      return share;
    } catch (error) {
      logger.error('Get share by token error:', error);
      throw error;
    }
  },

  async getReceivedSharesForUser(email: string) {
    try {
      const normalizedEmail = email.toLowerCase();

      const shares = await prisma.share.findMany({
        where: {
          type: 'document_private',
          targetEmail: normalizedEmail,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          document: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return shares;
    } catch (error) {
      logger.error('Get received shares error:', error);
      throw error;
    }
  },

  async incrementAccessCount(shareId: number) {
    try {
      await prisma.share.update({
        where: { id: shareId },
        data: { accessCount: { increment: 1 } },
      });
    } catch (error) {
      logger.error('Increment share access count error:', error);
    }
  },

  async createFolderShare(options: CreateFolderShareOptions) {
    const { visibility, ownerUserId, folderId, targetEmail, expiresInMinutes } = options;

    try {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId: ownerUserId,
        },
        include: {
          documents: true,
        },
      });

      if (!folder) {
        const error = new Error('Folder not found');
        (error as any).statusCode = 404;
        throw error;
      }

      if (visibility === 'private' && !targetEmail) {
        const error = new Error('Target email is required for private share');
        (error as any).statusCode = 400;
        throw error;
      }

      const type: ShareType = visibility === 'public' ? 'folder_public' : 'folder_private';
      // -1 означає безлімітний термін (100 років)
      const isUnlimited = expiresInMinutes === -1;
      const minutes = isUnlimited ? 60 * 24 * 365 * 100 : (expiresInMinutes && expiresInMinutes > 0 ? expiresInMinutes : 60 * 24 * 365 * 100);
      const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
      const token = crypto.randomBytes(32).toString('hex');

      const share = await prisma.share.create({
        data: {
          token,
          type,
          folderId: folder.id,
          userId: ownerUserId,
          targetEmail:
            visibility === 'private' && targetEmail
              ? targetEmail.toLowerCase()
              : null,
          expiresAt,
        },
      });

      const url = `${env.FRONTEND_URL}/share/${share.token}`;

      logger.info(`Folder share link created: ${share.type} for folder ${folder.id} (${folder.documents.length} docs) by user ${ownerUserId}`);

      return {
        token: share.token,
        url,
        type: share.type,
        targetEmail: share.targetEmail,
        expiresAt: share.expiresAt,
        documentsCount: folder.documents.length,
      };
    } catch (error) {
      logger.error('Create folder share error:', error);
      throw error;
    }
  },

  async createMultipleShare(options: CreateMultipleShareOptions) {
    const { visibility, ownerUserId, documentIds, targetEmail, expiresInMinutes } = options;

    try {
      // Перевіряємо, що всі документи належать користувачу
      const documents = await prisma.document.findMany({
        where: {
          id: { in: documentIds },
          userId: ownerUserId,
        },
      });

      if (documents.length !== documentIds.length) {
        const error = new Error('Some documents not found or not owned by user');
        (error as any).statusCode = 404;
        throw error;
      }

      if (visibility === 'private' && !targetEmail) {
        const error = new Error('Target email is required for private share');
        (error as any).statusCode = 400;
        throw error;
      }

      const type: ShareType = visibility === 'public' ? 'multiple_public' : 'multiple_private';
      // -1 означає безлімітний термін (100 років)
      const isUnlimited = expiresInMinutes === -1;
      const minutes = isUnlimited ? 60 * 24 * 365 * 100 : (expiresInMinutes && expiresInMinutes > 0 ? expiresInMinutes : 60 * 24 * 365 * 100);
      const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
      const token = crypto.randomBytes(32).toString('hex');

      const share = await prisma.share.create({
        data: {
          token,
          type,
          documentIds: JSON.stringify(documentIds),
          userId: ownerUserId,
          targetEmail:
            visibility === 'private' && targetEmail
              ? targetEmail.toLowerCase()
              : null,
          expiresAt,
        },
      });

      const url = `${env.FRONTEND_URL}/share/${share.token}`;

      logger.info(`Multiple share link created: ${share.type} for ${documents.length} documents by user ${ownerUserId}`);

      return {
        token: share.token,
        url,
        type: share.type,
        targetEmail: share.targetEmail,
        expiresAt: share.expiresAt,
        documentsCount: documents.length,
      };
    } catch (error) {
      logger.error('Create multiple share error:', error);
      throw error;
    }
  },

  async getShareByTokenExtended(token: string) {
    try {
      const share = await prisma.share.findUnique({
        where: { token },
        include: {
          document: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          folder: {
            include: {
              documents: {
                include: {
                  company: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              company: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!share) {
        const error = new Error('Share link not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const now = new Date();
      if (share.expiresAt <= now) {
        const error = new Error('Share link expired');
        (error as any).statusCode = 404;
        throw error;
      }

      // Якщо це multiple share - завантажуємо документи
      let multipleDocuments: any[] = [];
      if (share.documentIds) {
        const docIds = JSON.parse(share.documentIds) as number[];
        multipleDocuments = await prisma.document.findMany({
          where: {
            id: { in: docIds },
          },
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      }

      return {
        ...share,
        multipleDocuments,
      };
    } catch (error) {
      logger.error('Get share by token extended error:', error);
      throw error;
    }
  },
};
