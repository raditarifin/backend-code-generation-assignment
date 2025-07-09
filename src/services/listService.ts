import { 
  List, 
  CreateListInput, 
  UpdateListInput, 
  ListFilterParams, 
  SortParams,
  ApiResponseCode
} from '../models';
import { 
  createListSchema,
  updateListSchema,
  paginationSchema,
  listFilterSchema
} from '../models/validation';
import { listRepository, taskRepository } from '../repositories';
import { logger } from '../utils/logger';
import { isValidUuid } from '../utils/idGenerator';

/**
 * Business logic service for List operations
 * Orchestrates repository calls and implements business rules
 */
export class ListService {
  /**
   * Get all lists with filtering, sorting, and pagination
   */
  async getAllLists(
    filters?: ListFilterParams,
    sort?: SortParams,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    lists: List[];
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
        const { error: filterError } = listFilterSchema.validate(filters);
        if (filterError) {
          const error = new Error(`Invalid filter parameters: ${filterError.details[0]?.message}`);
          (error as any).code = ApiResponseCode.VALIDATION_ERROR;
          throw error;
        }
      }

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Get lists from repository
      const { lists, total } = await listRepository.getAllLists(filters, sort, limit, offset);

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      logger.info('Retrieved lists successfully', {
        total,
        returned: lists.length,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
        filters,
        sort,
      });

