import { Router } from 'express';
import { taskController } from '../controllers';
import { 
  validateCreateTask,
  validateUpdateTask,
  validateTaskParams,
  validateTaskQuery,
  validateTasksDueThisWeekQuery,
  validateTasksByDeadlineQuery,
  validateOverdueTasksQuery,
  validateTasksByPriorityParams,
  validateDateRange,
  generalRateLimit,
  mutationRateLimit,
  authenticateToken,
  optionalAuth,
  requireUser
} from '../middleware';

/**
 * Express router for Task endpoints
 * Handles all task-related API routes with appropriate middleware
 */
const router = Router();

/**
 * GET /api/tasks
 * Get all tasks with optional filtering, sorting, and pagination
 * @middleware generalRateLimit - Rate limiting for read operations
 * @middleware optionalAuth - Optional authentication (for user-specific data)
 * @middleware validateTaskQuery - Validate query parameters
 * @middleware validateDateRange - Validate date range if both dates provided
 */
router.get(
  '/',
  generalRateLimit,
  optionalAuth,
  validateTaskQuery,
  validateDateRange,
  taskController.getAllTasks
);

/**
 * POST /api/tasks
 * Create a new task
 * @middleware mutationRateLimit - Rate limiting for write operations
 * @middleware authenticateToken - Require valid JWT token
 * @middleware requireUser - Require user role
 * @middleware validateCreateTask - Validate request body against task creation schema
 */
router.post(
  '/',
  mutationRateLimit,
  authenticateToken,
  requireUser,
  validateCreateTask,
  taskController.createTask
);

/**
 * GET /api/tasks/due-this-week
 * Get tasks due within the next 7 days
 * @middleware generalRateLimit - Rate limiting for read operations
 * @middleware optionalAuth - Optional authentication (for user-specific data)
 * @middleware validateTasksDueThisWeekQuery - Validate query parameters (no date filters allowed)
 */
router.get(
  '/due-this-week',
  generalRateLimit,
  optionalAuth,
  validateTasksDueThisWeekQuery,
  taskController.getTasksDueThisWeek
);

/**
 * GET /api/tasks/by-deadline
 * Get tasks grouped by deadline
 * @middleware generalRateLimit - Rate limiting for read operations
 * @middleware optionalAuth - Optional authentication (for user-specific data)
 * @middleware validateTasksByDeadlineQuery - Validate query parameters
 * @middleware validateDateRange - Validate date range if both dates provided
 */
router.get(
  '/by-deadline',
  generalRateLimit,
  optionalAuth,
  validateTasksByDeadlineQuery,
  validateDateRange,
  taskController.getTasksByDeadline
);

/**
 * GET /api/tasks/overdue
 * Get overdue tasks (past deadline and not completed)
 * @middleware generalRateLimit - Rate limiting for read operations
 * @middleware optionalAuth - Optional authentication (for user-specific data)
 * @middleware validateOverdueTasksQuery - Validate query parameters
 */
router.get(
  '/overdue',
  generalRateLimit,
  optionalAuth,
  validateOverdueTasksQuery,
  taskController.getOverdueTasks
);

/**
 * GET /api/tasks/priority/:priority
 * Get tasks by priority level
 * @param priority - Priority level (low, medium, high)
 * @middleware generalRateLimit - Rate limiting for read operations
 * @middleware optionalAuth - Optional authentication (for user-specific data)
 * @middleware validateTasksByPriorityParams - Validate priority parameter and query parameters
 */
router.get(
  '/priority/:priority',
  generalRateLimit,
  optionalAuth,
  validateTasksByPriorityParams,
  taskController.getTasksByPriority
);

/**
 * GET /api/tasks/:id
 * Get a specific task by ID
 * @param id - Task UUID
 * @middleware generalRateLimit - Rate limiting for read operations
 * @middleware optionalAuth - Optional authentication (for user-specific data)
 * @middleware validateTaskParams - Validate UUID parameter format
 */
router.get(
  '/:id',
  generalRateLimit,
  optionalAuth,
  validateTaskParams,
  taskController.getTaskById
);

/**
 * PUT /api/tasks/:id
 * Update an existing task
 * @param id - Task UUID
 * @middleware mutationRateLimit - Rate limiting for write operations
 * @middleware authenticateToken - Require valid JWT token
 * @middleware requireUser - Require user role
 * @middleware validateUpdateTask - Validate UUID parameter and request body
 */
router.put(
  '/:id',
  mutationRateLimit,
  authenticateToken,
  requireUser,
  validateUpdateTask,
  taskController.updateTask
);

/**
 * DELETE /api/tasks/:id
 * Delete a task
 * @param id - Task UUID
 * @middleware mutationRateLimit - Rate limiting for write operations
 * @middleware authenticateToken - Require valid JWT token
 * @middleware requireUser - Require user role
 * @middleware validateTaskParams - Validate UUID parameter format
 */
router.delete(
  '/:id',
  mutationRateLimit,
  authenticateToken,
  requireUser,
  validateTaskParams,
  taskController.deleteTask
);

/**
 * PATCH /api/tasks/:id/complete
 * Mark a task as completed
 * @param id - Task UUID
 * @middleware mutationRateLimit - Rate limiting for write operations
 * @middleware authenticateToken - Require valid JWT token
 * @middleware requireUser - Require user role
 * @middleware validateTaskParams - Validate UUID parameter format
 */
router.patch(
  '/:id/complete',
  mutationRateLimit,
  authenticateToken,
  requireUser,
  validateTaskParams,
  taskController.completeTask
);

/**
 * PATCH /api/tasks/:id/uncomplete
 * Mark a task as pending (uncomplete)
 * @param id - Task UUID
 * @middleware mutationRateLimit - Rate limiting for write operations
 * @middleware authenticateToken - Require valid JWT token
 * @middleware requireUser - Require user role
 * @middleware validateTaskParams - Validate UUID parameter format
 */
router.patch(
  '/:id/uncomplete',
  mutationRateLimit,
  authenticateToken,
  requireUser,
  validateTaskParams,
  taskController.uncompleteTask
);

export default router;
export { router as taskRoutes };
