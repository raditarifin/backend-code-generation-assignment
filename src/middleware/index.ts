/**
 * Middleware layer exports
 * Provides request processing and validation middleware
 */

// Authentication and Authorization
export { authenticateToken, optionalAuth } from './authentication';
export { requireRole, requireAdmin, requireUser, UserRole } from './authorization';

// Rate Limiting
export { 
  RateLimiter,
  generalRateLimit, 
  authRateLimit, 
  mutationRateLimit, 
  userRateLimit,
  createGeneralRateLimit,
  createAuthRateLimit,
  createMutationRateLimit,
  createUserRateLimit
} from './rateLimiting';

// Error Handling
export { 
  errorHandler, 
  notFoundHandler, 
  asyncHandler,
  createValidationError,
  createNotFoundError,
  createUnauthorizedError,
  createForbiddenError,
  createConflictError
} from './errorHandler';

// Validation
export { 
  validate, 
  sanitizeInput, 
  validatePagination, 
  validateUuidParam 
} from './validation';

// Validation Schemas
export * from './validationSchemas';

// Logging (already implemented)
export { requestLogger, errorLogger } from './logging';
