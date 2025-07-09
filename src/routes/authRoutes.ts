import { Router } from 'express';
import { authController } from '../controllers/authController';
import { 
  validateRegister,
  validateLogin,
  authRateLimit,
  generalRateLimit,
  authenticateToken,
  optionalAuth
} from '../middleware';

/**
 * Express router for Authentication endpoints
 * Handles user registration, login, and profile management
 */
const router = Router();

/**
 * POST /api/auth/register
 * Register a new user account
 * @middleware authRateLimit - Rate limiting for auth operations (stricter limits)
 * @middleware validateRegister - Validate registration data (email, password, etc.)
 */
router.post(
  '/register',
  authRateLimit,
  validateRegister,
  authController.register
);

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * @middleware authRateLimit - Rate limiting for auth operations (stricter limits)
 * @middleware validateLogin - Validate login credentials (email, password)
 */
router.post(
  '/login',
  authRateLimit,
  validateLogin,
  authController.login
);

/**
 * GET /api/auth/me
 * Get current authenticated user's profile
 * @middleware generalRateLimit - Rate limiting for read operations
 * @middleware authenticateToken - Require valid JWT token
 */
router.get(
  '/me',
  generalRateLimit,
  authenticateToken,
  authController.getProfile
);

/**
 * POST /api/auth/refresh
 * Refresh JWT token for authenticated user
 * @middleware generalRateLimit - Rate limiting for read operations
 * @middleware authenticateToken - Require valid JWT token
 */
router.post(
  '/refresh',
  generalRateLimit,
  authenticateToken,
  authController.refreshToken
);

/**
 * POST /api/auth/logout
 * Logout user (client-side token invalidation)
 * @middleware generalRateLimit - Rate limiting for read operations
 * @middleware optionalAuth - Optional authentication (to log who's logging out)
 */
router.post(
  '/logout',
  generalRateLimit,
  optionalAuth,
  authController.logout
);

export default router;
export { router as authRoutes };