      return {
        lists,
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
      };
    } catch (error) {
      logger.error('Error in getAllLists service', {
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
   * Get list by ID with enhanced error handling
   */
  async getListById(id: string): Promise<List> {
    try {
      // Validate UUID format
      if (!isValidUuid(id)) {
        const error = new Error(`Invalid list ID format: ${id}`);
        (error as any).code = ApiResponseCode.VALIDATION_ERROR;
        throw error;
      }

      const list = await listRepository.getListById(id);
      
      if (!list) {
        const error = new Error(`List with ID '${id}' not found`);
        (error as any).code = ApiResponseCode.NOT_FOUND;
        throw error;
      }

      logger.debug('Retrieved list by ID successfully', {
        listId: id,
        name: list.name,
        tasksCount: list.tasks_count,
      });

      return list;
    } catch (error) {
      logger.error('Error in getListById service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        listId: id,
      });
      throw error;
    }
  }

  /**
   * Create a new list with comprehensive validation
   */
  async createList(input: CreateListInput): Promise<List> {
    try {
      // Validate input data
      const { error, value } = createListSchema.validate(input);
      if (error) {
        const validationError = new Error(`Validation failed: ${error.details[0]?.message}`);
        (validationError as any).code = ApiResponseCode.VALIDATION_ERROR;
        (validationError as any).details = error.details;
        throw validationError;
      }

      // Additional business logic validation
      await this.validateListBusinessRules(value);

      // Create list through repository
      const list = await listRepository.createList(value);

      logger.info('List created successfully via service', {
        listId: list.id,
        name: list.name,
        description: list.description,
        color: list.color,
      });

      return list;
    } catch (error) {
      logger.error('Error in createList service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        input,
      });
      throw error;
    }
  }

  /**
   * Update an existing list with validation
   */
  async updateList(id: string, input: UpdateListInput): Promise<List> {
    try {
      // Validate UUID format
      if (!isValidUuid(id)) {
        const error = new Error(`Invalid list ID format: ${id}`);
        (error as any).code = ApiResponseCode.VALIDATION_ERROR;
        throw error;
      }

      // Validate input data
      const { error, value } = updateListSchema.validate(input);
      if (error) {
        const validationError = new Error(`Validation failed: ${error.details[0]?.message}`);
        (validationError as any).code = ApiResponseCode.VALIDATION_ERROR;
        (validationError as any).details = error.details;
        throw validationError;
      }

      // Check if list exists
      const existingList = await listRepository.getListById(id);
      if (!existingList) {
        const error = new Error(`List with ID '${id}' not found`);
        (error as any).code = ApiResponseCode.NOT_FOUND;
        throw error;
      }

      // Additional business logic validation for updates
      if (value.name) {
        await this.validateListBusinessRules(value, id);
      }

      // Update list through repository
      const updatedList = await listRepository.updateList(id, value);
      
      if (!updatedList) {
        const error = new Error(`Failed to update list with ID '${id}'`);
        (error as any).code = ApiResponseCode.INTERNAL_ERROR;
        throw error;
      }

      logger.info('List updated successfully via service', {
        listId: id,
        updates: value,
        newName: updatedList.name,
      });

      return updatedList;
    } catch (error) {
      logger.error('Error in updateList service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        listId: id,
        input,
      });
      throw error;
    }
  }

  /**
   * Delete a list with smart task handling
   */
  async deleteList(
    id: string, 
    options: {
      deleteAssociatedTasks?: boolean;
      moveTasksToListId?: string;
    } = {}
  ): Promise<void> {
    try {
      // Validate UUID format
      if (!isValidUuid(id)) {
        const error = new Error(`Invalid list ID format: ${id}`);
        (error as any).code = ApiResponseCode.VALIDATION_ERROR;
        throw error;
      }

      // Check if list exists
      const existingList = await listRepository.getListById(id);
      if (!existingList) {
        const error = new Error(`List with ID '${id}' not found`);
        (error as any).code = ApiResponseCode.NOT_FOUND;
        throw error;
      }

      const { deleteAssociatedTasks = true, moveTasksToListId } = options;

      // If moving tasks to another list, validate target list
      if (moveTasksToListId) {
        if (!isValidUuid(moveTasksToListId)) {
          const error = new Error(`Invalid target list ID format: ${moveTasksToListId}`);
          (error as any).code = ApiResponseCode.VALIDATION_ERROR;
          throw error;
        }

        const targetList = await listRepository.getListById(moveTasksToListId);
        if (!targetList) {
          const error = new Error(`Target list with ID '${moveTasksToListId}' not found`);
          (error as any).code = ApiResponseCode.NOT_FOUND;
          throw error;
        }

        // Move all tasks to target list before deletion
        await this.moveAllTasksToList(id, moveTasksToListId);
      }

      // Delete the list
      const success = await listRepository.deleteList(id, deleteAssociatedTasks);
      
      if (!success) {
        const error = new Error(`Failed to delete list with ID '${id}'`);
        (error as any).code = ApiResponseCode.INTERNAL_ERROR;
        throw error;
      }

      logger.info('List deleted successfully via service', {
        listId: id,
        name: existingList.name,
        deleteAssociatedTasks,
        moveTasksToListId,
        tasksCount: existingList.tasks_count,
      });
    } catch (error) {
      logger.error('Error in deleteList service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        listId: id,
        options,
      });
      throw error;
    }
  }

  /**
   * Get list with all its tasks
   */
  async getListWithTasks(
    id: string,
    taskFilters?: Omit<any, 'list_id'>,
    taskSort?: SortParams,
    taskPage: number = 1,
    taskLimit: number = 50
  ): Promise<{
    list: List;
    tasks: any[];
    tasksPagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      // Get the list
      const list = await this.getListById(id);

      // Calculate task pagination offset
      const taskOffset = (taskPage - 1) * taskLimit;

      // Get tasks for this list
      const { tasks, total: tasksTotal } = await taskRepository.getTasksByListId(
        id,
        taskFilters,
        taskSort,
        taskLimit,
        taskOffset
      );

      // Calculate task pagination metadata
      const tasksTotalPages = Math.ceil(tasksTotal / taskLimit);
      const tasksHasNext = taskPage < tasksTotalPages;
      const tasksHasPrev = taskPage > 1;

      logger.debug('Retrieved list with tasks successfully', {
        listId: id,
        listName: list.name,
        tasksTotal,
        tasksReturned: tasks.length,
        taskPage,
        taskLimit,
      });

      return {
        list,
        tasks,
        tasksPagination: {
          total: tasksTotal,
          page: taskPage,
          limit: taskLimit,
          totalPages: tasksTotalPages,
          hasNext: tasksHasNext,
          hasPrev: tasksHasPrev,
        },
      };
    } catch (error) {
      logger.error('Error in getListWithTasks service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        listId: id,
        taskFilters,
        taskSort,
        taskPage,
        taskLimit,
      });
      throw error;
    }
  }

  /**
   * Get statistics for a list
   */
  async getListStatistics(id: string): Promise<{
    list: List;
    stats: {
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
      completionPercentage: number;
      tasksByPriority: {
        high: number;
        medium: number;
        low: number;
      };
      overdueTasksCount: number;
      upcomingTasksCount: number; // Due within 7 days
    };
  }> {
    try {
      // Get the list
      const list = await this.getListById(id);

      // Get all tasks for this list
      const { tasks } = await taskRepository.getTasksByListId(id);

      // Calculate statistics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'completed').length;
      const pendingTasks = totalTasks - completedTasks;
      const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const tasksByPriority = {
        high: tasks.filter(task => task.priority === 'high').length,
        medium: tasks.filter(task => task.priority === 'medium').length,
        low: tasks.filter(task => task.priority === 'low').length,
      };

      const now = new Date();
      const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

      const overdueTasksCount = tasks.filter(task => 
        task.deadline && 
        task.status === 'pending' && 
        new Date(task.deadline) < now
      ).length;

      const upcomingTasksCount = tasks.filter(task => 
        task.deadline && 
        task.status === 'pending' && 
        new Date(task.deadline) >= now && 
        new Date(task.deadline) <= nextWeek
      ).length;

      const stats = {
        totalTasks,
        completedTasks,
        pendingTasks,
        completionPercentage,
        tasksByPriority,
        overdueTasksCount,
        upcomingTasksCount,
      };

      logger.debug('Generated list statistics', {
        listId: id,
        stats,
      });

      return { list, stats };
    } catch (error) {
      logger.error('Error in getListStatistics service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        listId: id,
      });
      throw error;
    }
  }

  /**
   * Validate business rules for list operations
   */
  private async validateListBusinessRules(input: CreateListInput | UpdateListInput, excludeId?: string): Promise<void> {
    // Check name uniqueness
    if (input.name) {
      const isUnique = await listRepository.isListNameUnique(input.name, excludeId);
      if (!isUnique) {
        const error = new Error(`A list with the name '${input.name}' already exists`);
        (error as any).code = ApiResponseCode.CONFLICT;
        throw error;
      }
    }

    // Additional business rules can be added here
    // For example: maximum number of lists per user, forbidden names, etc.
  }

  /**
   * Move all tasks from one list to another
   */
  private async moveAllTasksToList(fromListId: string, toListId: string): Promise<void> {
    try {
      const { tasks } = await taskRepository.getTasksByListId(fromListId);
      
      for (const task of tasks) {
        await taskRepository.updateTask(task.id, { list_id: toListId });
      }

      logger.info('Moved all tasks between lists', {
        fromListId,
        toListId,
        tasksCount: tasks.length,
      });
    } catch (error) {
      logger.error('Error moving tasks between lists', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fromListId,
        toListId,
      });
      throw error;
    }
  }
}

// Create and export singleton instance
export const listService = new ListService();

export default listService;
