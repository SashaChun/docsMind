import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import companiesRoutes from './routes/companies.js';
import documentsRoutes from './routes/documents.js';
import sharesRoutes from './routes/shares.js';
import logger from './utils/logger.js';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'no-referrer-when-downgrade' },
}));
app.use(morgan('combined'));

app.use((req, res, next) => {
  res.header('Referrer-Policy', 'no-referrer-when-downgrade');
  res.header('Access-Control-Allow-Origin', env.FRONTEND_URL);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.options(/.*/, cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/shares', sharesRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
