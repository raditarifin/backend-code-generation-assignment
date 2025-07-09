import { 
  Task, 
  CreateTaskInput, 
  UpdateTaskInput, 
  TaskFilterParams, 
  SortParams,
  TaskStatus,
  TaskPriority,
  ApiResponseCode
} from '../models';
import { 
  createTaskSchema,
  updateTaskSchema,
  completeTaskSchema,
  paginationSchema,
  taskFilterSchema
} from '../models/validation';
import { taskRepository, listRepository } from '../repositories';
import { logger } from '../utils/logger';
import { isValidUuid } from '../utils/idGenerator';

/**
 * Business logic service for Task operations
 * Orchestrates repository calls and implements business rules
 */
export class TaskService {
  /**
   * Get all tasks with filtering, sorting, and pagination
   */
  async getAllTasks(
    filters?: TaskFilterParams,
    sort?: SortParams,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    tasks: Task[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    try {
      // Validate pagination parameters
      const { error: paginationError } = paginationSchema.validate({ page, limit });
      if (paginationError) {
        const error = new Error(`Invalid pagination parameters: ${paginationError.details[0]?.message}`);
        (error as any).code = ApiResponseCode.VALIDATION_ERROR;
        throw error;
      }

      // Validate filter parameters
      if (filters) {
        const { error: filterError } = taskFilterSchema.validate(filters);
        if (filterError) {
          const error = new Error(`Invalid filter parameters: ${filterError.details[0]?.message}`);
          (error as any).code = ApiResponseCode.VALIDATION_ERROR;
          throw error;
        }
      }

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Get tasks from repository
      const { tasks, total } = await taskRepository.getAllTasks(filters, sort, limit, offset);

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      logger.info('Retrieved tasks successfully', {
        total,
        returned: tasks.length,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
        filters,
        sort,
      });

      return {
        tasks,
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
      };
    } catch (error) {
      logger.error('Error in getAllTasks service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
        sort,
        page,
        limit,
      });
      throw error;
    }
  }

