import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

const prisma = new PrismaClient();

async function migrateUrls() {
  try {
    console.log('Starting URL migration...');
    console.log(`MINIO_PUBLIC_ENDPOINT: ${env.MINIO_PUBLIC_ENDPOINT}`);
    console.log(`MINIO_PORT: ${env.MINIO_PORT}`);
    console.log(`MINIO_BUCKET: ${env.MINIO_BUCKET}`);
    
    const documents = await prisma.document.findMany();
    console.log(`Found ${documents.length} documents to migrate`);
    
    let updated = 0;
    
    for (const doc of documents) {
      if (doc.fileUrl.includes('http://minio:')) {
        const protocol = env.MINIO_USE_SSL ? 'https' : 'http';
        const host = env.MINIO_PUBLIC_ENDPOINT || env.MINIO_ENDPOINT;
        const newUrl = `${protocol}://${host}:${env.MINIO_PORT}/${env.MINIO_BUCKET}/${doc.fileName}`;
        
        await prisma.document.update({
          where: { id: doc.id },
          data: { fileUrl: newUrl },
        });
        
        console.log(`Updated document ${doc.id}: ${doc.fileUrl} -> ${newUrl}`);
        updated++;
      }
    }
    
    console.log(`\nMigration complete! Updated ${updated} documents.`);
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateUrls();
