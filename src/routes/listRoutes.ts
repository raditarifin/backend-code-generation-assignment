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
 * @swagger
 * /api/v1/lists:
 *   get:
 *     summary: Get all lists with optional filtering, sorting, and pagination
 *     description: |
 *       Retrieve all lists with support for pagination, search, filtering, and sorting.
 *       Authentication is optional - authenticated users see all lists, while unauthenticated users see public lists only.
 *     tags: [Lists]
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortFieldParam'
 *       - $ref: '#/components/parameters/SortOrderParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - name: color
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by list color (hex code)
 *         example: "#3498db"
 *     responses:
 *       200:
 *         description: Lists retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/List'
 *             example:
 *               success: true
 *               data:
 *                 - id: "123e4567-e89b-12d3-a456-426614174000"
 *                   name: "Work Tasks"
 *                   description: "Tasks related to work projects"
 *                   color: "#3498db"
 *                   tasks_count: 5
 *                   created_at: "2025-07-09T15:26:11.939Z"
 *                   updated_at: "2025-07-09T15:26:11.939Z"
 *                 - id: "456e7890-e89b-12d3-a456-426614174000"
 *                   name: "Personal Tasks"
 *                   description: "Personal todo items"
 *                   color: "#e74c3c"
 *                   tasks_count: 3
 *                   created_at: "2025-07-09T15:26:11.939Z"
 *                   updated_at: "2025-07-09T15:26:11.939Z"
 *               meta:
 *                 total: 2
 *                 page: 1
 *                 limit: 10
 *                 total_pages: 1
 *                 has_next: false
 *                 has_prev: false
 *                 timestamp: "2025-07-09T15:26:11.939Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get(
  '/',
  generalRateLimit,
  optionalAuth,
  validateListQuery,
  listController.getAllLists
);

/**
 * @swagger
 * /api/v1/lists:
 *   post:
 *     summary: Create a new list
 *     description: Create a new todo list. Requires authentication.
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateListInput'
 *           examples:
 *             basic:
 *               summary: Basic list creation
 *               value:
 *                 name: "Work Tasks"
 *                 description: "Tasks related to work projects"
 *                 color: "#3498db"
 *             minimal:
 *               summary: Minimal list (name only)
 *               value:
 *                 name: "Shopping List"
 *     responses:
 *       201:
 *         description: List created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/List'
 *             example:
 *               success: true
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 name: "Work Tasks"
 *                 description: "Tasks related to work projects"
 *                 color: "#3498db"
 *                 tasks_count: 0
 *                 created_at: "2025-07-09T15:26:11.939Z"
 *                 updated_at: "2025-07-09T15:26:11.939Z"
 *               meta:
 *                 timestamp: "2025-07-09T15:26:11.939Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
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
 * @swagger
 * /api/v1/lists/{id}:
 *   get:
 *     summary: Get a specific list by ID
 *     description: Retrieve detailed information about a specific list by its UUID.
 *     tags: [Lists]
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/UuidParam'
 *     responses:
 *       200:
 *         description: List retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/List'
 *             example:
 *               success: true
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 name: "Work Tasks"
 *                 description: "Tasks related to work projects"
 *                 color: "#3498db"
 *                 tasks_count: 5
 *                 created_at: "2025-07-09T15:26:11.939Z"
 *                 updated_at: "2025-07-09T15:26:11.939Z"
 *               meta:
 *                 timestamp: "2025-07-09T15:26:11.939Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get(
  '/:id',
  generalRateLimit,
  optionalAuth,
  validateListParams,
  listController.getListById
);

/**
 * @swagger
 * /api/v1/lists/{id}:
 *   put:
 *     summary: Update an existing list
 *     description: Update list information. Requires authentication and user role.
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UuidParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateListInput'
 *           examples:
 *             full_update:
 *               summary: Complete list update
 *               value:
 *                 name: "Updated Work Tasks"
 *                 description: "Updated list of work-related tasks and projects"
 *                 color: "#e74c3c"
 *             partial_update:
 *               summary: Partial update (name only)
 *               value:
 *                 name: "Renamed List"
 *     responses:
 *       200:
 *         description: List updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/List'
 *             example:
 *               success: true
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 name: "Updated Work Tasks"
 *                 description: "Updated list of work-related tasks and projects"
 *                 color: "#e74c3c"
 *                 tasks_count: 5
 *                 created_at: "2025-07-09T15:26:11.939Z"
 *                 updated_at: "2025-07-09T16:30:00.000Z"
 *               meta:
 *                 timestamp: "2025-07-09T16:30:00.000Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
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
 * @swagger
 * /api/v1/lists/{id}:
 *   delete:
 *     summary: Delete a list and all its tasks
 *     description: |
 *       Permanently delete a list and all associated tasks. This action cannot be undone.
 *       Requires authentication and user role.
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UuidParam'
 *     responses:
 *       200:
 *         description: List deleted successfully
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
 *                           example: "List and all associated tasks deleted successfully"
 *                         deleted_tasks_count:
 *                           type: number
 *                           example: 5
 *             example:
 *               success: true
 *               data:
 *                 message: "List and all associated tasks deleted successfully"
 *                 deleted_tasks_count: 5
 *               meta:
 *                 timestamp: "2025-07-09T16:30:00.000Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
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
 * @swagger
 * /api/v1/lists/{id}/tasks:
 *   get:
 *     summary: Get all tasks for a specific list
 *     description: |
 *       Retrieve all tasks belonging to a specific list with pagination, filtering, and sorting options.
 *     tags: [Lists]
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/UuidParam'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortFieldParam'
 *       - $ref: '#/components/parameters/SortOrderParam'
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *         description: Filter by task status
 *       - name: priority
 *         in: query
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by task priority
 *       - name: deadline_from
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tasks with deadline after this date
 *       - name: deadline_to
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tasks with deadline before this date
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *             example:
 *               success: true
 *               data:
 *                 - id: "789e0123-e89b-12d3-a456-426614174000"
 *                   list_id: "123e4567-e89b-12d3-a456-426614174000"
 *                   title: "Complete API Documentation"
 *                   description: "Write comprehensive API documentation with examples"
 *                   deadline: "2025-07-15T23:59:59.000Z"
 *                   priority: "high"
 *                   status: "pending"
 *                   completed_at: null
 *                   created_at: "2025-07-09T15:26:11.939Z"
 *                   updated_at: "2025-07-09T15:26:11.939Z"
 *               meta:
 *                 total: 1
 *                 page: 1
 *                 limit: 10
 *                 total_pages: 1
 *                 has_next: false
 *                 has_prev: false
 *                 timestamp: "2025-07-09T16:30:00.000Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
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
