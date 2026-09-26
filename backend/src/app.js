import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { checkFirestoreHealth } from './config/firebase.js';
import { errorHandler } from './middleware/errorHandler.js';
import * as dbService from './services/firestoreDb.js';
import { seedDatabase } from './utils/seedData.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import listRoutes from './routes/listRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow any origin or Vercel preview URLs
      callback(null, true);
    },
    credentials: true,
  })
);

// Request body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate limiting for Auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
});

app.use('/api/auth', authLimiter);

// Health check endpoint with Firestore status
app.get('/api/health', async (req, res) => {
  const dbHealth = await checkFirestoreHealth();
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CinePulse Streaming API',
    environment: process.env.NODE_ENV || 'development',
    database: dbHealth,
  });
});

// Auto-seed catalog if empty (ensures movies are present on Vercel serverless cold-start)
let isSeeded = false;
let seedPromise = null;

const ensureDataSeeded = async () => {
  if (isSeeded) return;
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        const count = await dbService.count('movies');
        if (count === 0) {
          console.log('[Server] Database is empty. Seeding catalog...');
          await seedDatabase();
        }
        isSeeded = true;
      } catch (err) {
        console.warn('[Server] Auto-seed check warning:', err.message);
      } finally {
        seedPromise = null;
      }
    })();
  }
  await seedPromise;
};

// Middleware to ensure DB has content on first catalog request
app.use(async (req, res, next) => {
  if (!isSeeded && req.path.startsWith('/api') && req.path !== '/api/health') {
    try {
      await ensureDataSeeded();
    } catch (e) {
      // Ignore seeding error, continue handling request
    }
  }
  next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/my-list', listRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// Centralized error handling
app.use(errorHandler);

export default app;
