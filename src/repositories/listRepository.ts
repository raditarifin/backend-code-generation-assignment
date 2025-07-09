import { List, CreateListInput, UpdateListInput, ListFilterParams, SortParams } from '../models';
import { memoryStore } from '../storage';
import { generateId } from '../utils/idGenerator';
import { logger } from '../utils/logger';

/**
 * Repository class for List entity operations
 * Provides data access abstraction over the memory store
 */
export class ListRepository {
  /**
   * Get all lists with optional filtering and sorting
   */
  async getAllLists(
    filters?: ListFilterParams,
    sort?: SortParams,
    limit?: number,
    offset?: number
  ): Promise<{ lists: List[]; total: number }> {
    try {
      let lists = memoryStore.getAllLists();
      const total = lists.length;

      // Apply search filter
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        lists = lists.filter(
          list =>
            list.name.toLowerCase().includes(searchTerm) ||
            (list.description && list.description.toLowerCase().includes(searchTerm))
        );
      }

      // Apply sorting
      if (sort) {
        lists = this.sortLists(lists, sort);
      } else {
        // Default sort by created_at descending
        lists = this.sortLists(lists, { field: 'created_at', order: 'desc' });
      }

      // Apply pagination
      if (limit !== undefined && offset !== undefined) {
        lists = lists.slice(offset, offset + limit);
      }

      logger.debug('Retrieved lists', {
        total,
        filtered: lists.length,
        filters,
        sort,
        limit,
        offset,
      });

      return { lists, total };
    } catch (error) {
      logger.error('Error getting all lists', { error: error instanceof Error ? error.message : 'Unknown error', filters, sort });
      throw error;
    }
  }

  /**
   * Get list by ID
   */
  async getListById(id: string): Promise<List | null> {
    try {
      const list = memoryStore.getListById(id);
      
      if (!list) {
        logger.debug('List not found', { listId: id });
        return null;
      }

      logger.debug('Retrieved list by ID', { listId: id, name: list.name });
      return list;
    } catch (error) {
      logger.error('Error getting list by ID', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        listId: id 
      });
      throw error;
    }
  }

  /**
   * Create a new list
   */
  async createList(input: CreateListInput): Promise<List> {
    try {
      const now = new Date();
      const list: List = {
        id: generateId(),
        name: input.name.trim(),
        ...(input.description && { description: input.description.trim() }),
        ...(input.color && { color: input.color }),
        tasks_count: 0,
        created_at: now,
        updated_at: now,
      };

      // Validate list name uniqueness
      const existingLists = memoryStore.getAllLists();
      const isDuplicate = existingLists.some(
        existingList => existingList.name.toLowerCase() === list.name.toLowerCase()
      );

      if (isDuplicate) {
        const error = new Error(`List with name '${list.name}' already exists`);
        logger.warn('Attempted to create duplicate list', { name: list.name });
        throw error;
      }

      memoryStore.createList(list);

      logger.info('List created successfully', {
        listId: list.id,
        name: list.name,
        description: list.description,
        color: list.color,
      });

      return list;
    } catch (error) {
      logger.error('Error creating list', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        input 
      });
      throw error;
    }
  }

  /**
   * Update an existing list
   */
  async updateList(id: string, input: UpdateListInput): Promise<List | null> {
    try {
      // Check if list exists
      const existingList = memoryStore.getListById(id);
      if (!existingList) {
        logger.debug('List not found for update', { listId: id });
        return null;
      }

      // Validate name uniqueness if name is being updated
      if (input.name) {
        const trimmedName = input.name.trim();
        const allLists = memoryStore.getAllLists();
        const isDuplicate = allLists.some(
          list => list.id !== id && list.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (isDuplicate) {
          const error = new Error(`List with name '${trimmedName}' already exists`);
          logger.warn('Attempted to update list with duplicate name', { 
            listId: id, 
            newName: trimmedName 
          });
          throw error;
        }
      }

      // Prepare update data
      const updateData: Partial<List> = {
        ...input,
        updated_at: new Date(),
      };

      // Trim string fields
      if (updateData.name) {
        updateData.name = updateData.name.trim();
      }
      if (updateData.description) {
        updateData.description = updateData.description.trim();
      }

      const success = memoryStore.updateList(id, updateData);
      
      if (!success) {
        logger.error('Failed to update list in memory store', { listId: id, updateData });
        return null;
      }

      const updatedList = memoryStore.getListById(id);
      
      logger.info('List updated successfully', {
        listId: id,
        updates: updateData,
        newName: updatedList?.name,
      });

      return updatedList || null;
    } catch (error) {
      logger.error('Error updating list', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        listId: id, 
        input 
      });
      throw error;
    }
  }

  /**
   * Delete a list
   */
  async deleteList(id: string, deleteAssociatedTasks: boolean = true): Promise<boolean> {
    try {
      // Check if list exists
      const existingList = memoryStore.getListById(id);
      if (!existingList) {
        logger.debug('List not found for deletion', { listId: id });
        return false;
      }

      // Get tasks count before deletion for logging
      const tasks = memoryStore.getTasksByListId(id);
      const tasksCount = tasks.length;

      const success = memoryStore.deleteList(id, deleteAssociatedTasks);
      
      if (success) {
        logger.info('List deleted successfully', {
          listId: id,
          name: existingList.name,
          deleteAssociatedTasks,
          deletedTasksCount: deleteAssociatedTasks ? tasksCount : 0,
        });
      } else {
        logger.error('Failed to delete list from memory store', { listId: id });
      }

      return success;
    } catch (error) {
      logger.error('Error deleting list', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        listId: id, 
        deleteAssociatedTasks 
      });
      throw error;
    }
  }

  /**
   * Check if a list exists
   */
  async listExists(id: string): Promise<boolean> {
    try {
      const list = memoryStore.getListById(id);
      return list !== undefined;
    } catch (error) {
      logger.error('Error checking if list exists', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        listId: id 
      });
      throw error;
    }
  }

  /**
   * Get lists count
   */
  async getListsCount(filters?: ListFilterParams): Promise<number> {
    try {
      const { total } = await this.getAllLists(filters);
      return total;
    } catch (error) {
      logger.error('Error getting lists count', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        filters 
      });
      throw error;
    }
  }

  /**
   * Check if list name is unique
   */
  async isListNameUnique(name: string, excludeId?: string): Promise<boolean> {
    try {
      const lists = memoryStore.getAllLists();
      const trimmedName = name.trim().toLowerCase();
      
      return !lists.some(
        list => 
          list.name.toLowerCase() === trimmedName && 
          (excludeId ? list.id !== excludeId : true)
      );
    } catch (error) {
      logger.error('Error checking list name uniqueness', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        name, 
        excludeId 
      });
      throw error;
    }
  }

  /**
   * Sort lists based on sort parameters
   */
  private sortLists(lists: List[], sort: SortParams): List[] {
    return lists.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created_at':
          comparison = a.created_at.getTime() - b.created_at.getTime();
          break;
        case 'updated_at':
          comparison = a.updated_at.getTime() - b.updated_at.getTime();
          break;
        case 'tasks_count':
          comparison = a.tasks_count - b.tasks_count;
          break;
        default:
          comparison = a.created_at.getTime() - b.created_at.getTime();
      }

      return sort.order === 'desc' ? -comparison : comparison;
    });
  }
}

// Create and export singleton instance
export const listRepository = new ListRepository();

export default listRepository;
