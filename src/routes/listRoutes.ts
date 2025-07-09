import { Router } from 'express';
import { listController } from '../controllers';
import { 
  validateCreateList,
  validateUpdateList,
  validateListParams,
  validateListQuery,
  validateListTasksQuery,
  validateUuidParam, 
  generalRateLimit,
  mutationRateLimit,
  authenticateToken,
  optionalAuth,
  requireUser
} from '../middleware';

/**
 * Express router for List endpoints
 * Handles all list-related API routes with appropriate middleware
 */
const router = Router();

/**
 * GET /api/lists
 * Get all lists with optional filtering, sorting, and pagination
 * @middleware generalRateLimit - Rate limiting for read operations
 * @middleware optionalAuth - Optional authentication (for user-specific data)
 * @middleware validateListQuery - Validate query parameters
 */
router.get(
  '/',
  generalRateLimit,
  optionalAuth,
  validateListQuery,
  listController.getAllLists
);

/**
 * POST /api/lists
 * Create a new list
 * @middleware mutationRateLimit - Rate limiting for write operations
 * @middleware authenticateToken - Require valid JWT token
 * @middleware requireUser - Require user role
 * @middleware validateCreateList - Validate request body against list creation schema
 */
router.post(
  '/',
  mutationRateLimit,
  authenticateToken,
  requireUser,
  validateCreateList,
  listController.createList
);

/**
 * GET /api/lists/:id
 * Get a specific list by ID
 * @param id - List UUID
 * @middleware generalRateLimit - Rate limiting for read operations
 * @middleware optionalAuth - Optional authentication (for user-specific data)
 * @middleware validateListParams - Validate UUID parameter format
 */
router.get(
  '/:id',
  generalRateLimit,
  optionalAuth,
  validateListParams,
  listController.getListById
);

/**
 * PUT /api/lists/:id
 * Update an existing list
 * @param id - List UUID
 * @middleware mutationRateLimit - Rate limiting for write operations
 * @middleware authenticateToken - Require valid JWT token
 * @middleware requireUser - Require user role
 * @middleware validateUpdateList - Validate UUID parameter and request body
 */
router.put(
  '/:id',
  mutationRateLimit,
  authenticateToken,
  requireUser,
  validateUpdateList,
  listController.updateList
);

/**
 * DELETE /api/lists/:id
 * Delete a list and all its tasks
 * @param id - List UUID
 * @middleware mutationRateLimit - Rate limiting for write operations
 * @middleware authenticateToken - Require valid JWT token
 * @middleware requireUser - Require user role
 * @middleware validateListParams - Validate UUID parameter format
 */
router.delete(
  '/:id',
  mutationRateLimit,
  authenticateToken,
  requireUser,
  validateListParams,
  listController.deleteList
);

/**
 * GET /api/lists/:id/tasks
 * Get all tasks for a specific list
 * @param id - List UUID
 * @middleware generalRateLimit - Rate limiting for read operations
 * @middleware optionalAuth - Optional authentication (for user-specific data)
 * @middleware validateListTasksQuery - Validate UUID parameter and query parameters
 */
router.get(
  '/:id/tasks',
  generalRateLimit,
  optionalAuth,
  validateListTasksQuery,
  listController.getListTasks
);

export default router;
export { router as listRoutes };
