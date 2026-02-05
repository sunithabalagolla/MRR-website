import express, { Application } from 'express';
import cors from 'cors';
import config from './config/env.config';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';

/**
 * Express App Configuration
 * Configures middleware, routes, and error handling
 */

const createApp = (): Application => {
  const app = express();

  // ============================================
  // Middleware Configuration
  // ============================================

  // CORS - Allow cross-origin requests
  app.use(
    cors({
      origin: config.corsOrigin.split(',').map((origin) => origin.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
  app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

  // Rate limiting - Apply to all routes
  app.use(rateLimitMiddleware);

  // Request logging (development only)
  if (config.nodeEnv === 'development') {
    app.use((req, _res, next) => {
      console.log(`📨 ${req.method} ${req.url}`);
      next();
    });
  }

  // ============================================
  // Health Check Endpoint
  // ============================================
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // ============================================
  // API Routes
  // ============================================
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);

  // ============================================
  // Error Handling
  // ============================================

  // 404 handler - Must be after all routes
  app.use(notFoundHandler);

  // Global error handler - Must be last
  app.use(errorHandler);

  return app;
};

export default createApp;
