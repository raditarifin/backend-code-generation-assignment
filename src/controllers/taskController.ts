import { Request, Response, NextFunction } from 'express';
import { 
  CreateTaskInput, 
  UpdateTaskInput, 
  TaskFilterParams, 
  SortParams,
  TaskStatus,
  TaskPriority,
  ApiResponseCode
} from '../models';
import { taskService } from '../services';
import { logger } from '../utils/logger';
import { 
  createApiResponse,
  createValidationErrorResponse,
  ValidationError
} from '../models/responses';

/**
 * Controller for Task-related HTTP endpoints
 * Handles request/response cycle and delegates business logic to services
 */
export class TaskController {
  /**
   * GET /api/tasks
   * Get all tasks with optional filtering, sorting, and pagination
   */
  async getAllTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract query parameters
      const {
        list_id,
        status,
        priority,
        search,
        deadline_from,
        deadline_to,
        sort_field,
        sort_order,
        page = '1',
        limit = '10'
      } = req.query;

      // Parse pagination
      const pageNum = parseInt(String(page), 10);
      const limitNum = parseInt(String(limit), 10);

      // Validate pagination parameters
      if (isNaN(pageNum) || pageNum < 1) {
        const response = createValidationErrorResponse('Invalid page parameter', [
          { field: 'page', message: 'Page must be a positive integer' }
        ]);
        res.status(400).json(response);
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        const response = createValidationErrorResponse('Invalid limit parameter', [
          { field: 'limit', message: 'Limit must be between 1 and 100' }
        ]);
        res.status(400).json(response);
        return;
      }

      // Build filter parameters
      const filters: TaskFilterParams = {};
      if (list_id) filters.list_id = String(list_id);
      if (status) filters.status = String(status) as TaskStatus;
      if (priority) filters.priority = String(priority) as TaskPriority;
      if (search) filters.search = String(search);
      if (deadline_from) filters.deadline_from = new Date(String(deadline_from));
      if (deadline_to) filters.deadline_to = new Date(String(deadline_to));

      // Build sort parameters
      let sort: SortParams | undefined;
      if (sort_field) {
        sort = {
          field: String(sort_field) as any,
          order: (sort_order === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
        };
      }

      // Get tasks from service
      const result = await taskService.getAllTasks(filters, sort, pageNum, limitNum);

      // Create successful response
      const response = createApiResponse(
        ApiResponseCode.SUCCESS,
        'Tasks retrieved successfully',
        {
          tasks: result.tasks,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: result.hasNext,
            hasPrev: result.hasPrev
          }
        }
      );

