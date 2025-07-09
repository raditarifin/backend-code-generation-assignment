import { List, Task, TaskStatus, TaskPriority } from '../models';
import { logger } from '../utils/logger';

/**
 * Interface for indexed storage to optimize queries
 */
interface StorageIndexes {
  tasksByListId: Map<string, Set<string>>;
  tasksByStatus: Map<TaskStatus, Set<string>>;
  tasksByPriority: Map<TaskPriority, Set<string>>;
  tasksByDeadlineDate: Map<string, Set<string>>; // Format: YYYY-MM-DD
}

/**
 * Interface for memory store statistics
 */
interface MemoryStoreStats {
  listsCount: number;
  tasksCount: number;
  memoryUsage: number; // Estimated in bytes
  lastAccessed: Date;
  operationsCount: number;
}

/**
 * In-memory storage class with performance optimizations
 */
export class MemoryStore {
  private lists: Map<string, List>;
  private tasks: Map<string, Task>;
  private indexes: StorageIndexes;
  private maxSize: number;
  private stats: MemoryStoreStats;
  private enableFileBackup: boolean;
  private backupFilePath: string | undefined;

  constructor(maxSize: number = 10000, enableFileBackup: boolean = false, backupFilePath?: string) {
    this.lists = new Map();
    this.tasks = new Map();
    this.maxSize = maxSize;
    this.enableFileBackup = enableFileBackup;
    this.backupFilePath = backupFilePath;
    
    // Initialize indexes for performance optimization
    this.indexes = {
      tasksByListId: new Map(),
      tasksByStatus: new Map(),
      tasksByPriority: new Map(),
      tasksByDeadlineDate: new Map(),
    };

    // Initialize statistics
    this.stats = {
      listsCount: 0,
      tasksCount: 0,
      memoryUsage: 0,
      lastAccessed: new Date(),
      operationsCount: 0,
    };

    logger.info('MemoryStore initialized', {
      maxSize: this.maxSize,
      enableFileBackup: this.enableFileBackup,
      backupFilePath: this.backupFilePath,
    });
  }

  // ===============================
  // LIST OPERATIONS
  // ===============================

  /**
   * Get all lists
   */
  getAllLists(): List[] {
    this.updateStats();
    return Array.from(this.lists.values());
  }

  /**
   * Get list by ID
   */
  getListById(id: string): List | undefined {
    this.updateStats();
    return this.lists.get(id);
  }

  /**
   * Create a new list
   */
  createList(list: List): void {
    this.checkCapacity();
    this.updateStats();
    
    this.lists.set(list.id, list);
    this.stats.listsCount++;
    
    logger.debug('List created', { listId: list.id, name: list.name });
    this.backupToFile();
  }

  /**
   * Update an existing list
   */
  updateList(id: string, updates: Partial<List>): boolean {
    this.updateStats();
    
    const existingList = this.lists.get(id);
    if (!existingList) {
      return false;
    }

    const updatedList: List = {
      ...existingList,
      ...updates,
      id, // Ensure ID cannot be changed
      updated_at: new Date(),
    };

    this.lists.set(id, updatedList);
    logger.debug('List updated', { listId: id, updates });
    this.backupToFile();
    return true;
  }

  /**
   * Delete a list and optionally handle its tasks
   */
  deleteList(id: string, deleteAssociatedTasks: boolean = true): boolean {
    this.updateStats();
    
    const list = this.lists.get(id);
    if (!list) {
      return false;
    }

    if (deleteAssociatedTasks) {
      // Delete all tasks in this list
      const taskIds = this.indexes.tasksByListId.get(id);
      if (taskIds) {
        for (const taskId of taskIds) {
          this.deleteTask(taskId);
        }
      }
    }

    this.lists.delete(id);
    this.stats.listsCount--;
    
    logger.debug('List deleted', { listId: id, deleteAssociatedTasks });
    this.backupToFile();
    return true;
  }

