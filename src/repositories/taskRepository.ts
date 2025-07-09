import { 
  Task, 
  CreateTaskInput, 
  UpdateTaskInput, 
  TaskFilterParams, 
  SortParams, 
  TaskStatus, 
  TaskPriority 
} from '../models';
import { memoryStore } from '../storage';
import { generateId } from '../utils/idGenerator';
import { logger } from '../utils/logger';

/**
 * Repository class for Task entity operations
 * Provides data access abstraction over the memory store
 */
export class TaskRepository {
  /**
   * Get all tasks with optional filtering and sorting
   */
  async getAllTasks(
    filters?: TaskFilterParams,
    sort?: SortParams,
    limit?: number,
    offset?: number
  ): Promise<{ tasks: Task[]; total: number }> {
    try {
      let tasks = memoryStore.getAllTasks();
      const originalTotal = tasks.length;

      // Apply filters
      if (filters) {
        tasks = this.applyFilters(tasks, filters);
      }

      const filteredTotal = tasks.length;

      // Apply sorting
      if (sort) {
        tasks = this.sortTasks(tasks, sort);
      } else {
        // Default sort by created_at descending
        tasks = this.sortTasks(tasks, { field: 'created_at', order: 'desc' });
      }

      // Apply pagination
      if (limit !== undefined && offset !== undefined) {
        tasks = tasks.slice(offset, offset + limit);
      }

      logger.debug('Retrieved tasks', {
        originalTotal,
        filteredTotal,
        returned: tasks.length,
        filters,
        sort,
        limit,
        offset,
      });

      return { tasks, total: filteredTotal };
    } catch (error) {
      logger.error('Error getting all tasks', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        filters, 
        sort 
      });
      throw error;
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    try {
      const task = memoryStore.getTaskById(id);
      
      if (!task) {
        logger.debug('Task not found', { taskId: id });
        return null;
      }

      logger.debug('Retrieved task by ID', { taskId: id, title: task.title, listId: task.list_id });
      return task;
    } catch (error) {
      logger.error('Error getting task by ID', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        taskId: id 
      });
      throw error;
    }
  }

  /**
   * Get tasks by list ID
   */
  async getTasksByListId(
    listId: string,
    filters?: Omit<TaskFilterParams, 'list_id'>,
    sort?: SortParams,
    limit?: number,
    offset?: number
  ): Promise<{ tasks: Task[]; total: number }> {
    try {
      let tasks = memoryStore.getTasksByListId(listId);
      const originalTotal = tasks.length;

      // Apply additional filters (excluding list_id which is already applied)
      if (filters) {
        tasks = this.applyFilters(tasks, filters);
      }

      const filteredTotal = tasks.length;

      // Apply sorting
      if (sort) {
        tasks = this.sortTasks(tasks, sort);
      } else {
        // Default sort by created_at descending
        tasks = this.sortTasks(tasks, { field: 'created_at', order: 'desc' });
      }

      // Apply pagination
      if (limit !== undefined && offset !== undefined) {
        tasks = tasks.slice(offset, offset + limit);
      }

      logger.debug('Retrieved tasks by list ID', {
        listId,
        originalTotal,
        filteredTotal,
        returned: tasks.length,
        filters,
        sort,
        limit,
        offset,
      });

      return { tasks, total: filteredTotal };
    } catch (error) {
      logger.error('Error getting tasks by list ID', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        listId, 
        filters, 
        sort 
      });
      throw error;
    }
  }

  /**
   * Create a new task
   */
  async createTask(input: CreateTaskInput): Promise<Task> {
    try {
      // Verify list exists
      const listExists = memoryStore.getListById(input.list_id);
      if (!listExists) {
        const error = new Error(`List with ID '${input.list_id}' does not exist`);
        logger.warn('Attempted to create task for non-existent list', { 
          listId: input.list_id,
          taskTitle: input.title 
        });
        throw error;
      }

      const now = new Date();
      const task: Task = {
        id: generateId(),
        list_id: input.list_id,
        title: input.title.trim(),
        ...(input.description && { description: input.description.trim() }),
        ...(input.deadline && { deadline: new Date(input.deadline) }),
        priority: input.priority || TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        created_at: now,
        updated_at: now,
      };

      memoryStore.createTask(task);

      logger.info('Task created successfully', {
        taskId: task.id,
        listId: task.list_id,
        title: task.title,
        priority: task.priority,
        deadline: task.deadline?.toISOString(),
      });

      return task;
    } catch (error) {
      logger.error('Error creating task', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        input 
      });
      throw error;
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
    try {
      // Check if task exists
      const existingTask = memoryStore.getTaskById(id);
      if (!existingTask) {
        logger.debug('Task not found for update', { taskId: id });
        return null;
      }

      // Verify list exists if list_id is being updated
      if (input.list_id && input.list_id !== existingTask.list_id) {
        const listExists = memoryStore.getListById(input.list_id);
        if (!listExists) {
          const error = new Error(`List with ID '${input.list_id}' does not exist`);
          logger.warn('Attempted to move task to non-existent list', { 
            taskId: id,
            currentListId: existingTask.list_id,
            newListId: input.list_id 
          });
          throw error;
        }
      }

      // Prepare update data
      const updateData: Partial<Task> = {
        ...input,
        updated_at: new Date(),
      };

      // Trim string fields
      if (updateData.title) {
        updateData.title = updateData.title.trim();
      }
      if (updateData.description) {
        updateData.description = updateData.description.trim();
      }

      // Convert deadline string to Date if provided
      if (input.deadline) {
        updateData.deadline = new Date(input.deadline);
      }

      const success = memoryStore.updateTask(id, updateData);
      
      if (!success) {
        logger.error('Failed to update task in memory store', { taskId: id, updateData });
        return null;
      }

      const updatedTask = memoryStore.getTaskById(id);
      
      logger.info('Task updated successfully', {
        taskId: id,
        updates: updateData,
        newTitle: updatedTask?.title,
        newStatus: updatedTask?.status,
        listChanged: input.list_id && input.list_id !== existingTask.list_id,
      });

      return updatedTask || null;
    } catch (error) {
      logger.error('Error updating task', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        taskId: id, 
        input 
      });
      throw error;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<boolean> {
    try {
      // Check if task exists
      const existingTask = memoryStore.getTaskById(id);
      if (!existingTask) {
        logger.debug('Task not found for deletion', { taskId: id });
        return false;
      }

      const success = memoryStore.deleteTask(id);
      
      if (success) {
        logger.info('Task deleted successfully', {
          taskId: id,
          title: existingTask.title,
          listId: existingTask.list_id,
          status: existingTask.status,
        });
      } else {
        logger.error('Failed to delete task from memory store', { taskId: id });
      }

      return success;
    } catch (error) {
      logger.error('Error deleting task', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        taskId: id 
      });
      throw error;
    }
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(
    status: TaskStatus,
    filters?: Omit<TaskFilterParams, 'status'>,
    sort?: SortParams,
    limit?: number,
    offset?: number
  ): Promise<{ tasks: Task[]; total: number }> {
    try {
      let tasks = memoryStore.getTasksByStatus(status);
      const originalTotal = tasks.length;

      // Apply additional filters (excluding status which is already applied)
      if (filters) {
        tasks = this.applyFilters(tasks, filters);
      }

      const filteredTotal = tasks.length;

      // Apply sorting
      if (sort) {
        tasks = this.sortTasks(tasks, sort);
      } else {
        // Default sort by created_at descending
        tasks = this.sortTasks(tasks, { field: 'created_at', order: 'desc' });
      }

      // Apply pagination
      if (limit !== undefined && offset !== undefined) {
        tasks = tasks.slice(offset, offset + limit);
      }

      logger.debug('Retrieved tasks by status', {
        status,
        originalTotal,
        filteredTotal,
        returned: tasks.length,
        filters,
        sort,
        limit,
        offset,
      });

      return { tasks, total: filteredTotal };
    } catch (error) {
      logger.error('Error getting tasks by status', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        status, 
        filters, 
        sort 
      });
      throw error;
    }
  }

  /**
   * Get tasks by deadline range
   */
  async getTasksByDeadlineRange(
    fromDate: Date,
    toDate: Date,
    filters?: Omit<TaskFilterParams, 'deadline_from' | 'deadline_to'>,
    sort?: SortParams,
    limit?: number,
    offset?: number
  ): Promise<{ tasks: Task[]; total: number }> {
    try {
      let tasks = memoryStore.getTasksByDeadlineRange(fromDate, toDate);
      const originalTotal = tasks.length;

      // Apply additional filters
      if (filters) {
        tasks = this.applyFilters(tasks, filters);
      }

      const filteredTotal = tasks.length;

      // Apply sorting (default to deadline ascending for deadline queries)
      if (sort) {
        tasks = this.sortTasks(tasks, sort);
      } else {
        tasks = this.sortTasks(tasks, { field: 'deadline', order: 'asc' });
      }

      // Apply pagination
      if (limit !== undefined && offset !== undefined) {
        tasks = tasks.slice(offset, offset + limit);
      }

      logger.debug('Retrieved tasks by deadline range', {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
        originalTotal,
        filteredTotal,
        returned: tasks.length,
        filters,
        sort,
        limit,
        offset,
      });

      return { tasks, total: filteredTotal };
    } catch (error) {
      logger.error('Error getting tasks by deadline range', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        fromDate: fromDate.toISOString(), 
        toDate: toDate.toISOString(), 
        filters, 
        sort 
      });
      throw error;
    }
  }

  /**
   * Complete a task
   */
  async completeTask(id: string): Promise<Task | null> {
    try {
      const existingTask = memoryStore.getTaskById(id);
      if (!existingTask) {
        logger.debug('Task not found for completion', { taskId: id });
        return null;
      }

      if (existingTask.status === TaskStatus.COMPLETED) {
        logger.debug('Task already completed', { taskId: id });
        return existingTask;
      }

      const updateData: Partial<Task> = {
        status: TaskStatus.COMPLETED,
        completed_at: new Date(),
        updated_at: new Date(),
      };

      const success = memoryStore.updateTask(id, updateData);
      
      if (!success) {
        logger.error('Failed to complete task in memory store', { taskId: id });
        return null;
      }

      const updatedTask = memoryStore.getTaskById(id);
      
      logger.info('Task completed successfully', {
        taskId: id,
        title: existingTask.title,
        listId: existingTask.list_id,
        completedAt: updateData.completed_at?.toISOString(),
      });

      return updatedTask || null;
    } catch (error) {
      logger.error('Error completing task', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        taskId: id 
      });
      throw error;
    }
  }

  /**
   * Uncomplete a task (mark as pending)
   */
  async uncompleteTask(id: string): Promise<Task | null> {
    try {
      const existingTask = memoryStore.getTaskById(id);
      if (!existingTask) {
        logger.debug('Task not found for uncompletion', { taskId: id });
        return null;
      }

      if (existingTask.status === TaskStatus.PENDING) {
        logger.debug('Task already pending', { taskId: id });
        return existingTask;
      }

      const updateData: Partial<Task> = {
        status: TaskStatus.PENDING,
        updated_at: new Date(),
      };

      // Remove completed_at by creating new object without it
      const taskWithoutCompletedAt = { ...existingTask, ...updateData };
      delete taskWithoutCompletedAt.completed_at;

      const success = memoryStore.updateTask(id, taskWithoutCompletedAt);
      
      if (!success) {
        logger.error('Failed to uncomplete task in memory store', { taskId: id });
        return null;
      }

      const updatedTask = memoryStore.getTaskById(id);
      
      logger.info('Task uncompleted successfully', {
        taskId: id,
        title: existingTask.title,
        listId: existingTask.list_id,
      });

      return updatedTask || null;
    } catch (error) {
      logger.error('Error uncompleting task', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        taskId: id 
      });
      throw error;
    }
  }

  /**
   * Check if a task exists
   */
  async taskExists(id: string): Promise<boolean> {
    try {
      const task = memoryStore.getTaskById(id);
      return task !== undefined;
    } catch (error) {
      logger.error('Error checking if task exists', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        taskId: id 
      });
      throw error;
    }
  }

  /**
   * Get tasks count
   */
  async getTasksCount(filters?: TaskFilterParams): Promise<number> {
    try {
      const { total } = await this.getAllTasks(filters);
      return total;
    } catch (error) {
      logger.error('Error getting tasks count', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        filters 
      });
      throw error;
    }
  }

  /**
   * Apply filters to tasks array
   */
  private applyFilters(tasks: Task[], filters: Partial<TaskFilterParams>): Task[] {
    return tasks.filter(task => {
      // List ID filter
      if (filters.list_id && task.list_id !== filters.list_id) {
        return false;
      }

      // Status filter
      if (filters.status && task.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      // Deadline range filter
      if (filters.deadline_from && task.deadline) {
        const from = new Date(filters.deadline_from);
        if (task.deadline < from) {
          return false;
        }
      }

      if (filters.deadline_to && task.deadline) {
        const to = new Date(filters.deadline_to);
        if (task.deadline > to) {
          return false;
        }
      }

      // Search filter (title and description)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(searchTerm);
        const descriptionMatch = task.description?.toLowerCase().includes(searchTerm) || false;
        
        if (!titleMatch && !descriptionMatch) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sort tasks based on sort parameters
   */
  private sortTasks(tasks: Task[], sort: SortParams): Task[] {
    return tasks.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created_at':
          comparison = a.created_at.getTime() - b.created_at.getTime();
          break;
        case 'updated_at':
          comparison = a.updated_at.getTime() - b.updated_at.getTime();
          break;
        case 'deadline':
          // Handle tasks without deadlines (put them at the end)
          if (!a.deadline && !b.deadline) comparison = 0;
          else if (!a.deadline) comparison = 1;
          else if (!b.deadline) comparison = -1;
          else comparison = a.deadline.getTime() - b.deadline.getTime();
          break;
        case 'priority':
          // Priority order: HIGH > MEDIUM > LOW
          const priorityOrder = { [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = a.created_at.getTime() - b.created_at.getTime();
      }

      return sort.order === 'desc' ? -comparison : comparison;
    });
  }
}

// Create and export singleton instance
export const taskRepository = new TaskRepository();

export default taskRepository;
