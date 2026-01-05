import { PrismaClient } from '@prisma/client';
import { uploadFile, deleteFile, getFileUrl } from '../utils/minio.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export interface CreateDocumentRequest {
  name: string;
  category: string;
  companyId: number;
  folderName?: string;
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

  async uploadMultipleDocuments(
    userId: number,
    data: CreateDocumentRequest,
    files: Express.Multer.File[]
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

      let folderId: number | null = null;

      // Якщо файлів більше одного - створюємо папку
      if (files.length > 1) {
        const folder = await prisma.folder.create({
          data: {
            name: data.folderName || data.name,
            category: data.category,
            companyId: data.companyId,
            userId,
          },
        });
        folderId = folder.id;
        logger.info(`Folder created: ${folder.name} with ${files.length} files`);
      }

      const uploadedDocuments = [];

      for (const file of files) {
        const fileName = await uploadFile(file.originalname, file.buffer, file.mimetype);
        const fileUrl = getFileUrl(fileName);

        const document = await prisma.document.create({
          data: {
            name: file.originalname,
            category: data.category,
            fileName,
            fileUrl,
            fileSize: file.size,
            mimeType: file.mimetype,
            companyId: data.companyId,
            userId,
            folderId,
          },
        });

        uploadedDocuments.push(document);
        logger.info(`Document uploaded: ${document.name} for company ${company.name}`);
      }

      return {
        documents: uploadedDocuments,
        folderId,
        folderName: folderId ? (data.folderName || data.name) : null,
      };
    } catch (error) {
      logger.error('Upload multiple documents error:', error);
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
            folder: {
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

  async getFolders(
    userId: number,
    companyId?: number,
    category?: string
  ) {
    try {
      const where: any = { userId };

      if (companyId) {
        where.companyId = companyId;
      }

      if (category && category !== 'all') {
        where.category = category;
      }

      const folders = await prisma.folder.findMany({
        where,
        include: {
          documents: {
            select: {
              id: true,
              name: true,
              mimeType: true,
              fileSize: true,
              createdAt: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return folders;
    } catch (error) {
      logger.error('Get folders error:', error);
      throw error;
    }
  },

  async deleteFolder(folderId: number, userId: number) {
    try {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId,
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

      // Видаляємо всі файли з MinIO
      for (const doc of folder.documents) {
        await deleteFile(doc.fileName);
      }

      // Видаляємо папку (документи видаляться каскадно)
      await prisma.folder.delete({
        where: { id: folderId },
      });

      logger.info(`Folder deleted: ${folder.name} with ${folder.documents.length} documents`);

      return { success: true };
    } catch (error: any) {
      logger.error('Delete folder error:', error);
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


      // Generate public URL for direct access to MinIO (bucket is public)
      const fileUrl = getFileUrl(document.fileName);

      return {
        ...document,
        fileUrl,
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

  async moveDocumentToFolder(documentId: number, userId: number, folderId: number | null) {
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

      // Якщо folderId вказано, перевіряємо чи папка існує і належить користувачу
      if (folderId !== null) {
        const folder = await prisma.folder.findFirst({
          where: {
            id: folderId,
            userId,
          },
        });

        if (!folder) {
          const error = new Error('Folder not found');
          (error as any).statusCode = 404;
          throw error;
        }

        // Перевіряємо, що документ і папка належать одній компанії
        if (folder.companyId !== document.companyId) {
          const error = new Error('Document and folder must belong to the same company');
          (error as any).statusCode = 400;
          throw error;
        }
      }

      const updatedDocument = await prisma.document.update({
        where: { id: documentId },
        data: {
          folderId,
          updatedAt: new Date(),
        },
        include: {
          folder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      logger.info(`Document moved: ${document.name} to folder ${folderId || 'root'}`);

      return updatedDocument;
    } catch (error: any) {
      logger.error('Move document to folder error:', error);
      throw error;
    }
  },

  async createFolder(userId: number, data: { name: string; category: string; companyId: number }) {
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

      const folder = await prisma.folder.create({
        data: {
          name: data.name,
          category: data.category,
          companyId: data.companyId,
          userId,
        },
      });

      logger.info(`Folder created: ${folder.name}`);

      return folder;
    } catch (error: any) {
      logger.error('Create folder error:', error);
      throw error;
    }
  },
};
