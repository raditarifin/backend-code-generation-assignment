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
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user account
 *     description: Create a new user account with email and password. Returns JWT token for immediate authentication.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *           examples:
 *             user:
 *               summary: Regular user registration
 *               value:
 *                 email: "user@example.com"
 *                 password: "password123"
 *                 first_name: "John"
 *                 last_name: "Doe"
 *                 role: "user"
 *             admin:
 *               summary: Admin user registration
 *               value:
 *                 email: "admin@example.com"
 *                 password: "admin123"
 *                 first_name: "Admin"
 *                 last_name: "User"
 *                 role: "admin"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               data:
 *                 user:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   email: "user@example.com"
 *                   role: "user"
 *                   first_name: "John"
 *                   last_name: "Doe"
 *                   is_active: true
 *                   created_at: "2025-07-09T15:26:11.939Z"
 *                   updated_at: "2025-07-09T15:26:11.939Z"
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 expires_in: 86400
 *               meta:
 *                 timestamp: "2025-07-09T15:26:11.939Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "VALIDATION_ERROR"
 *                 message: "User with this email already exists"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post(
  '/register',
  authRateLimit,
  validateRegister,
  authController.register
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Authenticate user and return JWT token
 *     description: Login with email and password to receive a JWT token for API access.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *           examples:
 *             user:
 *               summary: Regular user login
 *               value:
 *                 email: "user@todoapi.com"
 *                 password: "user123"
 *             admin:
 *               summary: Admin user login
 *               value:
 *                 email: "admin@todoapi.com"
 *                 password: "admin123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               data:
 *                 user:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   email: "user@todoapi.com"
 *                   role: "user"
 *                   first_name: "Test"
 *                   last_name: "User"
 *                   is_active: true
 *                   created_at: "2025-07-09T15:26:11.939Z"
 *                   updated_at: "2025-07-09T15:26:11.939Z"
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 expires_in: 86400
 *               meta:
 *                 timestamp: "2025-07-09T15:26:11.939Z"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "UNAUTHORIZED"
 *                 message: "Invalid email or password"
 *       403:
 *         description: Account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "UNAUTHORIZED"
 *                 message: "Account is deactivated"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post(
  '/login',
  authRateLimit,
  validateLogin,
  authController.login
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current authenticated user's profile
 *     description: Retrieve the profile information of the currently authenticated user.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserProfile'
 *             example:
 *               success: true
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 email: "user@todoapi.com"
 *                 role: "user"
 *                 first_name: "Test"
 *                 last_name: "User"
 *                 is_active: true
 *                 created_at: "2025-07-09T15:26:11.939Z"
 *                 updated_at: "2025-07-09T15:26:11.939Z"
 *               meta:
 *                 timestamp: "2025-07-09T15:26:11.939Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/me',
  generalRateLimit,
  authenticateToken,
  authController.getProfile
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh JWT token for authenticated user
 *     description: Generate a new JWT token for the current user. Requires valid authentication.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               data:
 *                 user:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   email: "user@todoapi.com"
 *                   role: "user"
 *                   first_name: "Test"
 *                   last_name: "User"
 *                   is_active: true
 *                   created_at: "2025-07-09T15:26:11.939Z"
 *                   updated_at: "2025-07-09T15:26:11.939Z"
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 expires_in: 86400
 *               meta:
 *                 timestamp: "2025-07-09T15:26:11.939Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/refresh',
  generalRateLimit,
  authenticateToken,
  authController.refreshToken
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user (client-side token invalidation)
 *     description: |
 *       Logout the current user. Since JWT tokens are stateless, this endpoint primarily serves
 *       as a logging mechanism. Clients should remove the token from their storage.
 *     tags: [Authentication]
 *     security: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: "Please remove the token from your client storage"
 *             example:
 *               success: true
 *               data:
 *                 message: "Please remove the token from your client storage"
 *               meta:
 *                 timestamp: "2025-07-09T15:26:11.939Z"
 */
router.post(
  '/logout',
  generalRateLimit,
  optionalAuth,
  authController.logout
);

export default router;
export { router as authRoutes };