  // ===============================
  // TASK OPERATIONS
  // ===============================

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    this.updateStats();
    return Array.from(this.tasks.values());
  }

  /**
   * Get task by ID
   */
  getTaskById(id: string): Task | undefined {
    this.updateStats();
    return this.tasks.get(id);
  }

  /**
   * Get tasks by list ID
   */
  getTasksByListId(listId: string): Task[] {
    this.updateStats();
    const taskIds = this.indexes.tasksByListId.get(listId);
    if (!taskIds) {
      return [];
    }
    
    return Array.from(taskIds)
      .map(id => this.tasks.get(id))
      .filter((task): task is Task => task !== undefined);
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: TaskStatus): Task[] {
    this.updateStats();
    const taskIds = this.indexes.tasksByStatus.get(status);
    if (!taskIds) {
      return [];
    }
    
    return Array.from(taskIds)
      .map(id => this.tasks.get(id))
      .filter((task): task is Task => task !== undefined);
  }

  /**
   * Get tasks by priority
   */
  getTasksByPriority(priority: TaskPriority): Task[] {
    this.updateStats();
    const taskIds = this.indexes.tasksByPriority.get(priority);
    if (!taskIds) {
      return [];
    }
    
    return Array.from(taskIds)
      .map(id => this.tasks.get(id))
      .filter((task): task is Task => task !== undefined);
  }

  /**
   * Get tasks by deadline date range
   */
  getTasksByDeadlineRange(fromDate: Date, toDate: Date): Task[] {
    this.updateStats();
    const tasks: Task[] = [];
    
    // Iterate through date range and collect tasks
    const currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      const dateKey = this.formatDateKey(currentDate);
      const taskIds = this.indexes.tasksByDeadlineDate.get(dateKey);
      
      if (taskIds) {
        for (const taskId of taskIds) {
          const task = this.tasks.get(taskId);
          if (task) {
            tasks.push(task);
          }
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return tasks;
  }

  /**
   * Create a new task
   */
  createTask(task: Task): void {
    this.checkCapacity();
    this.updateStats();
    
    this.tasks.set(task.id, task);
    this.updateTaskIndexes(task);
    this.stats.tasksCount++;
    
    // Update list task count
    this.updateListTaskCount(task.list_id);
    
    logger.debug('Task created', { taskId: task.id, listId: task.list_id, title: task.title });
    this.backupToFile();
  }

  /**
   * Update an existing task
   */
  updateTask(id: string, updates: Partial<Task>): boolean {
    this.updateStats();
    
    const existingTask = this.tasks.get(id);
    if (!existingTask) {
      return false;
    }

    // Remove from old indexes
    this.removeTaskFromIndexes(existingTask);

    const updatedTask: Task = {
      ...existingTask,
      ...updates,
      id, // Ensure ID cannot be changed
      updated_at: new Date(),
    };

    // If task is being marked as completed, set completed_at
    if (updates.status === TaskStatus.COMPLETED && existingTask.status !== TaskStatus.COMPLETED) {
      updatedTask.completed_at = new Date();
    }

    // If task is being marked as pending, remove completed_at
    if (updates.status === TaskStatus.PENDING) {
      delete updatedTask.completed_at;
    }

    this.tasks.set(id, updatedTask);
    this.updateTaskIndexes(updatedTask);

    // Update list task counts if list changed
    if (updates.list_id && updates.list_id !== existingTask.list_id) {
      this.updateListTaskCount(existingTask.list_id);
      this.updateListTaskCount(updates.list_id);
    }
    
    logger.debug('Task updated', { taskId: id, updates });
    this.backupToFile();
    return true;
  }

  /**
   * Delete a task
   */
  deleteTask(id: string): boolean {
    this.updateStats();
    
    const task = this.tasks.get(id);
    if (!task) {
      return false;
    }

    this.removeTaskFromIndexes(task);
    this.tasks.delete(id);
    this.stats.tasksCount--;
    
    // Update list task count
    this.updateListTaskCount(task.list_id);
    
    logger.debug('Task deleted', { taskId: id, listId: task.list_id });
    this.backupToFile();
    return true;
  }

  // ===============================
  // INDEX MANAGEMENT
  // ===============================

  private updateTaskIndexes(task: Task): void {
    // Index by list ID
    if (!this.indexes.tasksByListId.has(task.list_id)) {
      this.indexes.tasksByListId.set(task.list_id, new Set());
    }
    this.indexes.tasksByListId.get(task.list_id)!.add(task.id);

    // Index by status
    if (!this.indexes.tasksByStatus.has(task.status)) {
      this.indexes.tasksByStatus.set(task.status, new Set());
    }
    this.indexes.tasksByStatus.get(task.status)!.add(task.id);

    // Index by priority
    if (!this.indexes.tasksByPriority.has(task.priority)) {
      this.indexes.tasksByPriority.set(task.priority, new Set());
    }
    this.indexes.tasksByPriority.get(task.priority)!.add(task.id);

    // Index by deadline date
    if (task.deadline) {
      const dateKey = this.formatDateKey(task.deadline);
      if (!this.indexes.tasksByDeadlineDate.has(dateKey)) {
        this.indexes.tasksByDeadlineDate.set(dateKey, new Set());
      }
      this.indexes.tasksByDeadlineDate.get(dateKey)!.add(task.id);
    }
  }

  private removeTaskFromIndexes(task: Task): void {
    // Remove from list ID index
    const listTasks = this.indexes.tasksByListId.get(task.list_id);
    if (listTasks) {
      listTasks.delete(task.id);
      if (listTasks.size === 0) {
        this.indexes.tasksByListId.delete(task.list_id);
      }
    }

    // Remove from status index
    const statusTasks = this.indexes.tasksByStatus.get(task.status);
    if (statusTasks) {
      statusTasks.delete(task.id);
      if (statusTasks.size === 0) {
        this.indexes.tasksByStatus.delete(task.status);
      }
    }

    // Remove from priority index
    const priorityTasks = this.indexes.tasksByPriority.get(task.priority);
    if (priorityTasks) {
      priorityTasks.delete(task.id);
      if (priorityTasks.size === 0) {
        this.indexes.tasksByPriority.delete(task.priority);
      }
    }

    // Remove from deadline index
    if (task.deadline) {
      const dateKey = this.formatDateKey(task.deadline);
      const deadlineTasks = this.indexes.tasksByDeadlineDate.get(dateKey);
      if (deadlineTasks) {
        deadlineTasks.delete(task.id);
        if (deadlineTasks.size === 0) {
          this.indexes.tasksByDeadlineDate.delete(dateKey);
        }
      }
    }
  }

  private updateListTaskCount(listId: string): void {
    const list = this.lists.get(listId);
    if (list) {
      const taskIds = this.indexes.tasksByListId.get(listId);
      list.tasks_count = taskIds ? taskIds.size : 0;
      list.updated_at = new Date();
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private formatDateKey(date: Date): string {
    return date.toISOString().split('T')?.[0] || ''; // YYYY-MM-DD format
  }

  private checkCapacity(): void {
    const totalEntities = this.lists.size + this.tasks.size;
    if (totalEntities >= this.maxSize) {
      const error = new Error(`Memory store capacity exceeded. Maximum: ${this.maxSize}, Current: ${totalEntities}`);
      logger.error('Memory store capacity exceeded', {
        maxSize: this.maxSize,
        currentSize: totalEntities,
        listsCount: this.lists.size,
        tasksCount: this.tasks.size,
      });
      throw error;
    }
  }

  private updateStats(): void {
    this.stats.lastAccessed = new Date();
    this.stats.operationsCount++;
    this.stats.memoryUsage = this.estimateMemoryUsage();
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let usage = 0;
    
    // Estimate lists memory
    for (const list of this.lists.values()) {
      usage += JSON.stringify(list).length * 2; // Approximate character size
    }
    
    // Estimate tasks memory
    for (const task of this.tasks.values()) {
      usage += JSON.stringify(task).length * 2; // Approximate character size
    }
    
    // Add index overhead (rough estimation)
    usage += this.indexes.tasksByListId.size * 50;
    usage += this.indexes.tasksByStatus.size * 50;
    usage += this.indexes.tasksByPriority.size * 50;
    usage += this.indexes.tasksByDeadlineDate.size * 50;
    
    return usage;
  }

  private backupToFile(): void {
    if (!this.enableFileBackup || !this.backupFilePath) {
      return;
    }

    // This would be implemented with actual file I/O
    // For now, just log the intent
    logger.debug('Backing up data to file', {
      filePath: this.backupFilePath,
      listsCount: this.lists.size,
      tasksCount: this.tasks.size,
    });
  }

  // ===============================
  // MONITORING AND ADMIN
  // ===============================

  /**
   * Get memory store statistics
   */
  getStats(): MemoryStoreStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Clear all data (use with caution)
   */
  clear(): void {
    this.lists.clear();
    this.tasks.clear();
    this.indexes.tasksByListId.clear();
    this.indexes.tasksByStatus.clear();
    this.indexes.tasksByPriority.clear();
    this.indexes.tasksByDeadlineDate.clear();
    
    this.stats.listsCount = 0;
    this.stats.tasksCount = 0;
    this.stats.operationsCount = 0;
    
    logger.warn('Memory store cleared');
  }

  /**
   * Get index information for debugging
   */
  getIndexInfo(): Record<string, any> {
    return {
      tasksByListId: Object.fromEntries(
        Array.from(this.indexes.tasksByListId.entries()).map(([key, value]) => [key, value.size])
      ),
      tasksByStatus: Object.fromEntries(
        Array.from(this.indexes.tasksByStatus.entries()).map(([key, value]) => [key, value.size])
      ),
      tasksByPriority: Object.fromEntries(
        Array.from(this.indexes.tasksByPriority.entries()).map(([key, value]) => [key, value.size])
      ),
      tasksByDeadlineDate: Object.fromEntries(
        Array.from(this.indexes.tasksByDeadlineDate.entries()).map(([key, value]) => [key, value.size])
      ),
    };
  }
}

// Create and export singleton instance
const memoryStore = new MemoryStore(
  Number(process.env.MEMORY_STORE_MAX_SIZE) || 10000,
  process.env.ENABLE_FILE_PERSISTENCE === 'true',
  process.env.PERSISTENCE_FILE_PATH
);

export default memoryStore;
