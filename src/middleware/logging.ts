import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request logging middleware
 * Logs HTTP requests with method, URL, status code, and response time
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Listen for the response finish event instead of overriding res.end
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Log the request
    logger.logRequest(
      req.method,
      req.originalUrl || req.url,
      res.statusCode,
      responseTime
    );
  });
  
  next();
};

/**
 * Error logging middleware
 * Logs errors that occur during request processing
 */
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Request error occurred', {
    error: err.message,
    method: req.method,
    url: req.originalUrl || req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    stack: err.stack,
  });
  
  next(err);
};

export default {
  requestLogger,
  errorLogger,
};
