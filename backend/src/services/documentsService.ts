import { PrismaClient } from '@prisma/client';
import { uploadFile, deleteFile, getFileUrl } from '../utils/minio.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export interface CreateDocumentRequest {
  name: string;
  category: string;
  companyId: number;
}

export const documentsService = {
  async uploadDocument(
    userId: number,
    data: CreateDocumentRequest,
    file: Express.Multer.File
  ) {
    try {
      const company = await prisma.company.findFirst({
        where: {
          id: data.companyId,
          userId,
        },
      });

      if (!company) {
        const error = new Error('Company not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const fileName = await uploadFile(file.originalname, file.buffer, file.mimetype);
      const fileUrl = getFileUrl(fileName);

      const document = await prisma.document.create({
        data: {
          name: data.name,
          category: data.category,
          fileName,
          fileUrl,
          fileSize: file.size,
          mimeType: file.mimetype,
          companyId: data.companyId,
          userId,
        },
      });

      logger.info(`Document uploaded: ${document.name} for company ${company.name}`);

      return document;
    } catch (error) {
      logger.error('Upload document error:', error);
      throw error;
    }
  },

  async getDocuments(
    userId: number,
    companyId?: number,
    category?: string,
    page = 1,
    limit = 20
  ) {
    try {
      const skip = (page - 1) * limit;
      const where: any = { userId };

      if (companyId) {
        where.companyId = companyId;
      }

      if (category && category !== 'all') {
        where.category = category;
      }

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where,
          skip,
          take: limit,
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.document.count({ where }),
      ]);

      return {
        documents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get documents error:', error);
      throw error;
    }
  },

  async getDocumentById(documentId: number, userId: number) {
    try {
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          userId,
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

      if (!document) {
        const error = new Error('Document not found');
        (error as any).statusCode = 404;
        throw error;
      }

      // Generate presigned URL for better encoding handling
      const { getPresignedUrl } = await import('../utils/minio.js');
      const presignedUrl = await getPresignedUrl(document.fileName, 3600);

      return {
        ...document,
        fileUrl: presignedUrl,
      };
    } catch (error) {
      logger.error('Get document error:', error);
      throw error;
    }
  },

  async deleteDocument(documentId: number, userId: number) {
    try {
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          userId,
        },
      });

      if (!document) {
        const error = new Error('Document not found');
        (error as any).statusCode = 404;
        throw error;
      }

      await deleteFile(document.fileName);

      await prisma.document.delete({
        where: { id: documentId },
      });

      logger.info(`Document deleted: ${document.name}`);

      return { success: true };
    } catch (error: any) {
      logger.error('Delete document service error:', error);
      throw error;
    }
  },

  async updateDocumentContent(documentId: number, userId: number, content: string) {
    try {
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          userId,
        },
      });

      if (!document) {
        const error = new Error('Document not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const updatedDocument = await prisma.document.update({
        where: { id: documentId },
        data: {
          content,
          updatedAt: new Date(),
        },
      });

      logger.info(`Document content updated: ${document.name} (${content.length} chars)`);

      return updatedDocument;
    } catch (error: any) {
      logger.error('Update document content service error:', error);
      throw error;
    }
  },
};
