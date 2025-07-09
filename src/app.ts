import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { requestLogger, errorLogger } from './middleware/logging';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { listRoutes, taskRoutes, authRoutes } from './routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Basic API info endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    name: 'Task Management API',
    version: process.env.API_VERSION || 'v1',
    description: 'A RESTful API for task management using in-memory storage',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/v1/auth',
      lists: '/api/v1/lists',
      tasks: '/api/v1/tasks',
      health: '/health',
    },
  });
});

// API Routes - Version 1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/lists', listRoutes);
app.use('/api/v1/tasks', taskRoutes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Error logging middleware
app.use(errorLogger);

// Global error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.logStartup(Number(PORT), process.env.NODE_ENV || 'development');
  logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
  logger.info(`📚 API info: http://localhost:${PORT}/api`);
  logger.info(`� Auth API: http://localhost:${PORT}/api/v1/auth`);
  logger.info(`�📋 Lists API: http://localhost:${PORT}/api/v1/lists`);
  logger.info(`✅ Tasks API: http://localhost:${PORT}/api/v1/tasks`);
});

export default app;
