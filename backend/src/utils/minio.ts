import { Client } from 'minio';
import { env } from '../config/env.js';
import logger from './logger.js';

const minioClient = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});


export const initMinIO = async () => {
  try {
    const bucketExists = await minioClient.bucketExists(env.MINIO_BUCKET);
    if (!bucketExists) {
      await minioClient.makeBucket(env.MINIO_BUCKET, 'us-east-1');
      logger.info(`MinIO bucket "${env.MINIO_BUCKET}" created`);
    } else {
      logger.info(`MinIO bucket "${env.MINIO_BUCKET}" already exists`);
    }

    // Встановлюємо публічну політику для читання
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${env.MINIO_BUCKET}/*`],
        },
      ],
    };

    await minioClient.setBucketPolicy(env.MINIO_BUCKET, JSON.stringify(policy));
    logger.info(`MinIO bucket "${env.MINIO_BUCKET}" policy set to public read`);
  } catch (error) {
    logger.error('MinIO initialization error:', error);
    throw error;
  }
};

export const uploadFile = async (
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> => {
  try {
    const objectName = `${Date.now()}-${fileName}`;
    
    logger.info(`Uploading file to MinIO: ${objectName}`);
    logger.info(`Original filename: ${fileName}`);
    logger.info(`Buffer length: ${fileBuffer.length} bytes`);
    logger.info(`MIME type: ${mimeType}`);
    logger.info(`Is Buffer: ${Buffer.isBuffer(fileBuffer)}`);
    
    await minioClient.putObject(
      env.MINIO_BUCKET,
      objectName,
      fileBuffer,
      fileBuffer.length,
      { 'Content-Type': mimeType }
    );
    
    logger.info(`File uploaded to MinIO successfully: ${objectName}`);
    
    // Verify the upload
    const stats = await minioClient.statObject(env.MINIO_BUCKET, objectName);
    logger.info(`Uploaded file size in MinIO: ${stats.size} bytes`);
    logger.info(`ETag: ${stats.etag}`);
    logger.info(`Content-Type: ${stats.metaData['content-type']}`);
    
    if (stats.size !== fileBuffer.length) {
      logger.error(`⚠️ FILE SIZE MISMATCH! Expected: ${fileBuffer.length}, Got: ${stats.size}`);
    } else {
      logger.info(`✓ File size verified: ${stats.size} bytes`);
    }
    
    return objectName;
  } catch (error) {
    logger.error('File upload error:', error);
    throw error;
  }
};

export const deleteFile = async (fileName: string): Promise<void> => {
  try {
    await minioClient.removeObject(env.MINIO_BUCKET, fileName);
    logger.info(`File deleted from MinIO: ${fileName}`);
  } catch (error) {
    logger.error('File deletion error:', error);
    throw error;
  }
};

export const getFileUrl = (fileName: string): string => {
  const protocol = env.MINIO_USE_SSL ? 'https' : 'http';
  const host = env.MINIO_PUBLIC_ENDPOINT || env.MINIO_ENDPOINT;
  const encodedFileName = encodeURIComponent(fileName);
  return `${protocol}://${host}:${env.MINIO_PORT}/${env.MINIO_BUCKET}/${encodedFileName}`;
};

export const getPresignedUrl = async (fileName: string, expirySeconds = 3600): Promise<string> => {
  try {
    // Generate presigned URL using internal client, then replace host with public endpoint
    const internalUrl = await minioClient.presignedGetObject(env.MINIO_BUCKET, fileName, expirySeconds);

    // Replace internal endpoint with public endpoint
    const publicUrl = internalUrl.replace(
      `${env.MINIO_USE_SSL ? 'https' : 'http'}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`,
      `${env.MINIO_USE_SSL ? 'https' : 'http'}://${env.MINIO_PUBLIC_ENDPOINT}:${env.MINIO_PORT}`
    );

    return publicUrl;
  } catch (error) {
    logger.error('Presigned URL generation error:', error);
    throw error;
  }
};

export const getFileStream = async (fileName: string) => {
  try {
    return await minioClient.getObject(env.MINIO_BUCKET, fileName);
  } catch (error) {
    logger.error('File stream error:', error);
    throw error;
  }
};

export default minioClient;