  /**
   * Get task by ID with enhanced error handling
   */
  async getTaskById(id: string): Promise<Task> {
    try {
      // Validate UUID format
      if (!isValidUuid(id)) {
        const error = new Error(`Invalid task ID format: ${id}`);
        (error as any).code = ApiResponseCode.VALIDATION_ERROR;
        throw error;
      }

      const task = await taskRepository.getTaskById(id);
      
      if (!task) {
        const error = new Error(`Task with ID '${id}' not found`);
        (error as any).code = ApiResponseCode.NOT_FOUND;
        throw error;
      }

      logger.debug('Retrieved task by ID successfully', {
        taskId: id,
        title: task.title,
        listId: task.list_id,
        status: task.status,
        priority: task.priority,
      });

      return task;
    } catch (error) {
      logger.error('Error in getTaskById service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId: id,
      });
      throw error;
    }
  }

  /**
   * Create a new task with comprehensive validation
   */
  async createTask(input: CreateTaskInput): Promise<Task> {
    try {
      // Validate input data
      const { error, value } = createTaskSchema.validate(input);
      if (error) {
        const validationError = new Error(`Validation failed: ${error.details[0]?.message}`);
        (validationError as any).code = ApiResponseCode.VALIDATION_ERROR;
        (validationError as any).details = error.details;
        throw validationError;
      }

      // Additional business logic validation
      await this.validateTaskBusinessRules(value);

      // Create task through repository
      const task = await taskRepository.createTask(value);

      logger.info('Task created successfully via service', {
        taskId: task.id,
        title: task.title,
        listId: task.list_id,
        priority: task.priority,
        deadline: task.deadline?.toISOString(),
      });

      return task;
    } catch (error) {
      logger.error('Error in createTask service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        input,
      });
      throw error;
    }
  }

  /**
   * Update an existing task with validation
   */
  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    try {
      // Validate UUID format
      if (!isValidUuid(id)) {
        const error = new Error(`Invalid task ID format: ${id}`);
        (error as any).code = ApiResponseCode.VALIDATION_ERROR;
        throw error;
      }

      // Validate input data
      const { error, value } = updateTaskSchema.validate(input);
      if (error) {
        const validationError = new Error(`Validation failed: ${error.details[0]?.message}`);
        (validationError as any).code = ApiResponseCode.VALIDATION_ERROR;
        (validationError as any).details = error.details;
        throw validationError;
      }

      // Check if task exists
      const existingTask = await taskRepository.getTaskById(id);
      if (!existingTask) {
        const error = new Error(`Task with ID '${id}' not found`);
        (error as any).code = ApiResponseCode.NOT_FOUND;
        throw error;
      }

      // Additional business logic validation for updates
      await this.validateTaskUpdateBusinessRules(existingTask, value);

      // Update task through repository
      const updatedTask = await taskRepository.updateTask(id, value);
      
      if (!updatedTask) {
        const error = new Error(`Failed to update task with ID '${id}'`);
        (error as any).code = ApiResponseCode.INTERNAL_ERROR;
        throw error;
      }

      logger.info('Task updated successfully via service', {
        taskId: id,
        updates: value,
        newTitle: updatedTask.title,
        newStatus: updatedTask.status,
        listChanged: value.list_id && value.list_id !== existingTask.list_id,
      });

      return updatedTask;
    } catch (error) {
      logger.error('Error in updateTask service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId: id,
        input,
      });
      throw error;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<void> {
    try {
      // Validate UUID format
      if (!isValidUuid(id)) {
        const error = new Error(`Invalid task ID format: ${id}`);
        (error as any).code = ApiResponseCode.VALIDATION_ERROR;
        throw error;
      }

      // Check if task exists
      const existingTask = await taskRepository.getTaskById(id);
      if (!existingTask) {
        const error = new Error(`Task with ID '${id}' not found`);
        (error as any).code = ApiResponseCode.NOT_FOUND;
        throw error;
      }

      // Delete the task
      const success = await taskRepository.deleteTask(id);
      
      if (!success) {
        const error = new Error(`Failed to delete task with ID '${id}'`);
        (error as any).code = ApiResponseCode.INTERNAL_ERROR;
        throw error;
      }

      logger.info('Task deleted successfully via service', {
        taskId: id,
        title: existingTask.title,
        listId: existingTask.list_id,
        status: existingTask.status,
      });
    } catch (error) {
      logger.error('Error in deleteTask service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId: id,
      });
      throw error;
    }
  }

  /**
   * Complete a task with business logic
   */
  async completeTask(id: string): Promise<Task> {
    try {
      // Validate UUID format
      if (!isValidUuid(id)) {
        const error = new Error(`Invalid task ID format: ${id}`);
        (error as any).code = ApiResponseCode.VALIDATION_ERROR;
        throw error;
      }

      // Check if task exists
      const existingTask = await taskRepository.getTaskById(id);
      if (!existingTask) {
        const error = new Error(`Task with ID '${id}' not found`);
        (error as any).code = ApiResponseCode.NOT_FOUND;
        throw error;
      }

      // Check if task is already completed
      if (existingTask.status === TaskStatus.COMPLETED) {
        logger.debug('Task already completed', { taskId: id });
        return existingTask;
      }

      // Complete task through repository
      const completedTask = await taskRepository.completeTask(id);
      
      if (!completedTask) {
        const error = new Error(`Failed to complete task with ID '${id}'`);
        (error as any).code = ApiResponseCode.INTERNAL_ERROR;
        throw error;
      }

      logger.info('Task completed successfully via service', {
        taskId: id,
        title: existingTask.title,
        listId: existingTask.list_id,
        completedAt: completedTask.completed_at?.toISOString(),
      });

      return completedTask;
    } catch (error) {
      logger.error('Error in completeTask service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId: id,
      });
      throw error;
    }
  }

  /**
   * Uncomplete a task (mark as pending)
   */
  async uncompleteTask(id: string): Promise<Task> {
    try {
      // Validate UUID format
      if (!isValidUuid(id)) {
        const error = new Error(`Invalid task ID format: ${id}`);
        (error as any).code = ApiResponseCode.VALIDATION_ERROR;
        throw error;
      }

      // Check if task exists
      const existingTask = await taskRepository.getTaskById(id);
      if (!existingTask) {
        const error = new Error(`Task with ID '${id}' not found`);
        (error as any).code = ApiResponseCode.NOT_FOUND;
        throw error;
      }

      // Check if task is already pending
      if (existingTask.status === TaskStatus.PENDING) {
        logger.debug('Task already pending', { taskId: id });
        return existingTask;
      }

      // Uncomplete task through repository
      const uncompletedTask = await taskRepository.uncompleteTask(id);
      
      if (!uncompletedTask) {
        const error = new Error(`Failed to uncomplete task with ID '${id}'`);
        (error as any).code = ApiResponseCode.INTERNAL_ERROR;
        throw error;
      }

      logger.info('Task uncompleted successfully via service', {
        taskId: id,
        title: existingTask.title,
        listId: existingTask.list_id,
      });

      return uncompletedTask;
    } catch (error) {
      logger.error('Error in uncompleteTask service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId: id,
      });
      throw error;
    }
  }

  /**
   * Get tasks due this week
   */
  async getTasksDueThisWeek(
    filters?: Omit<TaskFilterParams, 'deadline_from' | 'deadline_to'>,
    sort?: SortParams,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    tasks: Task[];
    total: number;
    weekStart: Date;
    weekEnd: Date;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    try {
      // Calculate this week's date range
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
      weekEnd.setHours(23, 59, 59, 999);

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Get tasks in deadline range
      const { tasks, total } = await taskRepository.getTasksByDeadlineRange(
        weekStart,
        weekEnd,
        filters,
        sort || { field: 'deadline', order: 'asc' },
        limit,
        offset
      );

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      logger.info('Retrieved tasks due this week', {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        total,
        returned: tasks.length,
        page,
        limit,
        totalPages,
        filters,
        sort,
      });

      return {
        tasks,
        total,
        weekStart,
        weekEnd,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
      };
    } catch (error) {
      logger.error('Error in getTasksDueThisWeek service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
        sort,
        page,
        limit,
      });
      throw error;
    }
  }

  /**
   * Get tasks ordered by deadline
   */
  async getTasksByDeadline(
    filters?: TaskFilterParams,
    page: number = 1,
    limit: number = 50,
    includeNullDeadlines: boolean = false
  ): Promise<{
    tasks: Task[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    try {
      // Get tasks with deadline sorting
      const sort: SortParams = { field: 'deadline', order: 'asc' };
      
      let taskFilters = filters;
      if (!includeNullDeadlines) {
        // Add filter to exclude tasks without deadlines
        taskFilters = {
          ...filters,
          deadline_from: new Date('1900-01-01'), // Very old date to include all tasks with deadlines
        };
      }

      const result = await this.getAllTasks(taskFilters, sort, page, limit);

      logger.info('Retrieved tasks ordered by deadline', {
        total: result.total,
        returned: result.tasks.length,
        page,
        limit,
        includeNullDeadlines,
        filters,
      });

      return result;
    } catch (error) {
      logger.error('Error in getTasksByDeadline service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
        page,
        limit,
        includeNullDeadlines,
      });
      throw error;
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(
    filters?: Omit<TaskFilterParams, 'deadline_to' | 'status'>,
    sort?: SortParams,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    tasks: Task[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    try {
      const now = new Date();
      
      // Create filter for overdue tasks
      const overdueFilters: TaskFilterParams = {
        ...filters,
        deadline_to: now,
        status: TaskStatus.PENDING, // Only pending tasks can be overdue
      };

      const result = await this.getAllTasks(
        overdueFilters,
        sort || { field: 'deadline', order: 'asc' },
        page,
        limit
      );

      logger.info('Retrieved overdue tasks', {
        cutoffDate: now.toISOString(),
        total: result.total,
        returned: result.tasks.length,
        page,
        limit,
        filters,
      });

      return result;
    } catch (error) {
      logger.error('Error in getOverdueTasks service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
        sort,
        page,
        limit,
      });
      throw error;
    }
  }

  /**
   * Get tasks by priority with smart sorting
   */
  async getTasksByPriority(
    priority: TaskPriority,
    filters?: Omit<TaskFilterParams, 'priority'>,
    sort?: SortParams,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    tasks: Task[];
    total: number;
    priority: TaskPriority;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    try {
      // Create filter for priority
      const priorityFilters: TaskFilterParams = {
        ...filters,
        priority,
      };

      const result = await this.getAllTasks(
        priorityFilters,
        sort || { field: 'deadline', order: 'asc' }, // Default sort by deadline for priority tasks
        page,
        limit
      );

      logger.info('Retrieved tasks by priority', {
        priority,
        total: result.total,
        returned: result.tasks.length,
        page,
        limit,
        filters,
      });

      return {
        ...result,
        priority,
      };
    } catch (error) {
      logger.error('Error in getTasksByPriority service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        priority,
        filters,
        sort,
        page,
        limit,
      });
      throw error;
    }
  }

  /**
   * Bulk update tasks status
   */
  async bulkUpdateTasksStatus(
    taskIds: string[],
    status: TaskStatus
  ): Promise<{
    updated: Task[];
    failed: { id: string; error: string }[];
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    try {
      const updated: Task[] = [];
      const failed: { id: string; error: string }[] = [];

      for (const taskId of taskIds) {
        try {
          if (status === TaskStatus.COMPLETED) {
            const task = await this.completeTask(taskId);
            updated.push(task);
          } else {
            const task = await this.updateTask(taskId, { status });
            updated.push(task);
          }
        } catch (error) {
          failed.push({
            id: taskId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const summary = {
        total: taskIds.length,
        successful: updated.length,
        failed: failed.length,
      };

      logger.info('Bulk updated tasks status', {
        status,
        summary,
        failedIds: failed.map(f => f.id),
      });

      return { updated, failed, summary };
    } catch (error) {
      logger.error('Error in bulkUpdateTasksStatus service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        taskIds,
        status,
      });
      throw error;
    }
  }

  /**
   * Validate business rules for task creation
   */
  private async validateTaskBusinessRules(input: CreateTaskInput): Promise<void> {
    // Validate list exists
    const listExists = await listRepository.listExists(input.list_id);
    if (!listExists) {
      const error = new Error(`List with ID '${input.list_id}' does not exist`);
      (error as any).code = ApiResponseCode.NOT_FOUND;
      throw error;
    }

    // Validate deadline is in the future (if provided)
    if (input.deadline) {
      const deadline = new Date(input.deadline);
      const now = new Date();
      if (deadline <= now) {
        const error = new Error('Task deadline must be in the future');
        (error as any).code = ApiResponseCode.VALIDATION_ERROR;
        throw error;
      }
    }

    // Additional business rules can be added here
    // For example: maximum tasks per list, task title uniqueness within list, etc.
  }

  /**
   * Validate business rules for task updates
   */
  private async validateTaskUpdateBusinessRules(existingTask: Task, input: UpdateTaskInput): Promise<void> {
    // Validate list exists if list_id is being updated
    if (input.list_id && input.list_id !== existingTask.list_id) {
      const listExists = await listRepository.listExists(input.list_id);
      if (!listExists) {
        const error = new Error(`Target list with ID '${input.list_id}' does not exist`);
        (error as any).code = ApiResponseCode.NOT_FOUND;
        throw error;
      }
    }

    // Validate deadline rules
    if (input.deadline !== undefined) {
      if (input.deadline) {
        const deadline = new Date(input.deadline);
        const now = new Date();
        
        // Only enforce future deadline for pending tasks
        if (existingTask.status === TaskStatus.PENDING || input.status === TaskStatus.PENDING) {
          if (deadline <= now) {
            const error = new Error('Task deadline must be in the future for pending tasks');
            (error as any).code = ApiResponseCode.VALIDATION_ERROR;
            throw error;
          }
        }
      }
    }

    // Additional business rules can be added here
  }
}

// Create and export singleton instance
export const taskService = new TaskService();

export default taskService;
