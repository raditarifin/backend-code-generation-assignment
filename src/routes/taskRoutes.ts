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
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Get all tasks
 *     description: Retrieve all tasks with optional filtering, sorting, and pagination
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: query
 *         name: listId
 *         schema:
 *           type: string
 *         description: Filter tasks by list ID
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter tasks by priority
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed]
 *         description: Filter tasks by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search tasks by title or description
 *       - in: query
 *         name: dueDateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tasks due from this date
 *       - in: query
 *         name: dueDateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tasks due until this date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, dueDate, priority, title]
 *         description: Sort tasks by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 filters:
 *                   type: object
 *                   description: Applied filters
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task
 *     description: Create a new task in the system
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *                   example: "Task created successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
 * @swagger
 * /api/v1/tasks/due-this-week:
 *   get:
 *     summary: Get tasks due this week
 *     description: Retrieve tasks due within the next 7 days
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, dueDate, priority, title]
 *         description: Sort tasks by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Tasks due this week retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 count:
 *                   type: integer
 *                   example: 5
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/due-this-week',
  generalRateLimit,
  optionalAuth,
  validateTasksDueThisWeekQuery,
  taskController.getTasksDueThisWeek
);

/**
 * @swagger
 * /api/v1/tasks/by-deadline:
 *   get:
 *     summary: Get tasks grouped by deadline
 *     description: Retrieve tasks grouped by their deadline dates
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: query
 *         name: dueDateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tasks due from this date
 *       - in: query
 *         name: dueDateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tasks due until this date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, dueDate, priority, title]
 *         description: Sort tasks by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Tasks grouped by deadline retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Task'
 *                 totalTasks:
 *                   type: integer
 *                   example: 10
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
 * @swagger
 * /api/v1/tasks/overdue:
 *   get:
 *     summary: Get overdue tasks
 *     description: Retrieve tasks that are past their deadline and not completed
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, dueDate, priority, title]
 *         description: Sort tasks by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Overdue tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 count:
 *                   type: integer
 *                   example: 3
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/overdue',
  generalRateLimit,
  optionalAuth,
  validateOverdueTasksQuery,
  taskController.getOverdueTasks
);

/**
 * @swagger
 * /api/v1/tasks/priority/{priority}:
 *   get:
 *     summary: Get tasks by priority
 *     description: Retrieve tasks filtered by priority level
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: priority
 *         required: true
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Priority level to filter by
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, dueDate, priority, title]
 *         description: Sort tasks by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Tasks filtered by priority retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 priority:
 *                   type: string
 *                   example: "high"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/priority/:priority',
  generalRateLimit,
  optionalAuth,
  validateTasksByPriorityParams,
  taskController.getTasksByPriority
);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     summary: Get a specific task
 *     description: Retrieve a specific task by its ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task UUID
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/:id',
  generalRateLimit,
  optionalAuth,
  validateTaskParams,
  taskController.getTaskById
);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     description: Update an existing task by its ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskRequest'
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *                   example: "Task updated successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     description: Delete a task by its ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task UUID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Task deleted successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
 * @swagger
 * /api/v1/tasks/{id}/complete:
 *   patch:
 *     summary: Mark task as completed
 *     description: Mark a task as completed by its ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task UUID
 *     responses:
 *       200:
 *         description: Task marked as completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *                   example: "Task marked as completed"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
 * @swagger
 * /api/v1/tasks/{id}/uncomplete:
 *   patch:
 *     summary: Mark task as pending
 *     description: Mark a task as pending (uncomplete) by its ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task UUID
 *     responses:
 *       200:
 *         description: Task marked as pending successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *                   example: "Task marked as pending"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
