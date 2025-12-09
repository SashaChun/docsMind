import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export type ShareVisibility = 'public' | 'private';
export type ShareType = 'document_public' | 'document_private';

interface CreateDocumentShareOptions {
  visibility: ShareVisibility;
  ownerUserId: number;
  documentId: number;
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
      const minutes = expiresInMinutes && expiresInMinutes > 0 ? expiresInMinutes : 60 * 24;
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
};
