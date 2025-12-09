import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000'),
  API_URL: process.env.API_URL || 'http://localhost:3000',
  
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  JWT_SECRET: process.env.JWT_SECRET || 'secret',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '1h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
  
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || 'localhost',
  MINIO_PORT: parseInt(process.env.MINIO_PORT || '9000'),
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || 'minioadmin',
  MINIO_BUCKET: process.env.MINIO_BUCKET || 'documents',
  MINIO_USE_SSL: process.env.MINIO_USE_SSL === 'true',
  MINIO_PUBLIC_ENDPOINT:
    process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT || 'localhost',
  
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
  ALLOWED_MIME_TYPES: (process.env.ALLOWED_MIME_TYPES || 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain').split(','),
};