      res.status(200).json(response);

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks/:id
   * Get a specific task by ID
   */
  async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response = createValidationErrorResponse('Invalid task ID', [
          { field: 'id', message: 'Task ID is required' }
        ]);
        res.status(400).json(response);
        return;
      }
      
      const task = await taskService.getTaskById(id);

      const response = createApiResponse(
        ApiResponseCode.SUCCESS,
        'Task retrieved successfully',
        { task }
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tasks
   * Create a new task
   */
  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: CreateTaskInput = req.body;
      const task = await taskService.createTask(input);

      const response = createApiResponse(
        ApiResponseCode.CREATED,
        'Task created successfully',
        { task }
      );

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/tasks/:id
   * Update an existing task
   */
  async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response = createValidationErrorResponse('Invalid task ID', [
          { field: 'id', message: 'Task ID is required' }
        ]);
        res.status(400).json(response);
        return;
      }
      
      const input: UpdateTaskInput = req.body;
      const task = await taskService.updateTask(id, input);

      const response = createApiResponse(
        ApiResponseCode.SUCCESS,
        'Task updated successfully',
        { task }
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/tasks/:id
   * Delete a task
   */
  async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response = createValidationErrorResponse('Invalid task ID', [
          { field: 'id', message: 'Task ID is required' }
        ]);
        res.status(400).json(response);
        return;
      }
      
      await taskService.deleteTask(id);

      const response = createApiResponse(
        ApiResponseCode.SUCCESS,
        'Task deleted successfully',
        null
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/tasks/:id/complete
   * Mark a task as completed
   */
  async completeTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response = createValidationErrorResponse('Invalid task ID', [
          { field: 'id', message: 'Task ID is required' }
        ]);
        res.status(400).json(response);
        return;
      }
      
      const task = await taskService.completeTask(id);

      const response = createApiResponse(
        ApiResponseCode.SUCCESS,
        'Task completed successfully',
        { task }
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/tasks/:id/uncomplete
   * Mark a task as pending (uncomplete)
   */
  async uncompleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response = createValidationErrorResponse('Invalid task ID', [
          { field: 'id', message: 'Task ID is required' }
        ]);
        res.status(400).json(response);
        return;
      }
      
      const task = await taskService.uncompleteTask(id);

      const response = createApiResponse(
        ApiResponseCode.SUCCESS,
        'Task marked as pending successfully',
        { task }
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks/due-this-week
   * Get tasks due this week
   */
  async getTasksDueThisWeek(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        list_id,
        status,
        priority,
        sort_field,
        sort_order,
        page = '1',
        limit = '50'
      } = req.query;

      // Parse pagination
      const pageNum = parseInt(String(page), 10);
      const limitNum = parseInt(String(limit), 10);

      // Validate pagination parameters
      if (isNaN(pageNum) || pageNum < 1) {
        const response = createValidationErrorResponse('Invalid page parameter', [
          { field: 'page', message: 'Page must be a positive integer' }
        ]);
        res.status(400).json(response);
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        const response = createValidationErrorResponse('Invalid limit parameter', [
          { field: 'limit', message: 'Limit must be between 1 and 100' }
        ]);
        res.status(400).json(response);
        return;
      }

      // Build filter parameters
      const filters: Omit<TaskFilterParams, 'deadline_from' | 'deadline_to'> = {};
      if (list_id) filters.list_id = String(list_id);
      if (status) filters.status = String(status) as TaskStatus;
      if (priority) filters.priority = String(priority) as TaskPriority;

      // Build sort parameters
      let sort: SortParams | undefined;
      if (sort_field) {
        sort = {
          field: String(sort_field) as any,
          order: (sort_order === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
        };
      }

      // Get tasks due this week from service
      const result = await taskService.getTasksDueThisWeek(filters, sort, pageNum, limitNum);

      const response = createApiResponse(
        ApiResponseCode.SUCCESS,
        'Tasks due this week retrieved successfully',
        {
          tasks: result.tasks,
          weekRange: {
            start: result.weekStart.toISOString(),
            end: result.weekEnd.toISOString()
          },
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: result.hasNext,
            hasPrev: result.hasPrev
          }
        }
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks/by-deadline
   * Get tasks ordered by deadline
   */
  async getTasksByDeadline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        list_id,
        status,
        priority,
        include_null_deadlines = 'false',
        page = '1',
        limit = '50'
      } = req.query;

      // Parse parameters
      const pageNum = parseInt(String(page), 10);
      const limitNum = parseInt(String(limit), 10);
      const includeNullDeadlines = String(include_null_deadlines).toLowerCase() === 'true';

      // Validate pagination parameters
      if (isNaN(pageNum) || pageNum < 1) {
        const response = createValidationErrorResponse('Invalid page parameter', [
          { field: 'page', message: 'Page must be a positive integer' }
        ]);
        res.status(400).json(response);
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        const response = createValidationErrorResponse('Invalid limit parameter', [
          { field: 'limit', message: 'Limit must be between 1 and 100' }
        ]);
        res.status(400).json(response);
        return;
      }

      // Build filter parameters
      const filters: TaskFilterParams = {};
      if (list_id) filters.list_id = String(list_id);
      if (status) filters.status = String(status) as TaskStatus;
      if (priority) filters.priority = String(priority) as TaskPriority;

      // Get tasks by deadline from service
      const result = await taskService.getTasksByDeadline(
        filters,
        pageNum,
        limitNum,
        includeNullDeadlines
      );

      const response = createApiResponse(
        ApiResponseCode.SUCCESS,
        'Tasks ordered by deadline retrieved successfully',
        {
          tasks: result.tasks,
          includeNullDeadlines,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: result.hasNext,
            hasPrev: result.hasPrev
          }
        }
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks/overdue
   * Get overdue tasks
   */
  async getOverdueTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        list_id,
        priority,
        sort_field,
        sort_order,
        page = '1',
        limit = '50'
      } = req.query;

      // Parse pagination
      const pageNum = parseInt(String(page), 10);
      const limitNum = parseInt(String(limit), 10);

      // Validate pagination parameters
      if (isNaN(pageNum) || pageNum < 1) {
        const response = createValidationErrorResponse('Invalid page parameter', [
          { field: 'page', message: 'Page must be a positive integer' }
        ]);
        res.status(400).json(response);
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        const response = createValidationErrorResponse('Invalid limit parameter', [
          { field: 'limit', message: 'Limit must be between 1 and 100' }
        ]);
        res.status(400).json(response);
        return;
      }

      // Build filter parameters
      const filters: Omit<TaskFilterParams, 'deadline_to' | 'status'> = {};
      if (list_id) filters.list_id = String(list_id);
      if (priority) filters.priority = String(priority) as TaskPriority;

      // Build sort parameters
      let sort: SortParams | undefined;
      if (sort_field) {
        sort = {
          field: String(sort_field) as any,
          order: (sort_order === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
        };
      }

      // Get overdue tasks from service
      const result = await taskService.getOverdueTasks(filters, sort, pageNum, limitNum);

      const response = createApiResponse(
        ApiResponseCode.SUCCESS,
        'Overdue tasks retrieved successfully',
        {
          tasks: result.tasks,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: result.hasNext,
            hasPrev: result.hasPrev
          }
        }
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks/by-priority/:priority
   * Get tasks by priority
   */
  async getTasksByPriority(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { priority } = req.params;
      const {
        list_id,
        status,
        sort_field,
        sort_order,
        page = '1',
        limit = '50'
      } = req.query;

      // Validate priority parameter
      if (!Object.values(TaskPriority).includes(priority as TaskPriority)) {
        const response = createValidationErrorResponse('Invalid priority parameter', [
          { field: 'priority', message: `Must be one of: ${Object.values(TaskPriority).join(', ')}` }
        ]);
        res.status(400).json(response);
        return;
      }

      // Parse pagination
      const pageNum = parseInt(String(page), 10);
      const limitNum = parseInt(String(limit), 10);

      // Validate pagination parameters
      if (isNaN(pageNum) || pageNum < 1) {
        const response = createValidationErrorResponse('Invalid page parameter', [
          { field: 'page', message: 'Page must be a positive integer' }
        ]);
        res.status(400).json(response);
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        const response = createValidationErrorResponse('Invalid limit parameter', [
          { field: 'limit', message: 'Limit must be between 1 and 100' }
        ]);
        res.status(400).json(response);
        return;
      }

      // Build filter parameters
      const filters: Omit<TaskFilterParams, 'priority'> = {};
      if (list_id) filters.list_id = String(list_id);
      if (status) filters.status = String(status) as TaskStatus;

      // Build sort parameters
      let sort: SortParams | undefined;
      if (sort_field) {
        sort = {
          field: String(sort_field) as any,
          order: (sort_order === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
        };
      }

      // Get tasks by priority from service
      const result = await taskService.getTasksByPriority(
        priority as TaskPriority,
        filters,
        sort,
        pageNum,
        limitNum
      );

      const response = createApiResponse(
        ApiResponseCode.SUCCESS,
        `Tasks with ${priority} priority retrieved successfully`,
        {
          tasks: result.tasks,
          priority: result.priority,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: result.hasNext,
            hasPrev: result.hasPrev
          }
        }
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

// Create and export singleton instance
export const taskController = new TaskController();

export default taskController;
