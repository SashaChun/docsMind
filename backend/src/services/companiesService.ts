import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export interface CreateCompanyRequest {
  name: string;
  edrpou: string;
  director: string;
  accountant: string;
  phone: string;
  email: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  director?: string;
  accountant?: string;
  phone?: string;
  email?: string;
}

export const companiesService = {
  async createCompany(userId: number, data: CreateCompanyRequest) {
    try {
      const existingCompany = await prisma.company.findUnique({
        where: { edrpou: data.edrpou },
      });

      if (existingCompany) {
        const error = new Error('Company with this EDRPOU already exists');
        (error as any).statusCode = 409;
        throw error;
      }

      const company = await prisma.company.create({
        data: {
          ...data,
          userId,
        },
      });

      logger.info(`Company created: ${company.name} by user ${userId}`);

      return company;
    } catch (error) {
      logger.error('Create company error:', error);
      throw error;
    }
  },

  async getCompanies(userId: number, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [companies, total] = await Promise.all([
        prisma.company.findMany({
          where: { userId },
          skip,
          take: limit,
          include: {
            _count: {
              select: { documents: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.company.count({ where: { userId } }),
      ]);

      return {
        companies: companies.map((c) => ({
          ...c,
          documentsCount: c._count.documents,
          _count: undefined,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get companies error:', error);
      throw error;
    }
  },

  async getCompanyById(companyId: number, userId: number) {
    try {
      const company = await prisma.company.findFirst({
        where: {
          id: companyId,
          userId,
        },
        include: {
          documents: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!company) {
        const error = new Error('Company not found');
        (error as any).statusCode = 404;
        throw error;
      }

      return company;
    } catch (error) {
      logger.error('Get company error:', error);
      throw error;
    }
  },

  async updateCompany(
    companyId: number,
    userId: number,
    data: UpdateCompanyRequest
  ) {
    try {
      const company = await prisma.company.findFirst({
        where: {
          id: companyId,
          userId,
        },
      });

      if (!company) {
        const error = new Error('Company not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const updated = await prisma.company.update({
        where: { id: companyId },
        data,
      });

      logger.info(`Company updated: ${updated.name}`);

      return updated;
    } catch (error) {
      logger.error('Update company error:', error);
      throw error;
    }
  },

  async deleteCompany(companyId: number, userId: number) {
    try {
      const company = await prisma.company.findFirst({
        where: {
          id: companyId,
          userId,
        },
      });

      if (!company) {
        const error = new Error('Company not found');
        (error as any).statusCode = 404;
        throw error;
      }

      await prisma.company.delete({
        where: { id: companyId },
      });

      logger.info(`Company deleted: ${company.name}`);

      return { message: 'Company deleted successfully' };
    } catch (error) {
      logger.error('Delete company error:', error);
      throw error;
    }
  },
};
